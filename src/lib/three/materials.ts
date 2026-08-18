import * as THREE from 'three'
import { QUALITY, texSize } from './quality'
import {
  fbm,
  heightCanvas,
  normalCanvas,
  weaveHeight,
  carpetHeight,
  brushedHeight,
  paperHeight,
  ceramicHeight,
  woodHeight,
  peelHeight,
  paintHeight,
} from './noise'

/**
 * Shared material factory.
 *
 * Every material carries a procedural normal + roughness map so light has
 * something to break up. Flat colour with a single roughness value is what made
 * the first pass read as plastic; a weave on the upholstery, brush marks on the
 * aluminium and roller texture on the painted panels fixes most of it before
 * any post-processing is involved.
 *
 * Maps are generated once per surface type and shared. `repeat` is baked into a
 * cached clone, so a 7 m wall and a 0.4 m stool seat get correct texel density
 * without regenerating pixels.
 */

const materialCache = new Map<string, THREE.Material>()
const surfaceCache = new Map<string, { normal: THREE.CanvasTexture; roughness: THREE.CanvasTexture; bump: THREE.CanvasTexture; normalScale: number }>()
const textureCache = new Map<string, any>()

/* ── surface definitions ─────────────────────────────────────────────────── */

const SURFACES: Record<string, { build: (s: number) => Float32Array; size: number; normalScale: number; rough: [number, number]; seed: number }> = {
  paint: { build: paintHeight, size: 512, normalScale: 0.18, rough: [0.82, 1.0], seed: 66 },
  fabric: { build: (s) => weaveHeight(s, { threads: 40 }), size: 512, normalScale: 0.75, rough: [0.86, 1.0], seed: 7 },
  canvas: { build: (s) => weaveHeight(s, { threads: 22, softness: 0.28 }), size: 512, normalScale: 1.05, rough: [0.88, 1.0], seed: 8 },
  carpet: { build: carpetHeight, size: 512, normalScale: 0.9, rough: [0.9, 1.0], seed: 11 },
  metal: { build: brushedHeight, size: 512, normalScale: 0.22, rough: [0.55, 1.0], seed: 3 },
  paper: { build: paperHeight, size: 512, normalScale: 0.4, rough: [0.85, 1.0], seed: 21 },
  ceramic: { build: ceramicHeight, size: 512, normalScale: 0.16, rough: [0.5, 1.0], seed: 33 },
  wood: { build: woodHeight, size: 512, normalScale: 0.45, rough: [0.7, 1.0], seed: 44 },
  peel: { build: peelHeight, size: 512, normalScale: 0.3, rough: [0.8, 1.0], seed: 55 },
  concrete: {
    build: (s) => fbm(s, { octaves: 4, cells: 10, gain: 0.55, seed: 77 }),
    size: 512,
    normalScale: 0.35,
    rough: [0.88, 1.0],
    seed: 77,
  },
}

