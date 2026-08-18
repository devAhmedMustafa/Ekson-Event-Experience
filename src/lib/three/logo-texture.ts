import * as THREE from 'three'
import { brand } from '$lib/brand.svelte'

/**
 * Turns the visitor's logo / product image into canvas textures for the 3D
 * scenes. Every generator is cached by a key derived from its inputs.
 */

const cache = new Map<string, THREE.CanvasTexture | THREE.Texture>()
const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

export function clearTextureCache() {
  for (const tex of cache.values()) tex.dispose?.()
  cache.clear()
  imageCache.clear()
}

function memo(key: string, make: () => THREE.CanvasTexture): THREE.CanvasTexture {
  if (cache.has(key)) return cache.get(key) as THREE.CanvasTexture
  const tex = make()
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  cache.set(key, tex)
  return tex
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode that image.'))
    img.src = src
    if (img.complete && img.naturalWidth) resolve(img)
  })
}

export function contrastInk(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#009dd6')
  if (!m) return '#ffffff'
  const r = parseInt(m[1], 16) / 255
  const g = parseInt(m[2], 16) / 255
  const b = parseInt(m[3], 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.55 ? '#10131a' : '#ffffff'
}

/** Decoded logo bitmap, or null if the visitor never supplied one. */
export async function getLogoImage(): Promise<HTMLImageElement | null> {
  const logo = brand.logo
  if (!logo) return null
  if (imageCache.has(logo)) return imageCache.get(logo)!
  const p = loadImage(logo).catch(() => null)
  imageCache.set(logo, p)
  return p
}

export async function getProductImage(): Promise<HTMLImageElement | null> {
  return null
}

export function initials(name: string): string {
  const words = String(name || 'Ekson')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return 'E'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Draw the logo into a canvas context, letterboxed inside the given box.
 * Falls back to an initials mark so 3D surfaces are never blank.
 */
export function drawLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, { accent = '#009dd6', company = '' } = {}) {
  if (img && img.width) {
    const scale = Math.min(w / img.width, h / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
    return
  }
  const size = Math.min(w, h)
  const bx = x + (w - size) / 2
  const by = y + (h - size) / 2
  roundRect(ctx, bx, by, size, size, size * 0.24)
  ctx.fillStyle = accent
  ctx.fill()
  ctx.fillStyle = contrastInk(accent)
  ctx.font = `700 ${size * 0.44}px 'Montserrat', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials(company || brand.name), bx + size / 2, by + size / 2 + size * 0.02)
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Fit text to a width by shrinking the font until it fits. */
export function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startPx: number, weight = 600, family = "'Montserrat', sans-serif") {
  let px = startPx
  do {
    ctx.font = `${weight} ${px}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) break
    px -= Math.max(1, px * 0.04)
  } while (px > 8)
  return px
}

function canvasTex(w: number, h: number, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (ctx) paint(ctx, w, h)
  return new THREE.CanvasTexture(c)
}

function canvasFor(aspect: number, budget: number): [number, number] {
  const w = Math.min(2048, Math.max(128, Math.round(Math.sqrt(budget * aspect))))
  const h = Math.min(2048, Math.max(64, Math.round(w / aspect)))
  return [w, h]
}

/* ── Texture generators ──────────────────────────────────────────────────── */

/** Bare logo on a transparent (or solid) field — for signage plates and decals. */
export function logoTexture(logoImg: HTMLImageElement | null, { size = 1024, background = null, padding = 0.12, aspect = 1 }: { size?: number; background?: string | null; padding?: number; aspect?: number } = {}) {
  const logoKey = brand.logo ? brand.logo.slice(-40) : 'none'
  const key = `logo|${logoKey}|${brand.name}|${brand.primaryColor}|${size}|${background}|${padding}|${aspect}`
  const [cw, ch] = canvasFor(aspect, size * size)
  return memo(key, () =>
    canvasTex(cw, ch, (ctx, w, h) => {
      if (background) {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, w, h)
      }
      const pad = Math.min(w, h) * padding
      drawLogo(ctx, logoImg, pad, pad, w - pad * 2, h - pad * 2, { accent: brand.primaryColor, company: brand.name })
    })
  )
}

