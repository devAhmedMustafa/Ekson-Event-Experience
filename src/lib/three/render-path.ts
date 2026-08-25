// @ts-nocheck
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'
import { QUALITY } from './quality'

export interface RenderPathOptions {
  ao?: boolean
  bloom?: boolean
  vignette?: boolean
  aoRadius?: number
  aoIntensity?: number
  aoThickness?: number
  aoSamples?: number
  bloomStrength?: number
  bloomRadius?: number
  bloomThreshold?: number
  vignetteDarkness?: number
  vignetteOffset?: number
  clearAlpha?: number | null
}

export function createRenderPath(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: RenderPathOptions = {}
) {
  const {
    ao = true,
    bloom = true,
    vignette = true,
    aoRadius = 0.4,
    aoIntensity = 1.0,
    aoThickness = 0.6,
    aoSamples = 8,
    bloomStrength = 0.22,
    bloomRadius = 0.6,
    bloomThreshold = 0.85,
    vignetteDarkness = 1.05,
    vignetteOffset = 1.1,
    clearAlpha = null,
  } = opts

  const usePost = QUALITY.postProcessing && (ao || bloom || vignette)

  if (!usePost) {
    return {
      enabled: false,
      composer: null,
      render() {
        renderer.render(scene, camera)
      },
      degrade() {
        return null
      },
      setSize(_w: number, _h: number) {},
      dispose() {},
    }
  }

  const size = renderer.getSize(new THREE.Vector2())

  const composer = new EffectComposer(
    renderer,
    new THREE.WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), {
      type: THREE.HalfFloatType,
      samples: QUALITY.msaaSamples,
      colorSpace: THREE.LinearSRGBColorSpace,
    })
  )
  composer.setPixelRatio(renderer.getPixelRatio())
  composer.setSize(size.x, size.y)

  const passes: any[] = []

  const renderPass = new RenderPass(scene, camera)
  if (clearAlpha !== null) {
    renderPass.clearAlpha = clearAlpha
  }
  composer.addPass(renderPass)
  passes.push(renderPass)

  let gtao: GTAOPass | null = null
  if (ao && QUALITY.ambientOcclusion) {
    gtao = new GTAOPass(scene, camera, size.x, size.y)
    gtao.output = GTAOPass.OUTPUT.Default
    gtao.blendIntensity = aoIntensity
    gtao.updateGtaoMaterial({
      radius: aoRadius,
      distanceExponent: 1.0,
      thickness: aoThickness,
      distanceFallOff: 1.0,
      scale: 1.0,
      samples: aoSamples,
      screenSpaceRadius: false,
    })
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 8 })
    hideBackgroundFromGBuffer(gtao, scene)
    composer.addPass(gtao)
    passes.push(gtao)
  }

  let bloomPass: UnrealBloomPass | null = null
  if (bloom && QUALITY.bloom) {
    bloomPass = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), bloomStrength, bloomRadius, bloomThreshold)
    composer.addPass(bloomPass)
    passes.push(bloomPass)
  }

  const output = new OutputPass()
  composer.addPass(output)
  passes.push(output)

  let vignettePass: ShaderPass | null = null
  if (vignette) {
    vignettePass = new ShaderPass(VignetteShader)
    vignettePass.uniforms.darkness.value = vignetteDarkness
    vignettePass.uniforms.offset.value = vignetteOffset
    composer.addPass(vignettePass)
    passes.push(vignettePass)
  }

  let level = 2

  const api = {
    enabled: true,
    composer,
    gtao,
    bloom: bloomPass,
    scene,
    camera,
    render() {
      composer.render()
    },
    degrade(): string | null {
      if (level === 2 && gtao?.enabled) {
        gtao.enabled = false
        level = 1
        return 'ambient occlusion'
      }
      if (level >= 1 && bloomPass?.enabled) {
        bloomPass.enabled = false
        level = 0
        return 'bloom'
      }
      return null
    },
    get level() {
      return level
    },
    setSize(w: number, h: number) {
      composer.setPixelRatio(renderer.getPixelRatio())
      composer.setSize(w, h)
    },
    dispose() {
      for (const pass of passes) pass.dispose?.()
      composer.renderTarget1?.dispose()
      composer.renderTarget2?.dispose()
    },
  }

  RENDER_PATHS.set(renderer, api)
  return api
}

function hideBackgroundFromGBuffer(gtao: any, scene: THREE.Scene) {
  const method = gtao._renderOverride ? '_renderOverride' : gtao.renderOverride ? 'renderOverride' : null
  if (!method) return

  const inner = gtao[method].bind(gtao)
  gtao[method] = (...args: any[]) => {
    const background = scene.background
    scene.background = null
    try {
      inner(...args)
    } finally {
      scene.background = background
    }
  }
}

export const RENDER_PATHS = new WeakMap<THREE.WebGLRenderer, any>()
