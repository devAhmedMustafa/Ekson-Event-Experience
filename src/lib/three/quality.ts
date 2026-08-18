/**
 * Device quality tier.
 *
 * The page is desktop-first: a laptop gets ambient occlusion, 4K shadow maps,
 * bloom and high segment counts; a phone gets none of the post-processing, a
 * quarter of the shadow resolution and roughly half the geometry. One module
 * decides, everything else asks.
 *
 * Override with ?quality=high|low for testing.
 */

function detect() {
  if (typeof window === 'undefined') return 'high'
  const forced = new URLSearchParams(window.location.search).get('quality')
  if (forced === 'high' || forced === 'low') return forced

  const coarse = matchMedia('(pointer: coarse)').matches
  const smallViewport = Math.min(screen.width, screen.height) < 820
  const cores = navigator.hardwareConcurrency || 4
  const memory = (navigator as any).deviceMemory || 4
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent)

  // A touchscreen alone isn't disqualifying — plenty of desktops have one.
  // A touchscreen on a small display, or a weak CPU/RAM budget, is.
  if ((coarse && smallViewport) || mobileUA) return 'low'
  if (cores <= 4 || memory <= 4) return 'low'
  return 'high'
}

export const TIER = detect()
export const IS_HIGH = TIER === 'high'

export const QUALITY = {
  tier: TIER,

  /** Post-processing (GTAO + bloom) is desktop-only. */
  postProcessing: IS_HIGH,
  ambientOcclusion: IS_HIGH,
  bloom: IS_HIGH,

  /** Hardware multisampling on the composer target, in place of an SMAA pass. */
  msaaSamples: IS_HIGH ? 4 : 0,

  shadows: true,
  shadowMapSize: IS_HIGH ? 4096 : 1024,
  softShadows: IS_HIGH,

  /** Renderer pixel ratio ceiling. */
  maxPixelRatio: IS_HIGH ? 2 : 1.25,

  /** Scene-dressing multipliers. */
  propDensity: IS_HIGH ? 1 : 0.55,
  foliage: IS_HIGH ? 1 : 0.6,

  /**
   * Image-based lighting strength.
   *
   * The source HDR is a bright outdoor sky, so this is deliberately low: at 1.0
   * every white panel picked up the sky's full luminance on top of the studio
   * rig and the whole stand read as blown out. This is a fill light, not the
   * key — it should tint and shape, not illuminate.
   */
  envMapIntensity: IS_HIGH ? 0.5 : 0.42,
}

/**
 * Scale a radial/lathe segment count for the current tier, keeping it even and
 * never dropping below a usable silhouette.
 * @param {number} high segment count on a desktop
 * @param {number} [floor] minimum acceptable on a phone
 */
export function seg(high: number, floor: number = 8): number {
  if (IS_HIGH) return high
  return Math.max(floor, Math.round(high * 0.5 / 2) * 2)
}

/** Scale a count of decorative props (plants, visitors, dressing). */
export function count(high: number, key: string = 'propDensity'): number {
  return Math.max(1, Math.round(high * (QUALITY as any)[key]))
}

/** Bevel radius: phones get flatter edges, which are cheaper to tessellate. */
export function bevel(high: number): number {
  return IS_HIGH ? high : high * 0.6
}

/** Rounded-box smoothing segments. */
export function bevelSegments(high: number = 4): number {
  return IS_HIGH ? high : Math.max(1, Math.round(high / 2))
}

/** Procedural texture resolution. */
export function texSize(high: number): number {
  return IS_HIGH ? high : Math.max(128, high / 2)
}