/** Wide hero banner: logo, company name, tagline, accent bar. */
export function bannerTexture(logoImg: HTMLImageElement | null, { w = 2048, h = 768, dark = false } = {}) {
  const logoKey = brand.logo ? brand.logo.slice(-40) : 'none'
  const key = `banner|${logoKey}|${brand.name}|${brand.primaryColor}|${brand.darkColor}|${w}x${h}|${dark}`
  return memo(key, () =>
    canvasTex(w, h, (ctx) => {
      const bg = ctx.createLinearGradient(0, 0, w, h)
      if (dark) {
        bg.addColorStop(0, brand.darkColor || '#12151d')
        bg.addColorStop(1, '#1d2433')
      } else {
        bg.addColorStop(0, '#ffffff')
        bg.addColorStop(1, '#f8fafc')
      }
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Accent wash in the corner
      const glow = ctx.createRadialGradient(w * 0.86, h * 0.1, 0, w * 0.86, h * 0.1, w * 0.5)
      glow.addColorStop(0, hexA(brand.primaryColor, dark ? 0.5 : 0.24))
      glow.addColorStop(1, hexA(brand.primaryColor, 0))
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = brand.primaryColor
      ctx.fillRect(0, h - h * 0.045, w, h * 0.045)

      const ink = dark ? '#ffffff' : '#10131a'
      const ink2 = dark ? 'rgba(255,255,255,.72)' : 'rgba(69,75,88,.9)'

      const logoBox = h * 0.44
      drawLogo(ctx, logoImg, w * 0.075, h * 0.2, logoBox, logoBox, { accent: brand.primaryColor, company: brand.name })

      const tx = w * 0.075 + logoBox + w * 0.035
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      const titlePx = fitText(ctx, brand.name || 'Ekson', w - tx - w * 0.08, h * 0.26, 700)
      ctx.fillStyle = ink
      ctx.fillText(brand.name || 'Ekson', tx, h * 0.46)

      const sub = brand.description ? brand.description.slice(0, 70) + '…' : 'Innovative Event Experiences'
      if (sub) {
        const subPx = fitText(ctx, sub, w - tx - w * 0.08, titlePx * 0.42, 500, "'Montserrat', sans-serif")
        ctx.fillStyle = ink2
        ctx.font = `500 ${subPx}px 'Montserrat', sans-serif`
        ctx.fillText(sub, tx, h * 0.46 + subPx * 1.7)
      }
    })
  )
}

/** Tall pull-up / roll-up banner artwork. */
export function towerTexture(logoImg: HTMLImageElement | null, productImg: HTMLImageElement | null, { w = 870, h = 2048 } = {}) {
  const logoKey = brand.logo ? brand.logo.slice(-40) : 'none'
  const key = `tower|${logoKey}|${brand.name}|${brand.primaryColor}|${brand.darkColor}`
  return memo(key, () =>
    canvasTex(w, h, (ctx) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#ffffff')
      bg.addColorStop(0.55, '#f4f6fa')
      bg.addColorStop(0.9, brand.primaryColor)
      bg.addColorStop(1, brand.darkColor || brand.primaryColor)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      drawLogo(ctx, logoImg, w * 0.18, h * 0.06, w * 0.64, h * 0.12, {
        accent: brand.primaryColor,
        company: brand.name,
      })

      ctx.textAlign = 'center'
      ctx.fillStyle = '#10131a'
      const namePx = fitText(ctx, brand.name, w * 0.86, w * 0.13, 700)
      ctx.fillText(brand.name, w / 2, h * 0.68)

      const words = wrap(ctx, brand.description || '', w * 0.82, w * 0.055, 3)
      ctx.font = `500 ${w * 0.055}px 'Montserrat', sans-serif`
      ctx.fillStyle = 'rgba(69,75,88,.92)'
      words.forEach((line, i) => ctx.fillText(line, w / 2, h * 0.72 + i * w * 0.075))

      ctx.fillStyle = contrastInk(brand.darkColor || brand.primaryColor)
      ctx.font = `600 ${w * 0.05}px 'Montserrat', sans-serif`
      ctx.fillText('ekson.com', w / 2, h * 0.955)
    })
  )
}