/** Height field → roughness map in the [lo, hi] band (three multiplies by .g). */
function roughnessCanvas(size: number, height: Float32Array, [lo, hi]: [number, number]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.createImageData(size, size)
  for (let i = 0; i < height.length; i++) {
    const v = (lo + (hi - lo) * height[i]) * 255
    const p = i * 4
    image.data[p] = image.data[p + 1] = image.data[p + 2] = v
    image.data[p + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

function buildSurface(name: string) {
  if (surfaceCache.has(name)) return surfaceCache.get(name)!
  const def = SURFACES[name]
  if (!def) throw new Error(`Unknown surface "${name}"`)

  const size = texSize(def.size)
  const height = def.build(size)

  const normal = new THREE.CanvasTexture(normalCanvas(size, height, def.normalScale * 3))
  normal.colorSpace = THREE.NoColorSpace
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping

  const roughness = new THREE.CanvasTexture(roughnessCanvas(size, height, def.rough))
  roughness.colorSpace = THREE.NoColorSpace
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping

  const bump = new THREE.CanvasTexture(heightCanvas(size, height))
  bump.colorSpace = THREE.NoColorSpace
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping

  const surface = { normal, roughness, bump, normalScale: def.normalScale }
  surfaceCache.set(name, surface)
  return surface
}

/**
 * Maps for a surface at a given tiling.
 */
export function surface(name: string, repeat = 1) {
  const key = `${name}|${repeat}`
  if (textureCache.has(key)) return textureCache.get(key)

  const base = buildSurface(name)
  const make = (tex: THREE.CanvasTexture) => {
    if (repeat === 1) return tex
    const clone = tex.clone()
    clone.wrapS = clone.wrapT = THREE.RepeatWrapping
    clone.repeat.set(repeat, repeat)
    clone.needsUpdate = true
    return clone
  }

  const maps = {
    normalMap: make(base.normal),
    roughnessMap: make(base.roughness),
    normalScale: new THREE.Vector2(base.normalScale, base.normalScale),
  }
  textureCache.set(key, maps)
  return maps
}

function keyed<T extends THREE.Material>(key: string, make: () => T): T {
  if (materialCache.has(key)) return materialCache.get(key) as T
  const m = make()
  materialCache.set(key, m)
  return m
}

/* ── the palette ─────────────────────────────────────────────────────────── */

export const mat = {
  /** Painted MDF / booth panel. */
  panel: (color: THREE.ColorRepresentation = 0xf3f4f7, roughness = 0.74, repeat = 3) =>
    keyed(`panel:${color}:${roughness}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness: 0.0,
        ...surface('paint', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.55,
      })
    ),

  /** Soft-touch plastic for furniture shells. */
  plastic: (color: THREE.ColorRepresentation = 0xdfe3ea, roughness = 0.64, repeat = 2) =>
    keyed(`plastic:${color}:${roughness}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness: 0.0,
        ...surface('peel', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.6,
      })
    ),

  /**
   * Brushed aluminium for truss, legs and frames. Roughness 0.52 is a satin
   * anodised finish; below about 0.35 a metal starts mirroring the sky and
   * every leg in the scene turns into a light source.
   */
  metal: (color: THREE.ColorRepresentation = 0xb9bec7, roughness = 0.52, repeat = 2) =>
    keyed(`metal:${color}:${roughness}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness: 0.78,
        ...surface('metal', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.85,
      })
    ),

  /** Dark anodised trim. */
  dark: (color: THREE.ColorRepresentation = 0x22262f, repeat = 2) =>
    keyed(`dark:${color}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.62,
        metalness: 0.2,
        ...surface('peel', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.6,
      })
    ),

  /** Upholstery. */
  fabric: (color: THREE.ColorRepresentation = 0x4a5162, repeat = 5) =>
    keyed(`fabric:${color}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.96,
        metalness: 0,
        ...surface('fabric', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.4,
      })
    ),

  /** Heavier cotton weave: tote bags, drapes. */
  canvasCloth: (color: THREE.ColorRepresentation = 0xf1ede2, repeat = 6) =>
    keyed(`canvas:${color}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.98,
        metalness: 0,
        side: THREE.DoubleSide,
        ...surface('canvas', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.4,
      })
    ),

  /** Glazed ceramic. */
  ceramic: (color: THREE.ColorRepresentation = 0xffffff, repeat = 2) =>
    keyed(`ceramic:${color}:${repeat}`, () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.36,
        metalness: 0.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.24,
        ...surface('ceramic', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.7,
      })
    ),

  /** Light-diffusing acrylic (lightboxes, glowing edges). */
  acrylic: (color: THREE.ColorRepresentation = 0xffffff, emissive: THREE.ColorRepresentation = 0xffffff, intensity = 0.16) =>
    keyed(`acrylic:${color}:${emissive}:${intensity}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: intensity,
        roughness: 0.48,
        metalness: 0,
        envMapIntensity: QUALITY.envMapIntensity * 0.4,
      })
    ),

  glass: () =>
    keyed('glass', () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        thickness: 0.3,
        roughness: 0.16,
        metalness: 0,
        ior: 1.46,
        transparent: true,
        opacity: 0.3,
        envMapIntensity: QUALITY.envMapIntensity * 0.7,
      })
    ),

  wood: (color: THREE.ColorRepresentation = 0xc09468, repeat = 2) =>
    keyed(`wood:${color}:${repeat}`, () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.7,
        metalness: 0.0,
        clearcoat: 0.06,
        clearcoatRoughness: 0.6,
        ...surface('wood', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.55,
      })
    ),

  paper: (color: THREE.ColorRepresentation = 0xfaf8f2, repeat = 2) =>
    keyed(`paper:${color}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.94,
        metalness: 0,
        ...surface('paper', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.45,
      })
    ),

  concrete: (color: THREE.ColorRepresentation = 0xdfe1e6, repeat = 8) =>
    keyed(`concrete:${color}:${repeat}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.96,
        metalness: 0,
        ...surface('concrete', repeat),
        envMapIntensity: QUALITY.envMapIntensity * 0.5,
      })
    ),

  /**
   * Printed graphic. The emissive boost is a nudge, not a light: enough to keep
   * artwork from muddying in shadow, small enough that a banner never glows.
   */
  print: (map: THREE.Texture | null, { roughness = 0.8, emissiveBoost = 0.05, repeat = 1 } = {}) =>
    new THREE.MeshStandardMaterial({
      map,
      roughness,
      metalness: 0,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: emissiveBoost,
      ...surface('paper', repeat),
      normalScale: new THREE.Vector2(0.25, 0.25),
      envMapIntensity: QUALITY.envMapIntensity * 0.35,
    }),

  /** Screen / lightbox: emissive artwork, kept below clipping. */
  emissivePrint: (map: THREE.Texture | null, intensity = 0.6) =>
    new THREE.MeshStandardMaterial({
      map,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: intensity,
      roughness: 0.42,
      metalness: 0,
      envMapIntensity: QUALITY.envMapIntensity * 0.3,
    }),

  leaf: (color: THREE.ColorRepresentation = 0x2f8f5b) =>
    keyed(`leaf:${color}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.76,
        metalness: 0,
        side: THREE.DoubleSide,
        alphaMap: leafAlpha(),
        transparent: true,
        alphaTest: 0.45,
        normalMap: buildSurface('paper').normal,
        normalScale: new THREE.Vector2(0.4, 0.4),
        envMapIntensity: QUALITY.envMapIntensity * 0.5,
      })
    ),

  /** Matte untextured tone — dressing that does not need a surface of its own. */
  flat: (color: THREE.ColorRepresentation, roughness = 0.88) =>
    keyed(`flat:${color}:${roughness}`, () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness: 0,
        envMapIntensity: QUALITY.envMapIntensity * 0.45,
      })
    ),
}

