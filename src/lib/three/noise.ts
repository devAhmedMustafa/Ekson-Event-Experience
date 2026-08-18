/**
 * Tiny procedural texture kit.
 *
 * Every surface in this project is generated, so there are no scanned material
 * maps to load. These build seamless height fields in JS, then derive normal
 * and roughness maps from them — enough micro-variation that lighting has
 * something to catch, at a few kilobytes of code instead of megabytes of PNG.
 */

/** Deterministic PRNG, so a given surface looks the same on every load. */
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Seamlessly tiling value noise.
 * @returns {Float32Array} `size * size` values in 0..1
 */
export function valueNoise(size: number, cells: number, seed = 1): Float32Array {
  const rand = rng(seed)
  const lattice = new Float32Array(cells * cells)
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand()

  const out = new Float32Array(size * size)
  const step = cells / size

  for (let y = 0; y < size; y++) {
    const fy = y * step
    const y0 = Math.floor(fy)
    const ty = smooth(fy - y0)
    const ry0 = (y0 % cells) * cells
    const ry1 = ((y0 + 1) % cells) * cells

    for (let x = 0; x < size; x++) {
      const fx = x * step
      const x0 = Math.floor(fx)
      const tx = smooth(fx - x0)
      const rx0 = x0 % cells
      const rx1 = (x0 + 1) % cells

      const a = lattice[ry0 + rx0]
      const b = lattice[ry0 + rx1]
      const c = lattice[ry1 + rx0]
      const d = lattice[ry1 + rx1]

      out[y * size + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty
    }
  }
  return out
}

/** Stacked octaves of tiling value noise. */
export function fbm(size: number, { octaves = 4, cells = 4, gain = 0.5, seed = 1 } = {}): Float32Array {
  const out = new Float32Array(size * size)
  let amplitude = 1
  let total = 0
  let c = cells

  for (let o = 0; o < octaves; o++) {
    const layer = valueNoise(size, c, seed + o * 101)
    for (let i = 0; i < out.length; i++) out[i] += layer[i] * amplitude
    total += amplitude
    amplitude *= gain
    c = Math.min(size, c * 2)
  }
  for (let i = 0; i < out.length; i++) out[i] /= total
  return out
}

/** Height field → grayscale canvas. */
export function heightCanvas(size: number, height: Float32Array, { contrast = 1, brightness = 0 } = {}): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.createImageData(size, size)
  for (let i = 0; i < height.length; i++) {
    let v = (height[i] - 0.5) * contrast + 0.5 + brightness
    v = Math.max(0, Math.min(1, v)) * 255
    const p = i * 4
    image.data[p] = image.data[p + 1] = image.data[p + 2] = v
    image.data[p + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

/**
 * Sobel a height field into a tangent-space normal map.
 * Wraps at the edges so the result tiles with its source.
 */
export function normalCanvas(size: number, height: Float32Array, strength = 2): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.createImageData(size, size)
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))

      let nx = dx * strength
      let ny = dy * strength
      const nz = 1
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len
      ny /= len

      const p = (y * size + x) * 4
      image.data[p] = (nx * 0.5 + 0.5) * 255
      image.data[p + 1] = (ny * 0.5 + 0.5) * 255
      image.data[p + 2] = (nz / len) * 0.5 * 255 + 127.5
      image.data[p + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

/* ── Named surface height fields ─────────────────────────────────────────── */

/** Over-under woven threads: upholstery, tote canvas. */
export function weaveHeight(size: number, { threads = 32, softness = 0.35, seed = 7 } = {}): Float32Array {
  const out = new Float32Array(size * size)
  const noise = fbm(size, { octaves: 3, cells: 16, seed })
  const period = size / threads

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x % period) / period
      const v = (y % period) / period
      const overUnder = (Math.floor(x / period) + Math.floor(y / period)) % 2 === 0
      const warp = Math.sin(u * Math.PI)
      const weft = Math.sin(v * Math.PI)
      const value = overUnder ? warp * 0.85 + weft * 0.25 : weft * 0.85 + warp * 0.25
      out[y * size + x] = value * (1 - softness) + noise[y * size + x] * softness
    }
  }
  return out
}