/** Product card used on game pieces, prize faces, shelf stock and the stand's screen. */
export function productCardTexture(productImg: HTMLImageElement | null, logoImg: HTMLImageElement | null, { size = 512, aspect = 1 } = {}) {
  const logoKey = brand.logo ? brand.logo.slice(-40) : 'none'
  const key = `pcard|${logoKey}|${brand.primaryColor}|${brand.darkColor}|${size}|${aspect}`
  const [cw, ch] = canvasFor(aspect, size * size)
  return memo(key, () =>
    canvasTex(cw, ch, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, hexA(brand.primaryColor, 0.1))
      grad.addColorStop(1, hexA(brand.primaryColor, 0.02))
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      const bandTop = h * 0.86
      const boxW = w * 0.72
      const boxH = bandTop * 0.84
      if (productImg?.width) {
        const s = Math.min(boxW / productImg.width, boxH / productImg.height)
        const dw = productImg.width * s
        const dh = productImg.height * s
        ctx.drawImage(productImg, (w - dw) / 2, h * 0.06 + (boxH - dh) / 2, dw, dh)
      } else {
        drawLogo(ctx, logoImg, (w - boxW) / 2, h * 0.06, boxW, boxH, {
          accent: brand.primaryColor,
          company: brand.name,
        })
      }

      ctx.fillStyle = brand.primaryColor
      ctx.fillRect(0, bandTop, w, h - bandTop)
      ctx.fillStyle = contrastInk(brand.primaryColor)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const px = fitText(ctx, brand.name, w * 0.86, (h - bandTop) * 0.46, 600, "'Montserrat', sans-serif")
      ctx.font = `600 ${px}px 'Montserrat', sans-serif`
      ctx.fillText(brand.name, w / 2, (bandTop + h) / 2)
    })
  )
}

/** Repeating carpet / fabric weave tinted with the brand accent. */
export function carpetTexture(accent: string, { size = 512, repeat = 8 } = {}) {
  const key = `carpet|${accent}|${size}|${repeat}`
  const tex = memo(key, () =>
    canvasTex(size, size, (ctx, w, h) => {
      ctx.fillStyle = accent
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 0.07
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000'
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
      ctx.globalAlpha = 1
    })
  )
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  return tex
}

export function productTexture(productImg: HTMLImageElement | null): THREE.Texture | null {
  if (!productImg) return null
  const tex = new THREE.Texture(productImg)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

/** Wrap-around artwork for the circular hanging sign: repeating logo + name. */
export function hangingTexture(logoImg: HTMLImageElement | null, { aspect = 4, repeats = Math.max(2, Math.round(aspect / 2.4)) } = {}) {
  const logoKey = brand.logo ? brand.logo.slice(-40) : 'none'
  const w = Math.min(4096, 768 * repeats)
  const h = Math.max(96, Math.round(w / aspect))
  const key = `hanging|${logoKey}|${brand.name}|${brand.primaryColor}|${brand.darkColor}|${repeats}|${w}x${h}`
  return memo(key, () =>
    canvasTex(w, h, (ctx) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      const band = w / repeats
      for (let i = 0; i < repeats; i++) {
        const x = band * i
        if (i % 2) {
          ctx.fillStyle = brand.primaryColor
          ctx.fillRect(x, 0, band, h)
        }
        const ink = i % 2 ? contrastInk(brand.primaryColor) : '#10131a'
        drawLogo(ctx, i % 2 ? null : logoImg, x + band * 0.06, h * 0.2, band * 0.26, h * 0.6, {
          accent: brand.primaryColor,
          company: brand.name,
        })
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const px = fitText(ctx, brand.name, band * 0.6, h * 0.34, 700)
        ctx.fillStyle = ink
        ctx.font = `700 ${px}px 'Montserrat', sans-serif`
        ctx.fillText(brand.name, x + band * 0.36, h / 2)
      }
    })
  )
}

/** Small hall-signage plate: stand number + hall. */
export function standNumberTexture(number = 'B-14', hall = 'HALL 3') {
  const key = `stand|${number}|${hall}|${brand.primaryColor}`
  return memo(key, () =>
    canvasTex(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = brand.primaryColor
      ctx.fillRect(0, 0, w, h * 0.28)
      ctx.fillStyle = contrastInk(brand.primaryColor)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `600 ${h * 0.15}px 'Montserrat', sans-serif`
      ctx.fillText(hall, w / 2, h * 0.14)
      ctx.fillStyle = '#10131a'
      ctx.font = `700 ${h * 0.44}px 'Montserrat', sans-serif`
      ctx.fillText(number, w / 2, h * 0.64)
    })
  )
}

export function hexA(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#009dd6')
  if (!m) return `rgba(0,157,214,${alpha})`
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`
}

export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontPx: number, maxLines = 4): string[] {
  ctx.font = `500 ${fontPx}px 'Montserrat', sans-serif`
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = next
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (lines.length === maxLines && words.length) {
    const last = lines[maxLines - 1]
    if (ctx.measureText(last + '…').width <= maxWidth) lines[maxLines - 1] = last + '…'
  }
  return lines
}
