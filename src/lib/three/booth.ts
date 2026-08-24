// @ts-nocheck
import * as THREE from 'three'
import { brand } from '$lib/brand.svelte'
import { mat, env } from './materials'
import {
  makeCarpet,
  makeCounter,
  makeStool,
  makeArmchair,
  makeRoundTable,
  makeCoffeeTable,
  makePlant,
  makePlanter,
  makePlinth,
  makeScreen,
  makeRollup,
  makeTruss,
  makeSpot,
  makeHangingSign,
  makeCup,
  makeBrochureStack,
  makeRopePost,
  makeRope,
  makeLightPool,
  makeProductWall,
  graphicPanel,
  roundedBox,
  box,
} from './props'

/**
 * Sizes of the surfaces that carry printed artwork.
 */
export const BOOTH = {
  screen: { w: 1.35, h: 0.82 },
  rollup: { w: 0.85, h: 2.0 },
  ring: { radius: 1.25, height: 0.85 },
  bannerAspect: 8 / 3, // matches `bannerTexture`'s 2048 × 768
}

/**
 * The visitor's stand, assembled from procedural props and branded with deducted brandLogo colors.
 *
 * Footprint is 7 m × 6 m (a standard 42 m² island), open toward +Z.
 *
 * @param {object} tex textures from src/lib/three/booth-textures.ts
 * @param {object} opts
 * @returns {THREE.Group}
 */
