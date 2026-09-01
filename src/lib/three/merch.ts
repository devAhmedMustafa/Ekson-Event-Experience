import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mat, surface } from './materials'
import { seg, bevel, bevelSegments, IS_HIGH } from './quality'
import { fbm } from './noise'
import { logoTexture, getLoadedLogoImage } from './logo-texture'

export interface MerchItem {
  id: string
  name: string
  blurb: string
  tagline: string
  specs: string[]
}

/**
 * Branded giveaway models: mug, pen, notebook, tote bag.
 *
 * Built procedurally so the visitor's logo and deducted brand colors can be applied at runtime.
 * Dimensions are taken from actual physical merchandise at 1:1 real-world metric scale.
 */

export const MERCH: MerchItem[] = [
  {
    id: 'mug',
    name: 'Ceramic Mug',
    blurb: 'Wrap-around print, 350 ml, glazed finish',
    tagline: 'Custom 3D Mug & Spatial Preview',
    specs: ['350 ml Capacity', 'Ceramic Lathe PBR', 'Wrap Imprint', 'Food Safe Glaze']
  },
  {
    id: 'pen',
    name: 'Precision Pen',
    blurb: 'Barrel print, soft-touch grip, metal clip',
    tagline: 'Engineered Soft-Touch Ballpoint',
    specs: ['143 mm Length', 'Soft-Touch Matte', 'Laser Engraved Clip', 'Textured Grip']
  },
  {
    id: 'notebook',
    name: 'A5 Notebook',
    blurb: 'Debossed hardcover, ribbon marker, elastic closure',
    tagline: 'Hardcover Debossed Event Journal',
    specs: ['A5 Size (148 × 210 mm)', 'Hardcover Board', 'Elastic Band & Ribbon', 'Acid-Free Leaves']
  },
  {
    id: 'bag',
    name: 'Tote Bag',
    blurb: 'Screen print, 10 oz organic cotton canvas',
    tagline: '10 oz Canvas Carrier Bag',
    specs: ['380 × 420 mm Dimensions', '10 oz Organic Cotton', 'Reinforced Webbing Straps', 'Dual Screen Print']
  },
]

export interface MerchModelOpts {
  logoMap?: THREE.Texture | null
  logoImage?: HTMLImageElement | null
  accent?: string
}

function resolveLogoTexture(opts: MerchModelOpts, targetAspect: number, padding = 0.08): THREE.Texture | null {
  const img = opts.logoImage || getLoadedLogoImage()
  if (img) {
    return logoTexture(img, { aspect: targetAspect, padding })
  }
  if (opts.logoMap) {
    return opts.logoMap
  }
  return logoTexture(null, { aspect: targetAspect, padding })
}

export function createMerchModel(kind: string, opts: MerchModelOpts = {}) {
  let model: THREE.Group
  switch (kind) {
    case 'pen':
      model = makePen(opts)
      break
    case 'notebook':
      model = makeNotebook(opts)
      break
    case 'bag':
      model = makeBag(opts)
      break
    case 'mug':
    default:
      model = makeMug(opts)
  }

  model.traverse((o: any) => {
    if (!o.isMesh) return
    o.castShadow = true
    o.receiveShadow = true
  })
  return model
}

/* ── shared helpers ──────────────────────────────────────────────────────── */

/**
 * Logo printed onto a curved surface: an open cylinder sleeve a hair proud of
 * the body, so the artwork bends with the object instead of floating flat.
 */
function curvedPrint(map: THREE.Texture, { radius, height, thetaStart, thetaLength, flipY = false }: { radius: number; height: number; thetaStart: number; thetaLength: number; flipY?: boolean }) {
  const geo = new THREE.CylinderGeometry(radius, radius, height, seg(64, 24), 1, true, thetaStart, thetaLength)
  const material = new THREE.MeshStandardMaterial({
    map,
    transparent: true,
    alphaTest: 0.03,
    roughness: 0.52,
    metalness: 0,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  })
  const mesh = new THREE.Mesh(geo, material)
  if (flipY) mesh.scale.y = -1
  mesh.name = 'logo_slot_print'
  mesh.castShadow = false
  return mesh
}

