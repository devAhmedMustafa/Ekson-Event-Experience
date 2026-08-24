// @ts-nocheck
import * as THREE from 'three'
import { brand } from '$lib/brand.svelte'
import { mat, floorGrid, surface } from './materials'
import { seg, count } from './quality'
import {
  makeCarpet,
  makeCounter,
  makePlant,
  makeTruss,
  makeStool,
  makeChair,
  makeRoundTable,
  makePlanter,
  makeCup,
  makeSpot,
  graphicPanel,
  roundedBox,
  box,
} from './props'

/**
 * The exhibition hall the walkthrough takes place in.
 *
 * Beyond the shell and the neighbouring stands there is an entrance arch, an
 * info desk, a café corner, overhead aisle gantries, wayfinding, crates and
 * painted floor markings — the things that make a hall read as a venue rather
 * than as eight boxes in a room.
 *
 * There are deliberately no people in it. Procedural mannequins at walking
 * distance read as mannequins, and a first-person walk past a frozen crowd is
 * worse than a walk through an empty hall before doors open.
 */

export const HALL = {
  width: 52, // along X
  depth: 30, // along Z
  height: 7.5,
  aisleHalf: 4.2,
  rowZ: 7.6, // centre line of each booth row
}

/** Three stand archetypes, so the neighbours don't all look stamped out. */
const NEIGHBOURS = [
  { name: 'Vantek Systems', color: 0x4f8bff, stand: 'A-01', style: 'wall' },
  { name: 'Orbital Foods', color: 0xf59e0b, stand: 'A-02', style: 'island' },
  { name: 'Helios Energy', color: 0x10b981, stand: 'A-03', style: 'tower' },
  { name: 'Northwind Labs', color: 0x7c5cff, stand: 'B-01', style: 'island' },
  { name: 'Cobalt Studio', color: 0xef476f, stand: 'B-02', style: 'wall' },
  { name: 'Meridian Group', color: 0x0ea5e9, stand: 'B-03', style: 'tower' },
  { name: 'Auralite', color: 0x8b5cf6, stand: 'B-04', style: 'wall' },
]

export function boothSlots() {
  const xs = [-16.5, -5.5, 5.5, 16.5]
  const slots = []
  for (const x of xs) slots.push({ x, z: -HALL.rowZ, rotation: 0 }) // opens toward +Z
  for (const x of xs) slots.push({ x, z: HALL.rowZ, rotation: Math.PI }) // opens toward -Z
  return slots
}

export const VISITOR_SLOT_INDEX = 3

