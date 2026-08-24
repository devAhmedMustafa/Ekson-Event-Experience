// @ts-nocheck
import * as THREE from 'three'

/**
 * Shared scaffolding for the Kubix arcade mini games.
 * Orthographic camera, unlit 2D textured quads, custom canvas drawing.
 */

export const WORLD_H = 10

export function makeOrthoCamera(width: number, height: number) {
  const aspect = width / height
  const halfH = WORLD_H / 2
  const halfW = halfH * aspect
  const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -50, 50)
  cam.position.z = 10
  return cam
}

export function resizeOrtho(cam: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = width / height
  const halfH = WORLD_H / 2
  cam.left = -halfH * aspect
  cam.right = halfH * aspect
  cam.top = halfH
  cam.bottom = -halfH
  cam.updateProjectionMatrix()
}

export function worldWidth(width: number, height: number) {
  return WORLD_H * (width / height)
}

const CHROME_PX = { top: 70, bottom: 64 }

export function safeArea(dom: HTMLElement) {
  if (!dom) return { top: WORLD_H / 2 - 0.5, bottom: -WORLD_H / 2 + 0.5, halfW: 3.5 }
  const rect = dom.getBoundingClientRect()
  const halfW = worldWidth(rect.width || 400, rect.height || 600) / 2
  if (!rect.height) return { top: WORLD_H / 2 - 0.5, bottom: -WORLD_H / 2 + 0.5, halfW }

  let topPx = CHROME_PX.top
  let bottomPx = CHROME_PX.bottom

  const perPx = WORLD_H / (rect.height || 600)
  return {
    top: WORLD_H / 2 - topPx * perPx - 0.12,
    bottom: -WORLD_H / 2 + bottomPx * perPx + 0.12,
    halfW,
  }
}

export function hexA(hex: string, alpha = 1) {
  if (!hex) return `rgba(0,157,214,${alpha})`
  let c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map((x) => x + x).join('')
  const num = parseInt(c, 16)
  if (isNaN(num)) return `rgba(0,157,214,${alpha})`
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export function makeBackdrop(profile: any, logoImg: HTMLImageElement | null, { width = 720, height = 1280 } = {}) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')
  const accent = profile?.accent || '#009dd6'

  const grad = ctx.createLinearGradient(0, 0, width * 0.4, height)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.45, '#f4f6fb')
  grad.addColorStop(1, hexA(accent, 0.22))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.2, 0, width * 0.5, height * 0.2, width * 0.9)
  glow.addColorStop(0, hexA(accent, 0.2))
  glow.addColorStop(1, hexA(accent, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  if (logoImg?.width) {
    ctx.globalAlpha = 0.05
    const s = width * 0.34
    const scale = Math.min(s / logoImg.width, s / logoImg.height)
    const lw = logoImg.width * scale
    const lh = logoImg.height * scale
    for (let y = 0; y < height + lh; y += lh * 2.1) {
      for (let x = -lw; x < width + lw; x += lw * 2.1) {
        ctx.drawImage(logoImg, x + ((y / (lh * 2.1)) % 2) * lw, y, lw, lh)
      }
    }
    ctx.globalAlpha = 1
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function backdropPlane(texture: THREE.Texture, width: number, height: number) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(worldWidth(width, height) * 1.2, WORLD_H * 1.2),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, depthWrite: false })
  )
  mesh.position.z = -8
  mesh.renderOrder = -10
  return mesh
}

export function paintTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')
  if (ctx) paint(ctx, width, height)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function quad(texture: THREE.Texture, w: number, h: number, { transparent = true, depthWrite = false } = {}) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, transparent, depthWrite, toneMapped: false })
  )
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