/** Logo printed flat onto a face. */
function flatPrint(map: THREE.Texture, w: number, h: number, { roughness = 0.6 } = {}) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      alphaTest: 0.03,
      roughness,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })
  )
  mesh.name = 'logo_slot_print'
  mesh.castShadow = false
  return mesh
}

/**
 * Push vertices out along their normals with tiling noise, so flat cloth panels
 * pick up folds. Falls off toward `anchorY` (the hem or base) where the fabric
 * is pulled tight.
 */
function drape(geometry: THREE.BufferGeometry, { amount = 0.006, frequency = 3.5, anchorY = 0, span = 1, seed = 5 } = {}) {
  geometry.computeVertexNormals()
  const pos = geometry.attributes.position
  const nrm = geometry.attributes.normal
  const field = fbm(64, { octaves: 3, cells: 4, seed })

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)

    const u = Math.floor((((x * frequency) % 1) + 1) % 1 * 63)
    const v = Math.floor((((z * frequency + y * frequency) % 1) + 1) % 1 * 63)
    const n = field[v * 64 + u] - 0.5

    // Slack in the middle, taut at the hem and the base.
    const t = Math.min(1, Math.abs(y - anchorY) / span)
    const slack = Math.sin(t * Math.PI)

    const k = n * amount * slack
    pos.setXYZ(i, x + nrm.getX(i) * k, y + nrm.getY(i) * k, z + nrm.getZ(i) * k)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

/* ── Mug ─────────────────────────────────────────────────────────────────── */

function makeMug(opts: MerchModelOpts = {}) {
  const accent = opts.accent || '#4abbff'
  const logoMap = resolveLogoTexture(opts, 2.474, 0.08)
  const g = new THREE.Group()
  g.name = 'mug'
  const R = 0.041 // Ø82 mm
  const H = 0.096
  const WALL = 0.0038
  const accentColor = new THREE.Color(accent)

  /**
   * Lathe profile, outside-up-and-over-the-rim-then-down-the-inside.
   */
  const p: THREE.Vector2[] = []
  p.push(new THREE.Vector2(0, 0.0025))
  p.push(new THREE.Vector2(R * 0.62, 0.0025)) // recessed base
  p.push(new THREE.Vector2(R * 0.7, 0))
  p.push(new THREE.Vector2(R * 0.86, 0)) // foot ring
  p.push(new THREE.Vector2(R * 0.9, 0.0022))
  p.push(new THREE.Vector2(R * 0.93, 0.008))
  p.push(new THREE.Vector2(R * 0.985, 0.026)) // belly flare
  p.push(new THREE.Vector2(R, 0.05))
  p.push(new THREE.Vector2(R, H - 0.006))
  p.push(new THREE.Vector2(R - 0.0008, H - 0.001)) // rolled rim
  p.push(new THREE.Vector2(R - WALL * 0.5, H))
  p.push(new THREE.Vector2(R - WALL, H - 0.0018))
  p.push(new THREE.Vector2(R - WALL, 0.011))
  p.push(new THREE.Vector2(R * 0.55, 0.008))
  p.push(new THREE.Vector2(0, 0.0075))

  const body = new THREE.Mesh(new THREE.LatheGeometry(p, seg(96, 32)), mat.ceramic(0xfbfbfa, 2))
  g.add(body)

  // Interior glaze, tinted with the brand.
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(R - WALL - 0.0004, R - WALL * 1.4, H - 0.018, seg(64, 24), 1, true),
    new THREE.MeshPhysicalMaterial({
      color: accentColor,
      roughness: 0.3,
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
      side: THREE.BackSide,
    })
  )
  inner.position.y = 0.011 + (H - 0.018) / 2
  g.add(inner)

  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(R - WALL - 0.001, seg(48, 20)),
    new THREE.MeshPhysicalMaterial({
      color: 0x2c1a11,
      roughness: 0.22,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.16,
    })
  )
  coffee.rotation.x = -Math.PI / 2
  coffee.position.y = H * 0.7
  g.add(coffee)

  /**
   * Handle swept along a D-curve with a flattened cross-section
   */
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R * 0.96, H * 0.76, 0),
    new THREE.Vector3(R * 1.42, H * 0.74, 0),
    new THREE.Vector3(R * 1.62, H * 0.5, 0),
    new THREE.Vector3(R * 1.42, H * 0.26, 0),
    new THREE.Vector3(R * 0.96, H * 0.24, 0),
  ])
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, seg(48, 20), 0.0062, seg(16, 8), false),
    mat.ceramic(0xfbfbfa, 2)
  )
  handle.scale.z = 0.62 // flatten the strap
  g.add(handle)

  // Accent band above the foot.
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.945, R * 0.945, 0.0055, seg(64, 24), 1, true),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.48, metalness: 0.02 })
  )
  band.position.y = 0.019
  g.add(band)

  if (logoMap) {
    const print = curvedPrint(logoMap, {
      radius: R + 0.0004,
      height: H * 0.46,
      thetaStart: Math.PI * 0.58,
      thetaLength: Math.PI * 0.84,
    })
    print.position.y = H * 0.56
    g.add(print)
  }

  g.userData.focus = { center: new THREE.Vector3(0, H * 0.5, 0), radius: 0.075 }
  return g
}