export function makeHall({ accent = '#2f6bff' } = {}) {
  const hall = new THREE.Group()
  hall.name = 'hall'
  const { width: W, depth: D, height: H } = HALL
  const accentColor = new THREE.Color(accent)

  /*
   * Everything a visitor should not be able to walk through, published on
   * `hall.userData.obstacles` for the walkthrough to turn into colliders.
   *
   * It has to be built here rather than guessed there: the walkthrough only
   * knew about the eight stands, so the info desk, the café, the planters, the
   * crate stacks and a table in the middle of the aisle were all walked
   * straight through.
   */
  const obstacles = []
  const solid = (x, z, halfX, halfZ) =>
    obstacles.push({ minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ })

  /** Half-extents of a w × d footprint turned `rot` radians about Y. */
  const turned = (w, d, rot) => [
    (Math.abs(Math.cos(rot)) * w + Math.abs(Math.sin(rot)) * d) / 2,
    (Math.abs(Math.sin(rot)) * w + Math.abs(Math.cos(rot)) * d) / 2,
  ]

  // Truss centres, reused by the aisle gantries and the spot bars so both hang
  // off the rig rather than floating near it.
  const TRUSS_X = [0, 1, 2].map((i) => -W / 2 + (W / 3) * (i + 0.5))
  const TRUSS_Y = H - 1.4
  const TRUSS_UNDER = TRUSS_Y - 0.156 // half the box section plus a chord radius

  /* ── floor ─────────────────────────────────────────────────────────── */
  const grid = floorGrid()
  grid.repeat.set(W / 4, D / 4)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({
      map: grid,
      roughness: 1.0,
      metalness: 0,
      envMapIntensity: 0,
    })
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  hall.add(floor)

  // Aisle runner, with painted lane markings baked into its texture.
  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 2, HALL.aisleHalf * 2),
    new THREE.MeshStandardMaterial({
      map: aisleTexture(accent),
      roughness: 1.0,
      metalness: 0,
      envMapIntensity: 0,
    })
  )
  runner.rotation.x = -Math.PI / 2
  runner.position.y = 0.004
  runner.receiveShadow = true
  hall.add(runner)

  /* ── walls, ceiling, rig ───────────────────────────────────────────── */
  const wallMat = mat.panel(0xdfe3ec, 0.9, 12)
  const north = box(W, H, 0.4, wallMat)
  north.position.set(0, H / 2, -D / 2)
  hall.add(north)
  const south = box(W, H, 0.4, wallMat)
  south.position.set(0, H / 2, D / 2)
  hall.add(south)
  const east = box(0.4, H, D, wallMat)
  east.position.set(W / 2, H / 2, 0)
  hall.add(east)
  const west = box(0.4, H, D, wallMat)
  west.position.set(-W / 2, H / 2, 0)
  hall.add(west)

  /*
   * The ceiling faces down, so a hemisphere light only ever gives it the ground
   * colour and nothing else in the hall points at it. At 0x22262e it measured
   * an average luminance of 17 — a black void filling the top third of every
   * first-person frame. A lighter base plus a little self-illumination stands
   * in for the light bouncing back up off the deck.
   */
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({
      color: 0x525a66,
      emissive: 0x2b313b,
      emissiveIntensity: 1.1,
      roughness: 0.96,
      side: THREE.DoubleSide,
      metalness: 0,
    })
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = H
  hall.add(ceiling)

  // Exposed ductwork and services, so the ceiling isn't a flat void.
  const ductMat = mat.metal(0x8d939d, 0.5, 6)
  for (const z of [-D / 2 + 5, D / 2 - 5]) {
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, W - 3, seg(20, 10)), ductMat)
    duct.rotation.z = Math.PI / 2
    duct.position.set(0, H - 0.9, z)
    hall.add(duct)
  }

  // Bright enough to read as a lit fitting, dim enough not to bloom into a
  // stripe across the whole ceiling.
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.15,
  })
  const housing = mat.dark(0x2c313a, 2)
  for (let i = 0; i < 6; i++) {
    const x = -W / 2 + (W / 6) * (i + 0.5)
    const shell = box(0.5, 0.16, D - 4, housing)
    shell.position.set(x, H - 0.22, 0)
    hall.add(shell)
    const strip = box(0.36, 0.06, D - 4.2, stripMat)
    strip.position.set(x, H - 0.31, 0)
    hall.add(strip)
  }

  /* ── overhead rigging + aisle gantries ─────────────────────────────── */
  for (const x of TRUSS_X) {
    const truss = makeTruss({ span: HALL.aisleHalf * 2 + 4, segments: 8 })
    truss.rotation.y = Math.PI / 2
    truss.position.set(x, TRUSS_Y, 0)
    hall.add(truss)
  }

  /*
   * Hanging aisle signs, the wayfinding you actually see in a hall.
   *
   * Hung off the trusses above them, not near them: these used to sit at
   * ±17 with the rig at ±17.33, and their wires stopped 0.7 m short of it.
   * The two faces are also held apart — cloning the board and turning it
   * through π left two printed planes at exactly z = 0, which z-fought.
   */
  const SIGN_W = 4.6
  const SIGN_H = 0.85
  const SIGN_Y = H - 2.1
  const gantries = [
    { x: TRUSS_X[0], label: 'AISLE A · 01–04' },
    { x: TRUSS_X[1], label: 'AISLE A · CENTRE' },
    { x: TRUSS_X[2], label: 'AISLE A · 12–16' },
  ]
  for (const { x, label } of gantries) {
    const sign = new THREE.Group()
    const art = textTexture(label, accentColor.getHex(), 0.65, SIGN_W / SIGN_H)

    const board = graphicPanel(SIGN_W, SIGN_H, art, { emissive: 0.14 })
    board.position.y = -0.55
    sign.add(board)

    // Face only: the board above already carries the backing box, which spans
    // z −0.035 … −0.005, so this clears it by 6 mm.
    const backFace = graphicPanel(SIGN_W, SIGN_H, art, { emissive: 0.14, backing: false })
    backFace.rotation.y = Math.PI
    backFace.position.set(0, -0.55, -0.041)
    sign.add(backFace)

    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.8, seg(12, 6)), mat.metal(0xb9bec7, 0.3, 2))
    rail.rotation.z = Math.PI / 2
    sign.add(rail)

    const rise = TRUSS_UNDER - SIGN_Y
    for (const dx of [-2, 2]) {
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, rise, 6), mat.metal(0x9aa1ad, 0.4, 1))
      wire.position.set(dx, rise / 2, 0)
      sign.add(wire)
    }
    sign.position.set(x, SIGN_Y, 0)
    hall.add(sign)
  }

  /*
   * Spot bars washing the stands either side of the aisle.
   *
   * Clamped to the trusses. They used to sit at x = ±18 and ±6 with the rig at
   * ±17.33 and 0 — as much as 6 m from the nearest steel, hanging in mid-air.
   *
   * A spot's lens looks along local +Z, which after an X rotation points along
   * (0, −sin rx, cos rx). The rig used to tilt the +Z-facing spots by a
   * negative angle and the −Z-facing ones by a positive angle, i.e. exactly
   * backwards: every fitting in the hall was aimed at the ceiling.
   */
  for (const x of TRUSS_X) {
    for (const z of [-2.4, 2.4]) {
      const hook = box(0.06, 0.16, 0.06, mat.dark(0x1a1d24, 1))
      hook.position.set(x, TRUSS_UNDER - 0.03, z)
      hall.add(hook)

      const spot = makeSpot({ withLight: false })
      spot.position.set(x, TRUSS_UNDER - 0.15, z)
      if (z > 0) {
        spot.rotation.x = Math.PI / 2.4 // down and toward +Z
      } else {
        spot.rotation.y = Math.PI // flip, then down and toward −Z
        spot.rotation.x = -Math.PI / 2.4
      }
      hall.add(spot)
    }
  }

  /* ── entrance ──────────────────────────────────────────────────────── */
  const archMat = mat.dark(0x1d222c, 3)
  const ARCH_X = -W / 2 + 1.6
  const archL = roundedBox(0.5, 5.4, 0.5, 0.03, archMat)
  archL.position.set(ARCH_X, 2.7, -HALL.aisleHalf)
  hall.add(archL)
  const archR = roundedBox(0.5, 5.4, 0.5, 0.03, archMat)
  archR.position.set(ARCH_X, 2.7, HALL.aisleHalf)
  hall.add(archR)
  solid(ARCH_X, -HALL.aisleHalf, 0.25, 0.25)
  solid(ARCH_X, HALL.aisleHalf, 0.25, 0.25)
  const archTop = roundedBox(0.62, 0.95, HALL.aisleHalf * 2 + 0.6, 0.04, archMat)
  archTop.position.set(ARCH_X, 5.6, 0)
  hall.add(archTop)

  // The lettering is contained to the aspect of its own canvas, so the sign is
  // as wide as the words rather than smeared across 8 m of beam.
  const ARCH_SIGN = { w: HALL.aisleHalf * 2 - 0.4, h: 0.72 }
  const archSign = new THREE.Mesh(
    new THREE.PlaneGeometry(ARCH_SIGN.w, ARCH_SIGN.h),
    mat.emissivePrint(textTexture('EXPO HALL 3', accentColor.getHex(), 1, ARCH_SIGN.w / ARCH_SIGN.h), 0.45)
  )
  archSign.rotation.y = Math.PI / 2
  // The beam is 0.62 deep, so its +X face is at ARCH_X + 0.31. At +0.27 the
  // sign was inside the beam and z-fighting with it.
  archSign.position.set(ARCH_X + 0.325, 5.6, 0)
  hall.add(archSign)

  /* ── info desk by the entrance ─────────────────────────────────────── */
  /*
   * Kept west of x = −20.8, which is where the first stand's carpet starts.
   * At −20.5 the desk's corner sat 0.3 m inside stand A-01.
   */
  const INFO = { x: -W / 2 + 4.4, z: HALL.aisleHalf + 1.6, rot: -Math.PI / 2.6, w: 2.6, d: 0.7 }
  const info = new THREE.Group()
  const deskProfile = new THREE.Group()
  const desk = makeCounter({ w: INFO.w, h: 1.05, d: INFO.d, accent: accentColor })
  deskProfile.add(desk)
  const deskSign = graphicPanel(1.5, 0.42, textTexture('INFORMATION', 0x2b3140, 0.55, 1.5 / 0.42), { emissive: 0.1 })
  deskSign.position.set(0, 2.0, 0)
  deskProfile.add(deskSign)
  const deskPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, seg(14, 6)), mat.metal(0xb9bec7, 0.3, 1))
  deskPost.position.set(0, 1.5, 0)
  deskProfile.add(deskPost)
  info.add(deskProfile)
  info.position.set(INFO.x, 0, INFO.z)
  info.rotation.y = INFO.rot
  hall.add(info)
  solid(INFO.x, INFO.z, ...turned(INFO.w, INFO.d, INFO.rot))

  const infoPlant = makePlant({ height: 1.4 })
  infoPlant.position.set(-W / 2 + 2.4, 0, HALL.aisleHalf + 1.2)
  hall.add(infoPlant)
  solid(-W / 2 + 2.4, HALL.aisleHalf + 1.2, infoPlant.userData.radius, infoPlant.userData.radius)

  /* ── café corner at the far end ────────────────────────────────────── */
  /*
   * East of the stand line, not on top of it. At x = 19.5 the bar ran from
   * 17.8 to 21.2 while stand A-03's carpet ran from 13 to 20 — 2.2 m of café
   * was buried inside a neighbour's stand, and the stand's collider meant you
   * could never reach the half that was not.
   */
  const CAFE = { x: W / 2 - 3.0, z: -HALL.aisleHalf - 2.4 }
  const cafe = new THREE.Group()
  cafe.position.set(CAFE.x, 0, CAFE.z)

  const bar = makeCounter({ w: 3.4, h: 1.1, d: 0.75, accent: new THREE.Color(0x8b5a2b) })
  cafe.add(bar)
  solid(CAFE.x, CAFE.z, 1.7, 0.375)

  const backBar = box(3.6, 2.2, 0.25, mat.panel(0xf0ece4, 0.7, 4))
  backBar.position.set(0, 1.1, -0.9)
  cafe.add(backBar)

  // Mounted on the back bar, not hovering 10 cm above its top edge and half a
  // metre in front of it: the board's front face is at z = −0.775.
  const cafeSign = graphicPanel(2.4, 0.6, textTexture('CAFÉ', 0x8b5a2b, 0.7, 4), { emissive: 0.12 })
  cafeSign.position.set(0, 1.75, -0.735)
  cafe.add(cafeSign)
  solid(CAFE.x, CAFE.z - 0.9, 1.8, 0.125)

  for (let i = 0; i < count(3); i++) {
    const cup = makeCup({ color: 0xf7f3ec })
    cup.position.set(-1.1 + i * 0.4, 1.1, 0.12)
    cafe.add(cup)
  }

  // Tables run back toward the aisle so the café is visible from it, and stop
  // short of the east wall's 25.8 m inner face once the chairs are counted.
  const cafeTables = count(3)
  for (let i = 0; i < cafeTables; i++) {
    const t = makeRoundTable({ r: 0.38, h: 0.74, accent: new THREE.Color(0x8b5a2b) })
    const tx = -2.0 + i * 1.6
    t.position.set(tx, 0, 1.9)
    cafe.add(t)
    solid(CAFE.x + tx, CAFE.z + 1.9, 0.42, 0.42)
    for (let j = 0; j < 2; j++) {
      const chair = makeChair({ color: 0x6b7280 })
      const a = j * Math.PI + i
      const cx = tx + Math.cos(a) * 0.72
      const cz = 1.9 + Math.sin(a) * 0.72
      chair.position.set(cx, 0, cz)
      chair.rotation.y = -a + Math.PI / 2
      cafe.add(chair)
      // Each chair separately rather than one box round the whole setting, or
      // the café becomes a 5.6 m wall and the bar behind it unreachable.
      solid(CAFE.x + cx, CAFE.z + cz, 0.3, 0.3)
    }
  }
  hall.add(cafe)

  /* ── greenery marking the gaps between stands ──────────────────────── */
  for (const x of [-11, 11]) {
    for (const z of [-HALL.aisleHalf - 0.6, HALL.aisleHalf + 0.6]) {
      const planter = makePlanter({ w: 2.2, accent: accentColor })
      planter.position.set(x, 0, z)
      hall.add(planter)
      solid(x, z, 1.1, 0.32)
    }
  }

  /* ── seating cluster ───────────────────────────────────────────────── */
  /*
   * Pushed to the north side of the aisle. It used to sit at the world origin —
   * dead centre of the only route through the hall, with no collider, so the
   * first thing a visitor did was walk through a table and three stools.
   */
  const LOUNGE = { x: -2.5, z: 2.7, ring: 1.0 }
  const lounge = makeRoundTable({ h: 0.74, r: 0.45 })
  lounge.position.set(LOUNGE.x, 0, LOUNGE.z)
  hall.add(lounge)
  solid(LOUNGE.x, LOUNGE.z, 0.5, 0.5)
  for (let i = 0; i < count(3); i++) {
    // 0.45 m seats to a 0.74 m top: café height, not bar height.
    const s = makeStool({ height: 0.45 })
    const a = (i / 3) * Math.PI * 2
    const sx = LOUNGE.x + Math.cos(a) * LOUNGE.ring
    const sz = LOUNGE.z + Math.sin(a) * LOUNGE.ring
    s.position.set(sx, 0, sz)
    hall.add(s)
    solid(sx, sz, 0.24, 0.24)
  }

  /* ── build-day dressing in the gaps between stands ─────────────────── */
  /*
   * Flight cases and pallet stacks along the stand line. They do the job the
   * crowd used to do — break up the long sightline down the aisle and give the
   * eye something at human scale to judge distance against — and they belong in
   * an empty hall in a way that frozen mannequins never did.
   */
  for (const [x, z, rot] of [
    // 1.7 m apart: at 0.94 these two stacks ran through each other, since each
    // is 1.15 × 0.66 and turned, giving ~1.23 m of combined half-width.
    // Behind the planters at z = ±4.8, which are 0.36 deep — at 1.2 m off the
    // aisle these stacks clipped them.
    [-11.9, -HALL.aisleHalf - 1.6, 0.18],
    [-10.2, -HALL.aisleHalf - 2.1, -0.42],
    [11.6, HALL.aisleHalf + 1.6, -0.24],
    [-0.3, -HALL.aisleHalf - 1.4, 0.5],
    // In the gap between stands B-01 and B-02, not parked on B-03's carpet.
    [0.6, HALL.aisleHalf + 1.5, 0.32],
  ]) {
    const stack = makeFlightCases(accentColor)
    stack.position.set(x, 0, z)
    stack.rotation.y = rot
    hall.add(stack)
    solid(x, z, ...turned(1.15, 0.66, rot))
  }

  hall.userData.spawn = new THREE.Vector3(-W / 2 + 3.5, 0, 0)
  hall.userData.obstacles = obstacles

  hall.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return
    o.castShadow = true
    o.receiveShadow = true
    o.updateMatrix()
    o.matrixAutoUpdate = false
  })
  // The shell itself only receives — a wall casting onto itself just eats fill.
  for (const wall of [north, south, east, west, ceiling, floor, runner]) {
    wall.castShadow = false
  }

  return hall
}

