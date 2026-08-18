import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { QUALITY } from './quality'

export const HDR_URL = '/modern_buildings_2_2k.hdr'

let hdrPromise: Promise<THREE.DataTexture | null> | null = null

export function loadHDR(): Promise<THREE.DataTexture | null> {
  if (hdrPromise) return hdrPromise
  hdrPromise = new Promise((resolve) => {
    new RGBELoader().load(
      HDR_URL,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping
        texture.colorSpace = THREE.LinearSRGBColorSpace
        resolve(texture)
      },
      undefined,
      (err) => {
        console.warn('[ekson] HDR unavailable, falling back to a synthetic room', err)
        resolve(null)
      }
    )
  })
  return hdrPromise
}

const envCache = new WeakMap<THREE.WebGLRenderer, Promise<THREE.Texture>>()

export function envFor(renderer: THREE.WebGLRenderer): Promise<THREE.Texture> {
  if (envCache.has(renderer)) return envCache.get(renderer)!

  const promise = loadHDR().then((hdr) => {
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    let target
    if (hdr) {
      target = pmrem.fromEquirectangular(hdr)
    } else {
      const room = new RoomEnvironment()
      target = pmrem.fromScene(room, 0.04)
      room.traverse((o: any) => o.geometry?.dispose())
    }
    pmrem.dispose()
    return target.texture
  })

  envCache.set(renderer, promise)
  return promise
}

export function studioLights(scene: THREE.Scene, { intensity = 1, shadowRadius = 22 } = {}) {
  const key = new THREE.DirectionalLight(0xfff4e6, 1.35 * intensity)
  key.position.set(6, 9, 7)
  key.castShadow = QUALITY.shadows
  key.shadow.mapSize.set(QUALITY.shadowMapSize, QUALITY.shadowMapSize)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 46
  key.shadow.camera.left = -shadowRadius
  key.shadow.camera.right = shadowRadius
  key.shadow.camera.top = shadowRadius
  key.shadow.camera.bottom = -shadowRadius
  key.shadow.bias = -0.0006
  key.shadow.normalBias = 0.026
  key.shadow.radius = QUALITY.softShadows ? 3 : 1
  key.shadow.blurSamples = QUALITY.softShadows ? 12 : 4

  const fill = new THREE.DirectionalLight(0xd6e4ff, 0.34 * intensity)
  fill.position.set(-8, 5, -4)

  const rim = new THREE.DirectionalLight(0xffe9cc, 0.5 * intensity)
  rim.position.set(-3, 7, -10)

  const bounce = new THREE.HemisphereLight(0xeef2fb, 0xbdb8ad, 0.28 * intensity)

  scene.add(key, fill, rim, bounce)
  return { key, fill, rim, bounce }
}

export function backdropGradient(top = '#ffffff', bottom = '#e9ebf0') {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const ctx = c.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(c)
  const grad = ctx.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, top)
  grad.addColorStop(1, bottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 4, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function disposeObject(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    obj.geometry?.dispose?.()
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
    for (const m of mats) {
      for (const key of Object.keys(m)) {
        const val = m[key]
        if (val && val.isTexture) val.dispose()
      }
      m.dispose()
    }
  })
}