/* ── Pen ─────────────────────────────────────────────────────────────────── */

function makePen(opts: MerchModelOpts = {}) {
  const accent = opts.accent || '#4abbff'
  const logoMap = resolveLogoTexture(opts, 0.2144, 0.08)
  const g = new THREE.Group()
  g.name = 'pen'
  const accentColor = new THREE.Color(accent)
  const L = 0.143
  const R = 0.0047

  // One lathe for the whole body: tip cone, grip taper, barrel, cap step.
  const p: THREE.Vector2[] = []
  p.push(new THREE.Vector2(0, 0))
  p.push(new THREE.Vector2(0.0006, 0.001))
  p.push(new THREE.Vector2(0.0011, 0.006)) // writing tip
  p.push(new THREE.Vector2(0.0022, 0.0125))
  p.push(new THREE.Vector2(R * 0.52, 0.022)) // metal cone
  p.push(new THREE.Vector2(R * 0.78, 0.031))
  p.push(new THREE.Vector2(R * 0.9, 0.042))
  p.push(new THREE.Vector2(R * 0.97, 0.056)) // grip
  p.push(new THREE.Vector2(R, 0.072))
  p.push(new THREE.Vector2(R, L * 0.78))
  p.push(new THREE.Vector2(R * 1.05, L * 0.8)) // cap step
  p.push(new THREE.Vector2(R * 1.05, L - 0.008))
  p.push(new THREE.Vector2(R * 0.92, L - 0.001))
  p.push(new THREE.Vector2(R * 0.55, L))
  p.push(new THREE.Vector2(0, L))

  const barrel = new THREE.Mesh(new THREE.LatheGeometry(p, seg(48, 20)), mat.plastic(accentColor, 0.36, 1))
  g.add(barrel)

  // Metal nose cone over the lower lathe section.
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.55, 0.0024, 0.026, seg(32, 14), 1, true),
    mat.metal(0xd2d6dc, 0.22, 1)
  )
  cone.position.y = 0.026
  g.add(cone)

  // Knurled rubber grip: stacked micro-rings read as texture at any distance.
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x1e222a, roughness: 0.92, metalness: 0 })
  const ringCount = IS_HIGH ? 11 : 6
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(R * 0.94, 0.00055, 6, seg(28, 12)),
      gripMat
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.047 + i * 0.0026
    g.add(ring)
  }

  const collar = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, 0.0009, 8, seg(32, 14)), mat.metal(0xdfe3e8, 0.2, 1))
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.078
  g.add(collar)

  const capBand = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.07, R * 1.07, 0.004, seg(32, 14)),
    mat.metal(0xdfe3e8, 0.2, 1)
  )
  capBand.position.y = L * 0.8
  g.add(capBand)

  // Pocket clip: a swept strip with a rolled lip.
  const clipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R * 1.02, L - 0.006, 0),
    new THREE.Vector3(R * 1.5, L - 0.012, 0),
    new THREE.Vector3(R * 1.55, L - 0.03, 0),
    new THREE.Vector3(R * 1.3, L - 0.042, 0),
  ])
  const clip = new THREE.Mesh(
    new THREE.TubeGeometry(clipCurve, seg(24, 10), 0.0016, seg(10, 5), false),
    mat.metal(0xdadee4, 0.2, 1)
  )
  clip.scale.z = 1.9 // flatten into a strip
  g.add(clip)

  if (logoMap) {
    // Artwork runs along the barrel, so the sleeve is rotated a quarter turn.
    const print = curvedPrint(logoMap, {
      radius: R + 0.00018,
      height: L * 0.3,
      thetaStart: -Math.PI * 0.3,
      thetaLength: Math.PI * 0.6,
    })
    print.position.y = L * 0.48
    g.add(print)
  }

  g.userData.focus = { center: new THREE.Vector3(0, L * 0.5, 0), radius: 0.086 }
  return g
}