/**
 * A neighbour stand. Three archetypes so a walk down the aisle passes visibly
 * different builds, at roughly a tenth of the geometry of the visitor's stand.
 */
export function makeGenericBooth({ name, color, stand, style = 'wall' }) {
  const g = new THREE.Group()
  g.name = `booth_${stand}`
  const W = 7
  const D = 6
  const H = 3.2
  const tint = new THREE.Color(color)

  const carpet = makeCarpet(W, D, null, { riser: 0.06, accent: tint, color: tint })
  g.add(carpet)

  if (style !== 'island') {
    const wall = box(W, H, 0.14, mat.panel(0xf4f5f8, 0.7, 4))
    wall.position.set(0, 0.06 + H / 2, -D / 2 + 0.1)
    g.add(wall)

    const band = box(W * 0.9, H * 0.34, 0.06, new THREE.MeshStandardMaterial({ color: tint, roughness: 0.55, metalness: 0.05 }))
    band.position.set(0, 0.06 + H * 0.62, -D / 2 + 0.2)
    g.add(band)

    const SIGN = { w: W * 0.7, h: H * 0.2 }
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(SIGN.w, SIGN.h),
      mat.emissivePrint(textTexture(name, color, 1, SIGN.w / SIGN.h), 0.18)
    )
    sign.position.set(0, 0.06 + H * 0.32, -D / 2 + 0.21)
    g.add(sign)
  }

  if (style === 'tower') {
    // A tall totem instead of a back wall band.
    const tower = roundedBox(1.1, 4.2, 1.1, 0.05, mat.panel(0xfbfbfa, 0.5, 3))
    tower.position.set(-W / 2 + 1.2, 0.06 + 2.1, -D / 2 + 1.4)
    g.add(tower)
    const towerBand = box(1.16, 1.2, 1.16, new THREE.MeshStandardMaterial({ color: tint, roughness: 0.5 }))
    towerBand.position.set(-W / 2 + 1.2, 0.06 + 3.1, -D / 2 + 1.4)
    g.add(towerBand)
  }

  if (style === 'island') {
    // Open stand: a hanging ring and a central pod.
    const RING_Y = 3.6
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.09, seg(12, 6), seg(48, 20)),
      new THREE.MeshStandardMaterial({ color: tint, roughness: 0.4, metalness: 0.2 })
    )
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, RING_Y, -0.4)
    g.add(ring)

    // Four drops up to the venue rig. Without them the ring simply hovered.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, HALL.height - 1.55 - RING_Y, 6),
        mat.metal(0x9aa1ad, 0.4, 1)
      )
      wire.position.set(Math.cos(a) * 1.6, (RING_Y + HALL.height - 1.55) / 2, -0.4 + Math.sin(a) * 1.6)
      g.add(wire)
    }

    const POD = { rTop: 1.25, rBot: 1.4, h: 1.05, y: 0.06 + 0.52, z: -0.6 }
    const pod = new THREE.Mesh(
      new THREE.CylinderGeometry(POD.rTop, POD.rBot, POD.h, seg(40, 16)),
      mat.panel(0xffffff, 0.44, 3)
    )
    pod.position.set(0, POD.y, POD.z)
    g.add(pod)

    /*
     * A band wrapped around the pod, following its taper.
     *
     * The pod narrows from 1.4 to 1.25 over its height, so at the band's own
     * height its radius runs 1.312 down to 1.264. A constant 1.27 band was
     * therefore *inside* the pod for most of its height and simply invisible.
     */
    const bandH = 0.34
    const bandY = POD.y + 0.26
    const radiusAt = (y) =>
      POD.rBot + (POD.rTop - POD.rBot) * ((y - (POD.y - POD.h / 2)) / POD.h)
    const podSign = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusAt(bandY + bandH / 2) + 0.012, radiusAt(bandY - bandH / 2) + 0.012, bandH, seg(40, 16), 1, true),
      mat.emissivePrint(textTexture(name, color, 1, (2 * Math.PI * 1.29) / bandH), 0.18)
    )
    podSign.material.side = THREE.DoubleSide
    podSign.position.set(0, bandY, POD.z)
    g.add(podSign)
  }

  const counter = makeCounter({ w: 1.7, accent: tint })
  counter.position.set(W / 2 - 1.4, 0.06, D / 2 - 1.6)
  counter.rotation.y = -0.3
  g.add(counter)

  // One plant per neighbour: eight stands' worth of foliage is a real cost, and
  // nobody stops to count the pot plants on the stand they are walking past.
  const plant = makePlant({ height: 1.0, leaves: 12 })
  plant.position.set(-W / 2 + 0.7, 0.06, D / 2 - 0.9)
  g.add(plant)

  // Goalpost, not a floating beam: eight of these are on screen at once in the
  // walkthrough, and a 7 m truss hanging off nothing reads immediately as wrong.
  const TRUSS = { y: 3.55, z: -D / 2 + 1, legX: W / 2 - 0.35 }
  const truss = makeTruss({ span: W, segments: 6 })
  truss.position.set(0, TRUSS.y, TRUSS.z)
  g.add(truss)
  for (const x of [-TRUSS.legX, TRUSS.legX]) {
    const leg = makeTruss({ span: TRUSS.y - 0.19, size: 0.2, segments: 4 })
    leg.rotation.z = Math.PI / 2
    // The end braces overrun the nominal span by ~0.11, so lift by that much
    // or every leg's foot sinks through the deck.
    leg.position.set(x, (0.06 + TRUSS.y - 0.19) / 2 + 0.11, TRUSS.z)
    g.add(leg)
  }

  // Stand number, on a post by the entrance rather than floating in mid-air.
  const PLATE = { w: 0.6, h: 0.32, x: W / 2 - 0.3, y: 2.2, z: D / 2 - 0.35 }
  const plate = graphicPanel(PLATE.w, PLATE.h, textTexture(stand, color, 0.5, PLATE.w / PLATE.h), { emissive: 0.08 })
  plate.position.set(PLATE.x, PLATE.y, PLATE.z)
  plate.rotation.y = -Math.PI / 2
  g.add(plate)
  const platePost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.034, PLATE.y - 0.06, seg(12, 6)),
    mat.metal(0xb2b7c0, 0.32, 1)
  )
  platePost.position.set(PLATE.x, 0.06 + (PLATE.y - 0.06) / 2, PLATE.z)
  g.add(platePost)

  g.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = true
    o.receiveShadow = true
    o.updateMatrix()
    o.matrixAutoUpdate = false
  })
  return g
}