export function createBooth(tex, {
  accent = brand.primaryColor || '#009dd6',
  darkAccent = brand.darkColor || '#04547c',
  lightAccent = brand.lightTint || 'rgba(0,157,214,0.12)',
  palette = brand.palette || [accent, darkAccent],
  detail = 'high'
} = {}) {
  const booth = new THREE.Group()
  booth.name = 'booth'
  const accentColor = new THREE.Color(accent)
  const darkAccentColor = new THREE.Color(darkAccent)
  const paletteColors = (palette && palette.length ? palette : [accent, darkAccent]).map((c) => new THREE.Color(c))
  const secondaryColor = paletteColors[1] || darkAccentColor

  const rich = detail === 'high'

  const W = 7
  const D = 6
  const WALL_H = 3.4
  const RISER = 0.02

  const HALF_W = W / 2 // 3.5
  const HALF_D = D / 2 // 3.0
  const WALL_Z = -HALF_D + 0.1 // centre of the 0.16 m back wall → face at −2.82
  const WALL_FACE = WALL_Z + 0.08

  /* ── floor ─────────────────────────────────────────────────────────── */
  const carpet = makeCarpet(W, D, tex.carpet, { riser: RISER, accent: accentColor })
  booth.add(carpet)

  // Floor decal in the entrance mouth, between the two front planters.
  if (tex.logo) {
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshStandardMaterial({
        map: tex.logo,
        transparent: true,
        roughness: 0.95,
        envMapIntensity: env(0.2),
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      })
    )
    decal.rotation.x = -Math.PI / 2
    decal.position.set(0.15, RISER + 0.004, 1.9)
    decal.name = 'logo_slot_floor'
    decal.receiveShadow = true
    booth.add(decal)
  }

  /* ── back wall: three bays ─────────────────────────────────────────── */
  const wall = new THREE.Group()
  wall.position.set(0, RISER, WALL_Z)
  booth.add(wall)

  const shell = box(W, WALL_H, 0.16, mat.panel(0xf7f8fa, 0.74))
  shell.position.y = WALL_H / 2
  wall.add(shell)

  const LEFT_BAY = { x: -2.5, w: 1.7 }
  const SCREEN_X = 2.35
  const SCREEN_W = BOOTH.screen.w
  const CENTRE_HALF = 1.53

  // Left bay — a lit product wall on the hero view, a plain accent panel when low detail
  if (rich) {
    const productWall = makeProductWall({
      w: LEFT_BAY.w,
      h: 2.8,
      map: tex.productShelf,
      accent: accentColor,
      shelves: 3,
      perShelf: 3,
    })
    productWall.position.set(LEFT_BAY.x, 0.12, 0.09)
    wall.add(productWall)
  } else {
    const leftBay = box(
      LEFT_BAY.w,
      WALL_H - 0.6,
      0.05,
      new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7, metalness: 0 })
    )
    leftBay.position.set(LEFT_BAY.x, WALL_H / 2, 0.1)
    wall.add(leftBay)
  }

  // Light seam between the left bay and the centre bay.
  const seam = box(
    0.05,
    2.5,
    0.02,
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9 })
  )
  seam.position.set(-1.57, 1.7, 0.09)
  wall.add(seam)

  // Centre bay — the hero lightbox with the company banner.
  const bannerW = CENTRE_HALF * 2 - 0.16
  const bannerH = bannerW * 0.375
  const lightbox = roundedBox(bannerW + 0.16, bannerH + 0.16, 0.09, 0.02, mat.acrylic(0xffffff, accentColor, 0.12))
  lightbox.position.set(0, 2.05, 0.11)
  wall.add(lightbox)

  const banner = graphicPanel(bannerW, bannerH, tex.banner, { backing: false, emissive: 0.18 })
  banner.position.set(0, 2.05, 0.163)
  banner.name = 'logo_slot_backwall'
  wall.add(banner)

  const baseline = box(
    CENTRE_HALF * 2,
    0.06,
    0.04,
    new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.45 })
  )
  baseline.position.set(0, 0.72, 0.1)
  wall.add(baseline)

  // Right bay — a screen playing the product card, over a real shelf.
  const screen = makeScreen({ w: SCREEN_W, h: BOOTH.screen.h, map: tex.productScreen })
  screen.position.set(SCREEN_X, 1.95, 0.11)
  wall.add(screen)

  const screenShelf = box(1.5, 0.05, 0.28, mat.panel(0xffffff, 0.6))
  screenShelf.position.set(SCREEN_X, 1.1, 0.22)
  wall.add(screenShelf)

  // Brackets, so the shelf is carried rather than floating on the panel.
  for (const dx of [-0.6, 0.6]) {
    const bracket = box(0.03, 0.13, 0.2, mat.dark(darkAccentColor.getHex(), 1))
    bracket.position.set(SCREEN_X + dx, 1.01, 0.18)
    wall.add(bracket)
  }

  /* ── left return wall + roll-up ────────────────────────────────────── */
  const RETURN_D = 2.5 // z from −3.0 to −0.5
  const sideWall = box(0.14, WALL_H, RETURN_D, mat.panel(0xf2f3f6, 0.76))
  sideWall.position.set(-HALF_W + 0.07, RISER + WALL_H / 2, -HALF_D + RETURN_D / 2)
  booth.add(sideWall)

  const sideStripe = box(
    0.03,
    WALL_H * 0.8,
    0.05,
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.65 })
  )
  sideStripe.position.set(-HALF_W + 0.15, RISER + WALL_H / 2, -HALF_D + 0.4)
  booth.add(sideStripe)

  const rollup = makeRollup({ ...BOOTH.rollup, map: tex.tower })
  rollup.position.set(-HALF_W + 0.3, RISER, -1.5)
  rollup.rotation.y = Math.PI / 2
  booth.add(rollup)

  /* ── product plinths ───────────────────────────────────────────────── */
  const PLINTH_H = 0.95
  const CAP_TOP = RISER + PLINTH_H + 0.02
  const RISER_H = 0.05
  for (const [i, x] of [-0.9, 0.9].entries()) {
    const plinth = makePlinth({ h: PLINTH_H, accent: i === 0 ? accentColor : secondaryColor, logoMap: i === 0 ? tex.logoPlate : null })
    plinth.position.set(x, RISER, -2.0)
    booth.add(plinth)

    if (rich) {
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.17, RISER_H, 28),
        mat.acrylic(0xffffff, accentColor, 0.08)
      )
      disc.position.set(x, CAP_TOP + RISER_H / 2, -2.0)
      booth.add(disc)
    }

    const standee = makeProductStandee(tex.product || tex.logoPlate, { height: 0.68, maxWidth: 0.4 })
    standee.position.set(x, CAP_TOP + (rich ? RISER_H : 0), -2.0)
    booth.add(standee)
  }

  /* ── reception counter, front right ────────────────────────────────── */
  const COUNTER = { x: 2.2, z: 1.35, rot: -Math.PI / 7.2, h: 1.05 }
  const counter = makeCounter({ h: COUNTER.h, logoMap: tex.logoPlate, accent: accentColor })
  counter.position.set(COUNTER.x, RISER, COUNTER.z)
  counter.rotation.y = COUNTER.rot
  booth.add(counter)

  const behind = new THREE.Vector3(0, 0, -0.85).applyAxisAngle(new THREE.Vector3(0, 1, 0), COUNTER.rot)
  const stool = makeStool({ accent: accentColor })
  stool.position.set(COUNTER.x + behind.x, RISER, COUNTER.z + behind.z)
  booth.add(stool)

  if (rich) {
    const onTop = new THREE.Vector3(-0.62, 0, 0.12).applyAxisAngle(new THREE.Vector3(0, 1, 0), COUNTER.rot)
    const brochures = makeBrochureStack({ map: tex.productSheet, count: 4 })
    brochures.position.set(COUNTER.x + onTop.x, RISER + COUNTER.h + 0.048, COUNTER.z + onTop.z)
    brochures.rotation.y = COUNTER.rot + 0.25
    booth.add(brochures)
  }

  /* ── poseur table in the open centre ───────────────────────────────── */
  const TABLE = { x: -0.85, z: -0.55, h: 1.05, seatRing: 0.75 }
  const table = makeRoundTable({ h: TABLE.h, accent: accentColor })
  table.position.set(TABLE.x, RISER, TABLE.z)
  booth.add(table)

  const seatAngles = rich ? [-2.6, -0.5, 1.5] : [-2.6, -0.5]
  seatAngles.forEach((a, i) => {
    const s = makeStool({ accent: i === 0 ? accentColor : (i === 1 ? secondaryColor : darkAccentColor) })
    s.position.set(
      TABLE.x + Math.cos(a) * TABLE.seatRing,
      RISER,
      TABLE.z + Math.sin(a) * TABLE.seatRing
    )
    booth.add(s)
  })

  if (rich) {
    const topY = RISER + TABLE.h + 0.048
    const cup = makeCup()
    cup.position.set(TABLE.x + 0.16, topY, TABLE.z + 0.1)
    booth.add(cup)
    const cup2 = makeCup()
    cup2.position.set(TABLE.x - 0.14, topY, TABLE.z - 0.12)
    booth.add(cup2)
  }

  /* ── seating corner, front left ────────────────────────────────────── */
  const LOUNGE = { x: -2.0, z: 1.5 }

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 1.7),
    new THREE.MeshStandardMaterial({
      color: 0xf6f5f1,
      roughness: 0.99,
      metalness: 0,
      envMapIntensity: env(0.2),
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
    })
  )
  rug.rotation.x = -Math.PI / 2
  rug.position.set(LOUNGE.x, RISER + 0.006, LOUNGE.z)
  rug.receiveShadow = true
  booth.add(rug)

  const C_TABLE_H = 0.42
  const cTable = makeCoffeeTable({ w: 0.85, d: 0.55, h: C_TABLE_H })
  cTable.position.set(LOUNGE.x, RISER, LOUNGE.z)
  booth.add(cTable)

  const chairA = makeArmchair({ accent: accentColor, color: darkAccentColor.getHex() })
  chairA.position.set(LOUNGE.x - 0.95, RISER, LOUNGE.z)
  chairA.rotation.y = Math.PI / 2
  booth.add(chairA)

  if (rich) {
    const chairB = makeArmchair({ accent: secondaryColor, color: darkAccentColor.getHex() })
    chairB.position.set(LOUNGE.x + 0.95, RISER, LOUNGE.z)
    chairB.rotation.y = -Math.PI / 2
    booth.add(chairB)

    const mag = makeBrochureStack({ map: tex.productSheet, count: 2 })
    mag.position.set(LOUNGE.x + 0.1, RISER + C_TABLE_H, LOUNGE.z - 0.03)
    mag.rotation.y = 0.35
    booth.add(mag)
  }

  /* ── greenery ──────────────────────────────────────────────────────── */
  const plantA = makePlant({ height: 1.3 })
  plantA.position.set(HALF_W - plantA.userData.radius - 0.02, RISER, -0.75)
  booth.add(plantA)

  const plantB = makePlant({ height: 0.95, leafColor: 0x3f9c62 })
  plantB.position.set(-HALF_W + plantB.userData.radius + 0.02, RISER, HALF_D - plantB.userData.radius - 0.02)
  booth.add(plantB)

  if (rich) {
    const planterL = makePlanter({ w: 1.3, accent: accentColor })
    planterL.position.set(-1.55, RISER, HALF_D - (planterL.userData.halfD || 0.18) - 0.02)
    booth.add(planterL)

    const planterR = makePlanter({ w: 1.1, accent: secondaryColor })
    planterR.position.set(1.35, RISER, HALF_D - (planterR.userData.halfD || 0.18) - 0.02)
    booth.add(planterR)

    const postA = makeRopePost({ accent: accentColor })
    postA.position.set(-0.62, RISER, 2.78)
    booth.add(postA)
    const postB = makeRopePost({ accent: secondaryColor })
    postB.position.set(0.52, RISER, 2.78)
    booth.add(postB)
    booth.add(
      makeRope(
        new THREE.Vector3(-0.62, RISER + 0.9, 2.78),
        new THREE.Vector3(0.52, RISER + 0.9, 2.78),
        { color: accentColor.getHex(), sag: 0.14 }
      )
    )
  }

  /* ── overhead rig ──────────────────────────────────────────────────── */
  const RIG = { y: 3.8, z: -2.25, legX: 3.2, legTop: 3.68 }

  const truss = makeTruss({ span: 6.7 })
  truss.position.set(0, RIG.y, RIG.z)
  booth.add(truss)

  for (const x of [-RIG.legX, RIG.legX]) {
    const leg = makeTruss({ span: RIG.legTop - RISER, size: 0.22, segments: 5 })
    leg.rotation.z = Math.PI / 2
    leg.position.set(x, (RISER + RIG.legTop) / 2 + 0.12, RIG.z)
    booth.add(leg)
  }

  if (rich) {
    for (const x of [-2.4, 0, 2.4]) {
      const spot = makeSpot({ withLight: false })
      spot.position.set(x, RIG.y - 0.24, RIG.z)
      spot.rotation.y = Math.PI
      spot.rotation.x = -1.21
      booth.add(spot)
    }

    for (const [i, x] of [-0.9, 0.9].entries()) {
      const spot = makeSpot({ withLight: false })
      spot.position.set(x, RIG.y - 0.24, RIG.z)
      spot.rotation.x = 1.45
      booth.add(spot)

      const poolColor = i === 0 ? accentColor.getHex() : secondaryColor.getHex()
      const pool = makeLightPool({ radius: 0.8, color: poolColor, opacity: 0.16 })
      pool.position.set(x, RISER + 0.006, -2.0)
      booth.add(pool)
    }

    const bannerTarget = new THREE.Object3D()
    bannerTarget.position.set(0, RISER + 2.05, WALL_FACE)
    booth.add(bannerTarget)
    const key = new THREE.SpotLight(0xfff4e2, 9, 12, Math.PI / 8, 0.55, 1.6)
    key.position.set(0, RIG.y - 0.3, RIG.z)
    key.target = bannerTarget
    booth.add(key)
  }

  // Ring sign on ceiling wires, hung over the middle of the stand.
  const sign = makeHangingSign({
    ...BOOTH.ring,
    map: tex.hanging,
    accent: accentColor,
    rise: 1.5,
  })
  sign.position.set(0, 4.6, -0.9)
  booth.add(sign)

  /* ── stand number plate ────────────────────────────────────────────── */
  if (tex.standNumber) {
    const plate = graphicPanel(0.62, 0.32, tex.standNumber, { backing: true, emissive: 0.12 })
    plate.position.set(HALF_W - 0.35, RISER + 2.5, HALF_D - 0.4)
    plate.rotation.y = -Math.PI / 2
    booth.add(plate)
  }

  booth.userData.logoSlots = []
  booth.traverse((o) => {
    if (o.name && o.name.startsWith('logo_slot_')) booth.userData.logoSlots.push(o)
    if (o.isMesh) {
      o.castShadow = o.castShadow ?? true
      o.receiveShadow = true
      o.updateMatrix()
      o.matrixAutoUpdate = false
    }
  })

  booth.userData.entrance = new THREE.Vector3(0, 0, HALF_D + 0.8)
  booth.userData.footprint = { w: W, d: D }

  return booth
}

/**
 * Free-standing printed cut-out of the visitor's product.
 */
export function makeProductStandee(map, { height = 0.7, maxWidth = Infinity } = {}) {
  const g = new THREE.Group()
  g.name = 'product_standee'
  if (!map) return g

  const image = map.image
  const aspect = image?.width && image?.height ? image.width / image.height : 1

  let h = height
  let w = h * aspect
  if (w > maxWidth) {
    w = maxWidth
    h = w / aspect
  }

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
      roughness: 0.88,
      metalness: 0,
    })
  )
  face.position.y = h / 2
  face.castShadow = true
  g.add(face)

  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(w * 0.4, w * 0.44, 0.014, 24),
    mat.acrylic(0xffffff, 0xffffff, 0.05)
  )
  foot.position.y = 0.007
  g.add(foot)

  g.userData.size = { w, h }
  return g
}