/* ── Notebook ────────────────────────────────────────────────────────────── */

function makeNotebook(opts: MerchModelOpts = {}) {
  const accent = opts.accent || '#4abbff'
  const logoMap = resolveLogoTexture(opts, 1.0, 0.08)
  const g = new THREE.Group()
  g.name = 'notebook'
  const accentColor = new THREE.Color(accent)
  const W = 0.148 // A5
  const D = 0.21
  const T = 0.016

  const bs = bevelSegments(4)

  // Page block, inset so the cover overhangs it the way a real notebook does.
  const pages = new THREE.Mesh(
    new RoundedBoxGeometry(W - 0.006, T * 0.72, D - 0.006, 2, bevel(0.0015)),
    mat.paper(0xfaf7ef, 6)
  )
  pages.position.y = T * 0.44
  g.add(pages)

  // Visible page striations along the fore-edge.
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.96 })
  const leaves = IS_HIGH ? 14 : 6
  for (let i = 0; i < leaves; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.0006, T * 0.66, D - 0.012), edgeMat)
    leaf.position.set(W / 2 - 0.0045, T * 0.44, 0)
    leaf.position.y += (i / leaves - 0.5) * T * 0.5
    g.add(leaf)
  }

  // Soft-touch laminated board: matte, with a faint grain.
  const coverMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.7,
    metalness: 0,
    ...surface('peel', 4),
  })

  const front = new THREE.Mesh(new RoundedBoxGeometry(W, T * 0.14, D, bs, bevel(0.0035)), coverMat)
  front.position.y = T * 0.88
  g.add(front)

  const back = new THREE.Mesh(new RoundedBoxGeometry(W, T * 0.14, D, bs, bevel(0.0035)), coverMat)
  back.position.y = T * 0.02
  g.add(back)

  // Rounded spine wrapping both covers.
  const spine = new THREE.Mesh(
    new THREE.CylinderGeometry(T * 0.46, T * 0.46, D, seg(28, 12), 1, false, Math.PI / 2, Math.PI),
    coverMat
  )
  spine.rotation.x = Math.PI / 2
  spine.position.set(-W / 2 + 0.001, T * 0.45, 0)
  g.add(spine)

  // Elastic closure, wrapping the fore-edge.
  const elasticMat = new THREE.MeshStandardMaterial({ color: 0x1c2028, roughness: 0.85 })
  const elastic = new THREE.Mesh(
    new THREE.TorusGeometry(T * 0.53, 0.0013, 8, seg(40, 16), Math.PI),
    elasticMat
  )
  elastic.rotation.y = Math.PI / 2
  elastic.position.set(W * 0.33, T * 0.45, 0)
  g.add(elastic)

  for (const y of [T * 0.96, T * -0.05]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.0028, 0.0013, D), elasticMat)
    strap.position.set(W * 0.33, y, 0)
    g.add(strap)
  }

  // Ribbon marker slipping out of the page block.
  const ribbon = new THREE.Mesh(
    new THREE.BoxGeometry(0.0075, 0.0009, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.7 })
  )
  ribbon.position.set(0.018, T * 0.72, D / 2 + 0.021)
  ribbon.rotation.set(0.05, 0.08, 0)
  g.add(ribbon)

  if (logoMap) {
    const print = flatPrint(logoMap, W * 0.56, W * 0.56, { roughness: 0.45 })
    print.rotation.x = -Math.PI / 2
    print.position.set(0, T * 0.955, -D * 0.05)
    g.add(print)
  }

  g.userData.focus = { center: new THREE.Vector3(0, T * 0.5, 0), radius: 0.135 }
  return g
}