export function neighbourList() {
  return NEIGHBOURS
}

/**
 * A stack of two or three wheeled flight cases.
 *
 * Human-scale objects at odd angles along the stand line, which is what stops a
 * 52 m aisle reading as a corridor. Cheap: five boxes and four castors.
 */
function makeFlightCases(accent) {
  const g = new THREE.Group()
  g.name = 'flight_cases'

  const shell = mat.dark(0x2b3038, 3)
  const trim = mat.metal(0xa9aeb8, 0.55, 2)

  const sizes = [
    { w: 1.15, h: 0.72, d: 0.66, y: 0.42, x: 0, rot: 0 },
    { w: 0.82, h: 0.46, d: 0.58, y: 1.01, x: 0.1, rot: 0.14 },
  ]

  for (const s of sizes) {
    const body = roundedBox(s.w, s.h, s.d, 0.012, shell)
    body.position.set(s.x, s.y, 0)
    body.rotation.y = s.rot
    g.add(body)

    // Extruded corner rails on the two visible edges.
    for (const sx of [-1, 1]) {
      const rail = box(0.035, s.h + 0.02, 0.035, trim)
      rail.position.set(s.x + (sx * s.w) / 2, s.y, s.d / 2)
      rail.rotation.y = s.rot
      g.add(rail)
    }

    const stripe = box(s.w + 0.006, 0.05, 0.006, new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.7,
      metalness: 0,
    }))
    stripe.position.set(s.x, s.y + s.h * 0.22, s.d / 2 + 0.002)
    stripe.rotation.y = s.rot
    g.add(stripe)
  }

  for (const [cx, cz] of [
    [-0.44, 0.22],
    [0.44, 0.22],
    [-0.44, -0.22],
    [0.44, -0.22],
  ]) {
    const castor = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, seg(14, 8)), mat.dark(0x15181e, 1))
    castor.rotation.z = Math.PI / 2
    castor.position.set(cx, 0.055, cz)
    g.add(castor)
  }

  return g
}