/** Cut-pile carpet: dense short fibres. */
export function carpetHeight(size: number, { seed = 11 } = {}): Float32Array {
  const base = fbm(size, { octaves: 2, cells: 48, gain: 0.6, seed })
  const fine = fbm(size, { octaves: 1, cells: size / 3, seed: seed + 9 })
  const out = new Float32Array(size * size)
  for (let i = 0; i < out.length; i++) out[i] = base[i] * 0.45 + fine[i] * 0.55
  return out
}

/** Brushed metal: strong directional streaks. */
export function brushedHeight(size: number, { seed = 3 } = {}): Float32Array {
  const rand = rng(seed)
  const out = new Float32Array(size * size)
  const rows = new Float32Array(size)
  for (let y = 0; y < size; y++) rows[y] = rand()

  const streak = fbm(size, { octaves: 2, cells: 8, seed: seed + 4 })
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const line = rows[(y + Math.floor(streak[y * size + x] * 4)) % size]
      out[y * size + x] = line * 0.75 + streak[y * size + x] * 0.25
    }
  }
  return out
}

/** Paper / uncoated card: fine random fibre. */
export function paperHeight(size: number, { seed = 21 } = {}): Float32Array {
  const coarse = fbm(size, { octaves: 3, cells: 24, gain: 0.55, seed })
  const fibre = fbm(size, { octaves: 1, cells: size / 2, seed: seed + 3 })
  const out = new Float32Array(size * size)
  for (let i = 0; i < out.length; i++) out[i] = coarse[i] * 0.35 + fibre[i] * 0.65
  return out
}

/** Glazed ceramic: near-flat with occasional pinholes. */
export function ceramicHeight(size: number, { seed = 33 } = {}): Float32Array {
  const base = fbm(size, { octaves: 2, cells: 6, seed })
  const out = new Float32Array(size * size)
  const rand = rng(seed + 1)
  for (let i = 0; i < out.length; i++) out[i] = 0.5 + (base[i] - 0.5) * 0.25
  const pinholes = Math.floor(size * size * 0.0002)
  for (let i = 0; i < pinholes; i++) {
    const px = Math.floor(rand() * size)
    const py = Math.floor(rand() * size)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const idx = ((py + dy + size) % size) * size + ((px + dx + size) % size)
        out[idx] -= 0.35 / (1 + Math.abs(dx) + Math.abs(dy))
      }
    }
  }
  return out
}

/** Wood: stretched rings plus grain. */
export function woodHeight(size: number, { rings = 7, seed = 44 } = {}): Float32Array {
  const warp = fbm(size, { octaves: 3, cells: 5, seed })
  const grain = fbm(size, { octaves: 2, cells: size / 4, seed: seed + 2 })
  const out = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const u = x / size + (warp[i] - 0.5) * 0.28
      const ring = Math.abs(Math.sin(u * Math.PI * rings))
      out[i] = ring * 0.7 + grain[i] * 0.3
    }
  }
  return out
}

/** Soft-touch plastic: faint orange-peel. */
export function peelHeight(size: number, { seed = 55 } = {}): Float32Array {
  const base = fbm(size, { octaves: 3, cells: 20, gain: 0.5, seed })
  const out = new Float32Array(size * size)
  for (let i = 0; i < out.length; i++) out[i] = 0.5 + (base[i] - 0.5) * 0.6
  return out
}

/** Painted MDF booth panel: roller texture, very subtle. */
export function paintHeight(size: number, { seed = 66 } = {}): Float32Array {
  const base = fbm(size, { octaves: 3, cells: 12, gain: 0.45, seed })
  const out = new Float32Array(size * size)
  for (let i = 0; i < out.length; i++) out[i] = 0.5 + (base[i] - 0.5) * 0.4
  return out
}