/* ── Tote bag ────────────────────────────────────────────────────────────── */

function makeBag(opts: MerchModelOpts = {}) {
  const accent = opts.accent || '#4abbff'
  const logoMap = resolveLogoTexture(opts, 1.0, 0.08)
  const g = new THREE.Group()
  g.name = 'bag'
  const accentColor = new THREE.Color(accent)
  const W = 0.36 // a real tote
  const H = 0.4
  const D = 0.1

  const cloth = mat.canvasCloth(0xf2eee3, 7)

  /**
   * Body: a rounded box, tapered slightly toward the base, then displaced along
   * its normals so the panels sag.
   */
  const bodyGeo = new RoundedBoxGeometry(W, H, D, bevelSegments(6), bevel(0.02))
  const pos = bodyGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const t = (y + H / 2) / H // 0 at base, 1 at mouth
    const pinch = 0.9 + 0.1 * t // narrower at the bottom
    pos.setX(i, pos.getX(i) * pinch)
    pos.setZ(i, pos.getZ(i) * (0.86 + 0.14 * t))
  }
  drape(bodyGeo, { amount: 0.012, frequency: 6, anchorY: -H / 2, span: H, seed: 12 })

  const body = new THREE.Mesh(bodyGeo, cloth)
  body.position.y = H / 2
  g.add(body)

  // Hem: a doubled-over band at the mouth, in the brand colour.
  const hem = new THREE.Mesh(
    new RoundedBoxGeometry(W + 0.004, 0.016, D + 0.004, bevelSegments(3), bevel(0.006)),
    mat.canvasCloth(accentColor, 7)
  )
  hem.position.y = H - 0.008
  g.add(hem)

  const stitch = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.005, 0.0012, D + 0.005),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  )
  stitch.position.y = H - 0.019
  g.add(stitch)

  /**
   * Handles: swept straps that flare where they meet the hem
   */
  const strapMat = mat.canvasCloth(accentColor, 4)
  for (const z of [D / 2 - 0.012, -(D / 2 - 0.012)]) {
    const anchor = W * 0.26
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-anchor, H - 0.014, z),
      new THREE.Vector3(-anchor * 0.92, H + 0.052, z * 1.06),
      new THREE.Vector3(0, H + 0.085, z * 1.1),
      new THREE.Vector3(anchor * 0.92, H + 0.052, z * 1.06),
      new THREE.Vector3(anchor, H - 0.014, z),
    ])
    const strap = new THREE.Mesh(
      new THREE.TubeGeometry(curve, seg(56, 24), 0.0075, seg(12, 6), false),
      strapMat
    )
    strap.scale.z = 0.45 // flat webbing, not rope
    g.add(strap)

    // Reinforcing patches where the straps are sewn on.
    for (const x of [-anchor, anchor]) {
      const patch = new THREE.Mesh(
        new RoundedBoxGeometry(0.028, 0.028, 0.003, 2, 0.004),
        strapMat
      )
      patch.position.set(x, H - 0.036, z > 0 ? D / 2 + 0.001 : -(D / 2 + 0.001))
      g.add(patch)
    }
  }

  // Base gusset.
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(W * 0.9 - 0.004, 0.01, D * 0.86 + 0.004, bevelSegments(3), bevel(0.004)),
    mat.canvasCloth(0xe6e1d3, 7)
  )
  base.position.y = 0.005
  g.add(base)

  if (logoMap) {
    const printSize = W * 0.6
    const front = flatPrint(logoMap, printSize, printSize, { roughness: 0.85 })
    front.position.set(0, H * 0.54, D * 0.5 + 0.004)
    g.add(front)

    const back = flatPrint(logoMap, printSize * 0.55, printSize * 0.55, { roughness: 0.85 })
    back.position.set(0, H * 0.54, -(D * 0.5 + 0.004))
    back.rotation.y = Math.PI
    back.material.opacity = 0.7
    back.material.transparent = true
    g.add(back)
  }

  g.userData.focus = { center: new THREE.Vector3(0, H * 0.52, 0), radius: 0.29 }
  return g
}