export function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startPx: number, weight = 600, family = "'Space Grotesk', Inter, sans-serif") {
  let px = startPx
  do {
    ctx.font = `${weight} ${px}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) break
    px -= 1
  } while (px > 9)
  return px
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 5) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = w
      if (lines.length === maxLines) return lines
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export function productChipTexture(profile: any, logoImg: HTMLImageElement | null, { size = 256, tint = null } = {}) {
  return paintTexture(size, size, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)

    ctx.save()
    ctx.shadowColor = 'rgba(16,19,26,.22)'
    ctx.shadowBlur = w * 0.06
    ctx.shadowOffsetY = w * 0.025
    roundRect(ctx, 10, 8, w - 22, h - 24, w * 0.22)
    ctx.fillStyle = tint || '#ffffff'
    ctx.fill()
    ctx.restore()

    roundRect(ctx, 10, 8, w - 22, h - 24, w * 0.22)
    ctx.lineWidth = 6
    ctx.strokeStyle = profile?.accent || '#009dd6'
    ctx.stroke()

    if (logoImg?.width) {
      const box = w * 0.55
      const s = Math.min(box / logoImg.width, box / logoImg.height)
      ctx.drawImage(logoImg, (w - logoImg.width * s) / 2, (h - logoImg.height * s) / 2, logoImg.width * s, logoImg.height * s)
    } else {
      ctx.fillStyle = profile?.accent || '#009dd6'
      ctx.font = "700 64px 'Space Grotesk', Inter, sans-serif"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText((profile?.company || 'E')[0].toUpperCase(), w / 2, h / 2)
    }
  })
}

export function hazardChipTexture({ size = 256 } = {}) {
  return paintTexture(size, size, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)

    ctx.save()
    ctx.shadowColor = 'rgba(16,19,26,.22)'
    ctx.shadowBlur = w * 0.06
    ctx.shadowOffsetY = w * 0.025
    roundRect(ctx, 10, 8, w - 22, h - 24, w * 0.22)
    ctx.fillStyle = '#2b3140'
    ctx.fill()
    ctx.restore()

    roundRect(ctx, 10, 8, w - 22, h - 24, w * 0.22)
    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 6
    ctx.stroke()

    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 18
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(w * 0.34, h * 0.32)
    ctx.lineTo(w * 0.66, h * 0.64)
    ctx.moveTo(w * 0.66, h * 0.32)
    ctx.lineTo(w * 0.34, h * 0.64)
    ctx.stroke()
  })
}

export function pointerNDC(event: PointerEvent | MouseEvent, dom: HTMLElement, out = new THREE.Vector2()) {
  const rect = dom.getBoundingClientRect()
  const x = (event.clientX ?? (event as any).touches?.[0]?.clientX ?? 0) - rect.left
  const y = (event.clientY ?? (event as any).touches?.[0]?.clientY ?? 0) - rect.top
  out.set((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1)
  return out
}

export function pointerWorld(event: PointerEvent | MouseEvent, dom: HTMLElement, camera: THREE.Camera, out = new THREE.Vector3()) {
  const ndc = pointerNDC(event, dom)
  out.set(ndc.x, ndc.y, 0).unproject(camera)
  out.z = 0
  return out
}

export function makeBurst(color: THREE.Color, count = 14) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities: THREE.Vector2[] = []
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const speed = 2.2 + Math.random() * 3.4
    velocities.push(new THREE.Vector2(Math.cos(a) * speed, Math.sin(a) * speed))
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color, size: 0.28, transparent: true, depthWrite: false, toneMapped: false })
  )
  points.visible = false
  points.renderOrder = 20
  points.userData = { velocities, life: 0, count }
  return points
}

export function fireBurst(points: THREE.Points, x: number, y: number) {
  const pos = points.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < points.userData.count; i++) pos.setXYZ(i, x, y, 0.4)
  pos.needsUpdate = true
  points.userData.life = 0.7
  points.visible = true
}

export function updateBurst(points: THREE.Points, dt: number) {
  if (!points.visible) return
  points.userData.life -= dt
  if (points.userData.life <= 0) {
    points.visible = false
    return
  }
  const pos = points.geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < points.userData.count; i++) {
    const v = points.userData.velocities[i]
    pos.setXYZ(i, pos.getX(i) + v.x * dt, pos.getY(i) + v.y * dt - 3 * dt * dt * 20, pos.getZ(i))
  }
  pos.needsUpdate = true
  ;(points.material as THREE.PointsMaterial).opacity = Math.max(0, points.userData.life / 0.7)
}