/* ── textures ────────────────────────────────────────────────────────────── */

const textCache = new Map()

/**
 * Centred wordmark on white with a tinted underline.
 *
 * `aspect` is the aspect of the sign it will be printed on, and the canvas is
 * sized to it. Every board in this hall used to get the same 4 : 1 canvas: the
 * entrance sign is 11 : 1 and the neighbours' fascias are 7.7 : 1, so the
 * wordmarks were stretched to nearly three times their width. Pixel budget is
 * held roughly constant, so a long thin sign is wider but proportionally
 * shorter rather than simply bigger.
 */
export function textTexture(text, color = 0x2f6bff, scale = 1, aspect = 4) {
  const key = `${text}|${color}|${scale}|${aspect.toFixed(3)}`
  if (textCache.has(key)) return textCache.get(key)

  const w = Math.min(2048, Math.max(256, Math.round(Math.sqrt(1024 * 256 * aspect))))
  const h = Math.min(1024, Math.max(64, Math.round(w / aspect)))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  const hex = typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color
  ctx.fillStyle = hex
  ctx.fillRect(0, h - h * 0.0625, w, h * 0.0625)

  ctx.fillStyle = '#10131a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let px = h * 0.406 * scale
  do {
    ctx.font = `700 ${px}px 'Space Grotesk', Inter, sans-serif`
    if (ctx.measureText(text).width <= w * 0.86) break
    px -= Math.max(1, px * 0.04)
  } while (px > h * 0.08)
  ctx.fillText(text, w / 2, h / 2 - h * 0.023)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  textCache.set(key, tex)
  return tex
}