/* ── Procedural alpha / colour textures ──────────────────────────────────── */

let _leafAlpha: THREE.CanvasTexture | null = null
export function leafAlpha(): THREE.CanvasTexture {
  if (_leafAlpha) return _leafAlpha
  const size = texSize(256)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(c)
  const s = size / 256
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(128 * s, 6 * s)
  ctx.bezierCurveTo(226 * s, 60 * s, 236 * s, 176 * s, 128 * s, 250 * s)
  ctx.bezierCurveTo(20 * s, 176 * s, 30 * s, 60 * s, 128 * s, 6 * s)
  ctx.fill()

  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 1; i <= 5; i++) {
    const y = (40 + i * 34) * s
    const w = (42 - Math.abs(i - 3) * 6) * s
    ctx.beginPath()
    ctx.ellipse((128 - 70) * s, y, w, 9 * s, -0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse((128 + 70) * s, y, w, 9 * s, 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
  _leafAlpha = new THREE.CanvasTexture(c)
  _leafAlpha.colorSpace = THREE.NoColorSpace
  return _leafAlpha
}

let _gridTex: THREE.CanvasTexture | null = null

export function tileBySize(map: THREE.Texture | null, w: number, d: number, metres = 1): THREE.Texture | null {
  if (!map) return map
  const t = map.clone()
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(w / metres, d / metres)
  t.needsUpdate = true
  return t
}

export function floorGrid(color = '#d8dbe3', line = '#c2c7d3'): THREE.CanvasTexture {
  if (_gridTex) return _gridTex
  const size = texSize(512)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(c)
  const s = size / 256

  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)

  const noise = fbm(64, { octaves: 2, cells: 4, seed: 99 })
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = `rgba(255,255,255,${noise[i * 8 + j] * 0.1})`
      ctx.fillRect((size / 4) * i, (size / 4) * j, size / 4, size / 4)
    }
  }

  ctx.strokeStyle = line
  ctx.lineWidth = 3 * s
  ctx.strokeRect(0, 0, size, size)
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.5 * s
  for (let i = 1; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo((size / 4) * i, 0)
    ctx.lineTo((size / 4) * i, size)
    ctx.moveTo(0, (size / 4) * i)
    ctx.lineTo(size, (size / 4) * i)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  _gridTex = new THREE.CanvasTexture(c)
  _gridTex.colorSpace = THREE.SRGBColorSpace
  _gridTex.wrapS = _gridTex.wrapT = THREE.RepeatWrapping
  _gridTex.anisotropy = 8
  return _gridTex
}

/** Free every cached material and generated texture. */
export function disposeMaterialCache() {
  for (const m of materialCache.values()) m.dispose()
  materialCache.clear()
  for (const s of surfaceCache.values()) {
    s.normal.dispose()
    s.roughness.dispose()
    s.bump.dispose()
  }
  surfaceCache.clear()
  for (const maps of textureCache.values()) {
    maps.normalMap?.dispose()
    maps.roughnessMap?.dispose()
  }
  textureCache.clear()
  _leafAlpha?.dispose()
  _leafAlpha = null
  _gridTex?.dispose()
  _gridTex = null
}