let _aisleTex = null
/**
 * Aisle runner: dark carpet with painted lane markings and direction arrows.
 *
 * 2 : 1, tiled three times across a 50 × 8.4 m runner, so each tile covers
 * 16.67 × 8.4 m — within 1 % of the canvas's own aspect. The old 4 : 1 canvas
 * tiled six times gave each tile a world aspect of 0.99, squashing every
 * chevron and lane line to a quarter of its length.
 */
function aisleTexture(accent) {
  if (_aisleTex) return _aisleTex
  const w = 1024
  const h = 512
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')

  ctx.fillStyle = '#2b3140'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = accent
  ctx.fillRect(0, h / 2 - 5, w, 10)

  ctx.strokeStyle = 'rgba(255,255,255,.28)'
  ctx.lineWidth = 6
  ctx.setLineDash([44, 34])
  for (const y of [h * 0.22, h * 0.78]) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // Direction chevrons down the lane: 1.6 m along the aisle, 2.3 m across it.
  ctx.fillStyle = 'rgba(255,255,255,.2)'
  for (let i = 0; i < 8; i++) {
    const x = (w / 8) * i + 40
    ctx.beginPath()
    ctx.moveTo(x, h * 0.36)
    ctx.lineTo(x + 100, h / 2)
    ctx.lineTo(x, h * 0.64)
    ctx.lineTo(x + 36, h / 2)
    ctx.closePath()
    ctx.fill()
  }

  _aisleTex = new THREE.CanvasTexture(c)
  _aisleTex.colorSpace = THREE.SRGBColorSpace
  _aisleTex.wrapS = _aisleTex.wrapT = THREE.RepeatWrapping
  _aisleTex.repeat.set(3, 1)
  _aisleTex.anisotropy = 8
  return _aisleTex
}
