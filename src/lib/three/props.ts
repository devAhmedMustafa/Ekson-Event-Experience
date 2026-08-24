// @ts-nocheck
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mat, env, surface, tileBySize } from './materials'
import { seg, bevel, bevelSegments, count, IS_HIGH, QUALITY } from './quality'
import { fbm } from './noise'

/**
 * Procedural booth furniture.
 *
 * Everything is built from primitives so the whole scene downloads as code, and
 * every prop is parameterised by the visitor's brand accent. Groups are named so
 * logo-bearing surfaces can be found via `scene.getObjectByName('logo_slot_*')`.
 *
 * Segment counts, bevel radii and prop density all come from src/three/quality.js,
 * so a phone gets the same furniture at roughly half the geometry.
 */

const UP = new THREE.Vector3(0, 1, 0)

/* ── geometry helpers ────────────────────────────────────────────────────── */

export function roundedBox(w, h, d, r = 0.02, material = mat.plastic()) {
  const radius = Math.min(bevel(r), w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, bevelSegments(radius > 0.05 ? 5 : 3), Math.max(0.0005, radius)),
    material
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function box(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function tube(radius, height, material, radialSegments = seg(24, 10)) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radialSegments), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * Bend a geometry around the Y axis, so a flat panel becomes a gently curved
 * shell. `amount` is the sweep in radians across the full width.
 */
export function bendAroundY(geometry, amount, width) {
  const pos = geometry.attributes.position
  const half = width / 2
  const radius = half / Math.max(1e-4, Math.sin(amount / 2))
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const theta = (x / half) * (amount / 2)
    pos.setX(i, Math.sin(theta) * (radius + z))
    pos.setZ(i, Math.cos(theta) * (radius + z) - radius)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

/**
 * The largest `w × h` box with the artwork's own aspect that fits inside the
 * box given.
 *
 * Applied graphics on a stand are printed to fit the panel they sit on. A
 * square logo shown on a 3.6 : 1 counter fascia, or a 4 : 1 wordmark shown on
 * an 11 : 1 arch sign, is stretched by exactly that ratio — which is what made
 * every sign in the hall look wrong. Shrinking the geometry to the artwork
 * costs a margin; stretching the artwork costs the artwork.
 */
export function fitToMap(w, h, map) {
  const img = map?.image
  const aspect = img?.width && img?.height ? img.width / img.height : 0
  if (!aspect) return [w, h]
  return w / h > aspect ? [h * aspect, h] : [w, w / aspect]
}

/**
 * Flat printed graphic panel with a thin backing board.
 *
 * `w × h` is the space available, not the size of the print: the face is
 * contained to the artwork's aspect so nothing is ever stretched. Pass a box
 * that already matches the map and this is a no-op.
 */
export function graphicPanel(w, h, map, { emissive = 0.05, backing = true, doubleSided = false } = {}) {
  const group = new THREE.Group()
  const [fw, fh] = fitToMap(w, h, map)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), mat.print(map, { emissiveBoost: emissive }))
  if (doubleSided) face.material.side = THREE.DoubleSide
  face.receiveShadow = true
  group.add(face)
  if (backing) {
    const back = roundedBox(fw, fh, 0.03, 0.004, mat.panel(0xe7e9ee, 0.66, 2))
    back.position.z = -0.028
    group.add(back)
  }
  group.userData.size = { w: fw, h: fh }
  return group
}

/* ── flooring ────────────────────────────────────────────────────────────── */

export function makeCarpet(w, d, map, { riser = 0.06, accent = 0x2f6bff, color = 0xffffff } = {}) {
  const group = new THREE.Group()
  group.name = 'carpet'

  const deck = roundedBox(w, riser, d, 0.004, mat.panel(0xf0f0ee, 0.8, 6))
  deck.position.y = riser / 2
  group.add(deck)

  const surfaceMaps = surface('carpet', Math.max(4, Math.round(w * 1.4)))
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.02, d - 0.02),
    new THREE.MeshStandardMaterial({
      // Tiled by the metre, not by a fixed count: a 7 × 6 m deck stretched every
      // tile of a square weave 17 % along one axis.
      map: map ? tileBySize(map, w - 0.02, d - 0.02, 1) : null,
      color,
      metalness: 0,
      ...surfaceMaps,
      normalScale: new THREE.Vector2(0.18, 0.18),
      roughnessMap: null,
      roughness: 1,
      envMapIntensity: QUALITY.envMapIntensity * 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })
  )
  top.rotation.x = -Math.PI / 2
  top.position.y = riser + 0.002
  top.receiveShadow = true
  group.add(top)

  const trimH = Math.min(0.014, riser * 0.42)
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.024, trimH, d + 0.024),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6, metalness: 0.04, envMapIntensity: env(0.5) })
  )
  edge.position.y = riser * 0.45
  edge.castShadow = true
  group.add(edge)

  return group
}

/* ── counter / reception desk ────────────────────────────────────────────── */

export function makeCounter({ w = 2.1, h = 1.05, d = 0.62, logoMap, accent = 0x2f6bff } = {}) {
  const group = new THREE.Group()
  group.name = 'counter'

  /*
   * Body ends 12 mm below the worktop and the reveal fills the gap, inset
   * 10 mm all round so it reads as a recess. The reveal used to be a box
   * *narrower than the body and inside it*, which made it invisible — and the
   * body ran all the way up to the worktop, so there was no shadow gap at all.
   */
  const body = roundedBox(w, h - 0.122, d, 0.012, mat.panel(0xfdfdfd, 0.46, 3))
  body.position.y = 0.11 + (h - 0.122) / 2
  group.add(body)

  // Chamfered worktop with a slight overhang.
  const worktop = roundedBox(w + 0.09, 0.048, d + 0.09, 0.008, mat.dark(0x272c36, 3))
  worktop.position.y = h + 0.024
  group.add(worktop)

  const shadowGap = box(w - 0.02, 0.012, d - 0.02, mat.dark(0x14171d, 1))
  shadowGap.position.y = h - 0.006
  group.add(shadowGap)

  if (logoMap) {
    const fascia = graphicPanel(w * 0.84, h * 0.46, logoMap, { backing: false, emissive: 0.05 })
    fascia.position.set(0, h * 0.58, d / 2 + 0.007)
    fascia.name = 'logo_slot_counter'
    group.add(fascia)
  }

  // Accent light line under the worktop lip.
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.96, 0.014, 0.014),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.0 })
  )
  glow.position.set(0, h - 0.03, d / 2 + 0.006)
  group.add(glow)

  // Recessed toe kick — the dark gap is what makes furniture sit on a floor.
  const kick = box(w * 0.97, 0.11, d * 0.88, mat.dark(0x15181e, 1))
  kick.position.y = 0.055
  group.add(kick)

  return group
}

/* ── seating ─────────────────────────────────────────────────────────────── */

export function makeStool({ accent = 0x2f6bff, height = 0.74 } = {}) {
  const g = new THREE.Group()
  g.name = 'stool'

  // Dished seat via a lathe, so it isn't a hockey puck.
  const seatProfile = []
  seatProfile.push(new THREE.Vector2(0, 0.052))
  seatProfile.push(new THREE.Vector2(0.09, 0.05))
  seatProfile.push(new THREE.Vector2(0.15, 0.044))
  seatProfile.push(new THREE.Vector2(0.185, 0.032))
  seatProfile.push(new THREE.Vector2(0.196, 0.016))
  seatProfile.push(new THREE.Vector2(0.19, 0.002))
  seatProfile.push(new THREE.Vector2(0.16, 0))
  seatProfile.push(new THREE.Vector2(0, 0.004))

  const seat = new THREE.Mesh(
    new THREE.LatheGeometry(seatProfile, seg(48, 18)),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.46, metalness: 0.06, ...surface('peel', 2) })
  )
  seat.position.y = height
  seat.castShadow = true
  seat.receiveShadow = true
  g.add(seat)

  // Runs a centimetre into the seat: the dished lathe is only 4 mm deep at the
  // axis, so a column stopping exactly at `height` left a visible gap under it.
  const column = tube(0.026, height - 0.01, mat.metal(0xc6cad2, 0.24, 1), seg(20, 8))
  column.position.y = (height - 0.01) / 2 + 0.03
  g.add(column)

  const sleeve = tube(0.034, 0.13, mat.metal(0xaeb3bb, 0.3, 1), seg(20, 8))
  sleeve.position.y = height * 0.42
  g.add(sleeve)

  const baseProfile = []
  baseProfile.push(new THREE.Vector2(0, 0.03))
  baseProfile.push(new THREE.Vector2(0.1, 0.028))
  baseProfile.push(new THREE.Vector2(0.2, 0.016))
  baseProfile.push(new THREE.Vector2(0.228, 0.006))
  baseProfile.push(new THREE.Vector2(0.232, 0))
  baseProfile.push(new THREE.Vector2(0, 0))
  const base = new THREE.Mesh(new THREE.LatheGeometry(baseProfile, seg(48, 18)), mat.metal(0xa8adb6, 0.3, 1))
  base.castShadow = true
  g.add(base)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.155, 0.011, seg(12, 6), seg(40, 16)),
    mat.metal(0xc6cad2, 0.24, 1)
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.235
  ring.castShadow = true
  g.add(ring)

  return g
}

export function makeChair({ color = 0x4a5162, accent = null } = {}) {
  const g = new THREE.Group()
  g.name = 'chair'
  const shellMat = new THREE.MeshStandardMaterial({
    color: accent ?? color,
    roughness: 0.6,
    metalness: 0.03,
    side: THREE.DoubleSide,
    ...surface('peel', 3),
  })

  // Moulded shell: a seat pan and a back panel, both curved.
  const seatGeo = new RoundedBoxGeometry(0.46, 0.028, 0.44, bevelSegments(4), bevel(0.014))
  bendAroundY(seatGeo, 0.28, 0.46)
  const seat = new THREE.Mesh(seatGeo, shellMat)
  seat.position.y = 0.44
  seat.rotation.x = -0.04
  seat.castShadow = true
  seat.receiveShadow = true
  g.add(seat)

  const backGeo = new RoundedBoxGeometry(0.44, 0.4, 0.026, bevelSegments(4), bevel(0.013))
  bendAroundY(backGeo, 0.5, 0.44)
  const back = new THREE.Mesh(backGeo, shellMat)
  back.position.set(0, 0.665, -0.196)
  back.rotation.x = -0.16
  back.castShadow = true
  g.add(back)

  // Tapered legs splayed outward.
  const legMat = mat.metal(0xa6abb4, 0.3, 1)
  for (const [x, z] of [
    [0.185, 0.175],
    [-0.185, 0.175],
    [0.185, -0.175],
    [-0.185, -0.175],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.014, 0.45, seg(12, 6)),
      legMat
    )
    leg.position.set(x, 0.222, z)
    leg.rotation.set(z > 0 ? -0.07 : 0.07, 0, x > 0 ? 0.07 : -0.07)
    leg.castShadow = true
    g.add(leg)

    // Glide sits ON the floor — at 0.008 a 0.011 sphere pushed 3 mm through it.
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), mat.dark(0x1c2027, 1))
    foot.position.set(x * 1.14, 0.011, z * 1.14)
    g.add(foot)
  }

  // Cross braces between the front and back legs.
  for (const z of [0.175, -0.175]) {
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.37, seg(10, 6)), legMat)
    brace.rotation.z = Math.PI / 2
    brace.position.set(0, 0.15, z * 1.05)
    g.add(brace)
  }

  return g
}

export function makeArmchair({ color = 0xdfe3ea, accent = 0x2f6bff } = {}) {
  const g = new THREE.Group()
  g.name = 'armchair'
  const shell = mat.fabric(color, 6)

  /*
   * Heights, from the floor up, against a real lounge chair:
   *
   *   0.00 … 0.14   turned legs
   *   0.14 … 0.36   upholstered tub
   *   0.32 … 0.47   seat cushion, dropped 40 mm into the tub
   *   0.36 … 0.65   arms — 180 mm above the seat
   *   0.36 … 0.82   back
   *
   * The tub used to start at 0.15 with the legs stopping at 0.14 (a centimetre
   * of daylight under every chair) and the cushion's top landed at 0.575, so
   * the seat was 130 mm too high and the armrests finished level with it.
   */
  const LEG_H = 0.14
  const TUB_H = 0.22
  const SEAT_Y = 0.47

  const base = roundedBox(0.84, TUB_H, 0.8, 0.075, shell)
  base.position.y = LEG_H + TUB_H / 2
  g.add(base)

  // Seat cushion, slightly crowned and inset.
  const cushionGeo = new RoundedBoxGeometry(0.7, 0.15, 0.66, bevelSegments(5), bevel(0.06))
  const cpos = cushionGeo.attributes.position
  for (let i = 0; i < cpos.count; i++) {
    const x = cpos.getX(i)
    const z = cpos.getZ(i)
    const crown = Math.cos((x / 0.35) * 1.2) * Math.cos((z / 0.33) * 1.2)
    cpos.setY(i, cpos.getY(i) + Math.max(0, crown) * 0.014)
  }
  cushionGeo.computeVertexNormals()
  const cushion = new THREE.Mesh(cushionGeo, mat.fabric(0xfbfbf8, 6))
  cushion.position.y = SEAT_Y - 0.075
  cushion.castShadow = true
  cushion.receiveShadow = true
  g.add(cushion)

  const backGeo = new RoundedBoxGeometry(0.84, 0.46, 0.18, bevelSegments(5), bevel(0.07))
  bendAroundY(backGeo, 0.34, 0.84)
  const back = new THREE.Mesh(backGeo, shell)
  back.position.set(0, 0.59, -0.3)
  back.rotation.x = -0.12
  back.castShadow = true
  g.add(back)

  const backCushion = roundedBox(0.66, 0.32, 0.1, 0.05, mat.fabric(0xfbfbf8, 6))
  backCushion.position.set(0, 0.64, -0.238)
  backCushion.rotation.x = -0.16
  g.add(backCushion)

  for (const x of [-0.38, 0.38]) {
    const arm = roundedBox(0.09, 0.29, 0.72, 0.042, shell)
    arm.position.set(x, LEG_H + TUB_H / 2 + 0.145, -0.01)
    g.add(arm)
  }

  const piping = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.016, 0.82),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.55, ...surface('fabric', 8) })
  )
  piping.position.y = LEG_H + 0.008
  g.add(piping)

  // Turned wooden legs.
  const legProfile = []
  legProfile.push(new THREE.Vector2(0, 0))
  legProfile.push(new THREE.Vector2(0.014, 0))
  legProfile.push(new THREE.Vector2(0.018, 0.03))
  legProfile.push(new THREE.Vector2(0.022, 0.09))
  legProfile.push(new THREE.Vector2(0.026, 0.14))
  legProfile.push(new THREE.Vector2(0, 0.14))
  for (const [x, z] of [
    [0.33, 0.32],
    [-0.33, 0.32],
    [0.33, -0.32],
    [-0.33, -0.32],
  ]) {
    const leg = new THREE.Mesh(new THREE.LatheGeometry(legProfile, seg(20, 8)), mat.wood(0x9a6f45, 1))
    leg.position.set(x, 0, z)
    leg.castShadow = true
    g.add(leg)
  }
  return g
}

/* ── tables ──────────────────────────────────────────────────────────────── */

export function makeRoundTable({ r = 0.42, h = 1.05, accent = 0x2f6bff } = {}) {
  const g = new THREE.Group()
  g.name = 'table'

  // Chamfered top edge via a lathe.
  const topProfile = []
  topProfile.push(new THREE.Vector2(0, 0.048))
  topProfile.push(new THREE.Vector2(r - 0.012, 0.048))
  topProfile.push(new THREE.Vector2(r, 0.036))
  topProfile.push(new THREE.Vector2(r, 0.012))
  topProfile.push(new THREE.Vector2(r - 0.012, 0))
  topProfile.push(new THREE.Vector2(0, 0))
  const top = new THREE.Mesh(new THREE.LatheGeometry(topProfile, seg(64, 24)), mat.panel(0xffffff, 0.3, 2))
  top.position.y = h
  top.castShadow = true
  top.receiveShadow = true
  g.add(top)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(r - 0.002, 0.008, seg(10, 6), seg(64, 24)),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6, metalness: 0.05 })
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = h + 0.024
  g.add(rim)

  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.056, h - 0.06, seg(28, 12)),
    mat.metal(0xb2b7c0, 0.28, 1)
  )
  column.position.y = (h - 0.06) / 2 + 0.03
  column.castShadow = true
  g.add(column)

  const footProfile = []
  footProfile.push(new THREE.Vector2(0, 0.034))
  footProfile.push(new THREE.Vector2(0.12, 0.032))
  footProfile.push(new THREE.Vector2(0.28, 0.018))
  footProfile.push(new THREE.Vector2(0.32, 0.006))
  footProfile.push(new THREE.Vector2(0.325, 0))
  footProfile.push(new THREE.Vector2(0, 0))
  const foot = new THREE.Mesh(new THREE.LatheGeometry(footProfile, seg(56, 20)), mat.metal(0xa8adb6, 0.3, 1))
  foot.castShadow = true
  g.add(foot)

  return g
}

export function makeCoffeeTable({ w = 0.95, d = 0.6, h = 0.42 } = {}) {
  const g = new THREE.Group()
  const INSET = 0.055
  g.name = 'coffee_table'

  /*
   * `h` is the height of the finished surface, so the 14 mm glass hangs below
   * it and the legs stop underneath. The legs used to run the full `h` from the
   * floor and sit centred on `h`, which pushed 7 mm of steel up through the
   * glass on all four corners.
   */
  const topY = h - 0.007
  const legH = h - 0.014

  const top = roundedBox(w, 0.014, d, 0.006, mat.glass())
  top.position.y = topY
  top.castShadow = false
  g.add(top)

  // The lower shelf spans between the legs and is carried by them; sized off
  // the leg centres rather than off `w`, it used to float 39 mm short of each.
  const shelf = roundedBox(w - INSET * 2, 0.022, d - INSET * 2, 0.006, mat.wood(0xb98a5c, 2))
  shelf.position.y = h * 0.34
  g.add(shelf)

  for (const [x, z] of [
    [w / 2 - INSET, d / 2 - INSET],
    [-(w / 2 - INSET), d / 2 - INSET],
    [w / 2 - INSET, -(d / 2 - INSET)],
    [-(w / 2 - INSET), -(d / 2 - INSET)],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.019, legH, seg(14, 6)), mat.metal(0x8f959f, 0.3, 1))
    leg.position.set(x, legH / 2, z)
    leg.castShadow = true
    g.add(leg)
  }
  return g
}

/* ── greenery ────────────────────────────────────────────────────────────── */

/**
 * `spread` is how far the stems reach from the trunk. It is a real constraint,
 * not decoration: the foliage used to be sized off a random `reach` that could
 * put leaf tips 0.9 m out on a 1.3 m plant, which is a two-metre-wide shrub and
 * pushed both of the stand's plants past the edge of the 7 × 6 m plot.
 *
 * `userData.radius` is the resulting silhouette radius, so callers can place a
 * plant against a wall or a plot edge without guessing.
 */
export function makePlant({
  height = 1.1,
  potColor = 0xe8e4dc,
  leafColor = 0x2f8f5b,
  leaves = 16,
  spread = height * 0.26,
} = {}) {
  const g = new THREE.Group()
  g.name = 'plant'

  const potH = height * 0.3
  const potR = potH * 0.62

  // Tapered pot with a rolled lip, in one lathe.
  const potProfile = []
  potProfile.push(new THREE.Vector2(0, 0))
  potProfile.push(new THREE.Vector2(potR * 0.78, 0))
  potProfile.push(new THREE.Vector2(potR * 0.8, 0.012))
  potProfile.push(new THREE.Vector2(potR * 0.94, potH * 0.55))
  potProfile.push(new THREE.Vector2(potR, potH - 0.012))
  potProfile.push(new THREE.Vector2(potR * 1.06, potH - 0.004))
  potProfile.push(new THREE.Vector2(potR * 1.06, potH))
  potProfile.push(new THREE.Vector2(potR * 0.96, potH))
  potProfile.push(new THREE.Vector2(potR * 0.9, potH - 0.02))
  potProfile.push(new THREE.Vector2(potR * 0.88, potH * 0.3))
  potProfile.push(new THREE.Vector2(0, potH * 0.28))

  const pot = new THREE.Mesh(
    new THREE.LatheGeometry(potProfile, seg(48, 18)),
    new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.82, metalness: 0, ...surface('concrete', 2) })
  )
  pot.castShadow = true
  pot.receiveShadow = true
  g.add(pot)

  const soil = new THREE.Mesh(
    new THREE.CircleGeometry(potR * 0.88, seg(32, 14)),
    new THREE.MeshStandardMaterial({ color: 0x342821, roughness: 1, ...surface('concrete', 3) })
  )
  soil.rotation.x = -Math.PI / 2
  soil.position.y = potH * 0.3
  g.add(soil)

  /**
   * Every stem and every leaf is baked into one geometry apiece: a 16-leaf
   * plant costs 2 draw calls instead of 32. Leaves are curled along their
   * length so they catch light like foliage rather than like paper.
   */
  const leafMat = mat.leaf(leafColor)
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x33693f, roughness: 0.72 })
  const stemGeos = []
  const leafGeos = []
  const scratch = new THREE.Object3D()
  const n = count(leaves, 'foliage')

  for (let i = 0; i < n; i++) {
    const t = i / n
    const angle = i * 2.399 // golden angle keeps foliage from clumping
    const reach = spread * (0.5 + Math.random() * 0.5)
    const rise = potH + height * (0.14 + t * 0.52) + Math.random() * height * 0.12
    const tilt = 0.35 + Math.random() * 0.55

    const tipX = Math.cos(angle) * reach
    const tipZ = Math.sin(angle) * reach

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, potH * 0.32, 0),
      new THREE.Vector3(tipX * 0.28, potH + (rise - potH) * 0.5, tipZ * 0.28),
      new THREE.Vector3(tipX, rise, tipZ),
    ])
    stemGeos.push(new THREE.TubeGeometry(curve, seg(10, 5), 0.0065, seg(6, 4), false))

    const size = height * (0.26 + Math.random() * 0.16)
    // A 3x3 plane so the leaf can be curled; a single quad reads as card.
    const leafGeo = new THREE.PlaneGeometry(1, 1, 3, 3)
    const lp = leafGeo.attributes.position
    for (let v = 0; v < lp.count; v++) {
      const lx = lp.getX(v)
      const ly = lp.getY(v)
      lp.setZ(v, -Math.abs(lx) * 0.34 - (0.5 - ly) * 0.12)
    }
    leafGeo.computeVertexNormals()

    scratch.position.set(tipX, rise, tipZ)
    scratch.quaternion.identity()
    scratch.scale.set(size * 0.62, size, size * 0.6)
    scratch.lookAt(tipX * 2.2, rise + size * 0.5, tipZ * 2.2)
    scratch.rotateX(-tilt)
    scratch.rotateZ(Math.random() * 0.6 - 0.3)
    scratch.translateY(size * 0.42)
    scratch.updateMatrix()
    leafGeos.push(leafGeo.applyMatrix4(scratch.matrix))
  }

  const stems = new THREE.Mesh(mergeGeometries(stemGeos), stemMat)
  stems.castShadow = true
  g.add(stems)
  for (const geo of stemGeos) geo.dispose()

  const foliage = new THREE.Mesh(mergeGeometries(leafGeos), leafMat)
  foliage.castShadow = true
  g.add(foliage)
  for (const geo of leafGeos) geo.dispose()

  // Stem tips reach `spread`; a leaf adds up to its own half-length past that.
  g.userData.radius = Math.max(potR * 1.06, spread + height * 0.26)
  return g
}

/** Low planter box — used to fence the lounge area. */
export function makePlanter({ w = 1.2, d = 0.36, h = 0.42, accent = 0x2f6bff } = {}) {
  const g = new THREE.Group()
  const shell = roundedBox(w, h, d, 0.016, mat.panel(0xfbfbf9, 0.66, 3))
  shell.position.y = h / 2
  g.add(shell)

  const band = box(w + 0.012, 0.022, d + 0.012, new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6, metalness: 0.05 }))
  band.position.y = h - 0.05
  g.add(band)

  const soil = box(w - 0.06, 0.02, d - 0.06, new THREE.MeshStandardMaterial({ color: 0x342821, roughness: 1 }))
  soil.position.y = h - 0.004
  g.add(soil)

  const bushes = count(Math.max(2, Math.round(w / 0.45)))
  for (let i = 0; i < bushes; i++) {
    const shrub = makeBush(0.2 + Math.random() * 0.08)
    shrub.position.set(-w / 2 + (w / bushes) * (i + 0.5), h - 0.01, (Math.random() - 0.5) * d * 0.3)
    g.add(shrub)
  }

  const bounds = new THREE.Box3().setFromObject(g)
  g.userData.halfW = Math.max(w / 2, bounds.max.x, -bounds.min.x)
  g.userData.halfD = Math.max(d / 2, bounds.max.z, -bounds.min.z)
  return g
}

export function makeBush(radius = 0.24, color = 0x3f9c62) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.86, flatShading: true, metalness: 0 })
  const parts = []
  const blobs = IS_HIGH ? 6 : 3
  for (let i = 0; i < blobs; i++) {
    const blob = new THREE.IcosahedronGeometry(radius * (0.5 + Math.random() * 0.45), IS_HIGH ? 2 : 1)
    // Roughen each blob so the cluster doesn't read as stacked balls.
    const p = blob.attributes.position
    const field = fbm(32, { octaves: 2, cells: 4, seed: 5 + i })
    for (let v = 0; v < p.count; v++) {
      const k = 1 + (field[(v * 7) % field.length] - 0.5) * 0.28
      p.setXYZ(v, p.getX(v) * k, p.getY(v) * k, p.getZ(v) * k)
    }
    blob.computeVertexNormals()
    blob.translate(
      (Math.random() - 0.5) * radius * 1.3,
      radius * (0.32 + Math.random() * 0.5),
      (Math.random() - 0.5) * radius * 1.3
    )
    parts.push(blob)
  }
  const merged = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  const mesh = new THREE.Mesh(merged, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/* ── display fixtures ────────────────────────────────────────────────────── */

export function makePlinth({ w = 0.46, h = 0.95, d = 0.46, accent = 0x2f6bff, logoMap = null } = {}) {
  const g = new THREE.Group()
  g.name = 'plinth'

  const body = roundedBox(w, h - 0.05, d, 0.008, mat.panel(0xffffff, 0.38, 3))
  body.position.y = 0.05 + (h - 0.05) / 2
  g.add(body)

  const cap = roundedBox(w + 0.026, 0.02, d + 0.026, 0.005, mat.dark(0x272c36, 2))
  cap.position.y = h + 0.01
  g.add(cap)

  // Floating base: a recessed plinth foot reads as a solid object on a floor.
  const foot = box(w - 0.06, 0.05, d - 0.06, mat.dark(0x15181e, 1))
  foot.position.y = 0.025
  g.add(foot)

  const stripe = box(w + 0.004, 0.026, d + 0.004, new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6, metalness: 0.05 }))
  stripe.position.y = 0.09
  g.add(stripe)

  if (logoMap) {
    const plate = graphicPanel(w * 0.68, w * 0.68, logoMap, { backing: false, emissive: 0.05 })
    plate.position.set(0, h * 0.62, d / 2 + 0.005)
    plate.name = 'logo_slot_plinth'
    g.add(plate)
  }
  return g
}

/** Wall-mounted / floor-standing screen showing an artwork texture. */
export function makeScreen({ w = 1.6, h = 0.95, map, stand = false } = {}) {
  const g = new THREE.Group()
  g.name = 'screen'

  const bezel = roundedBox(w + 0.05, h + 0.05, 0.042, 0.008, mat.dark(0x14171d, 2))
  g.add(bezel)

  // A real display letterboxes a mismatched image against its own black rather
  // than stretching it, and the bezel's dark front face is already behind this.
  const [pw, ph] = fitToMap(w, h, map)
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat.emissivePrint(map, 0.72))
  panel.position.z = 0.024
  panel.name = 'logo_slot_screen'
  g.add(panel)

  // Anti-glare sheen over the panel. Matte, not mirrored — a display with a
  // gloss coating catches one soft highlight, not the whole room.
  const gloss = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity: 0.05,
      roughness: 0.34,
      metalness: 0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
    })
  )
  gloss.position.z = 0.0255
  g.add(gloss)

  if (stand) {
    const neck = roundedBox(0.09, 0.5, 0.07, 0.01, mat.dark(0x22262f, 2))
    neck.position.y = -h / 2 - 0.25
    g.add(neck)
    const foot = roundedBox(0.7, 0.026, 0.34, 0.008, mat.dark(0x22262f, 2))
    foot.position.y = -h / 2 - 0.5
    g.add(foot)
    g.position.y = h / 2 + 0.5
  }
  return g
}

/**
 * Pull-up banner: printed skin with a slight curl, cassette, back leg.
 *
 * 850 × 2000 mm is the standard cassette, and `towerTexture` paints at exactly
 * that aspect — a roll-up's print is its cassette width, so this is one of the
 * few graphics that must not be contained to fit.
 */
export function makeRollup({ w = 0.85, h = 2.0, map } = {}) {
  const g = new THREE.Group()
  g.name = 'rollup'

  // A subtle S-curl across the width — printed vinyl never hangs dead flat.
  const skinGeo = new THREE.PlaneGeometry(w, h, 8, 2)
  const sp = skinGeo.attributes.position
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i)
    const y = sp.getY(i)
    const fall = (y + h / 2) / h
    sp.setZ(i, Math.sin((x / w) * Math.PI * 1.4) * 0.012 * (0.3 + fall * 0.7))
  }
  skinGeo.computeVertexNormals()

  const skin = new THREE.Mesh(skinGeo, mat.print(map, { emissiveBoost: 0.06 }))
  skin.material.side = THREE.DoubleSide
  skin.position.y = h / 2 + 0.09
  skin.castShadow = true
  skin.name = 'logo_slot_rollup'
  g.add(skin)

  const cassette = roundedBox(w + 0.07, 0.085, 0.155, 0.028, mat.metal(0xd4d8de, 0.28, 2))
  cassette.position.y = 0.045
  g.add(cassette)

  const endCapMat = mat.dark(0x2a2f38, 1)
  for (const x of [-(w + 0.07) / 2, (w + 0.07) / 2]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, seg(20, 8)), endCapMat)
    cap.rotation.z = Math.PI / 2
    cap.position.set(x, 0.045, 0)
    g.add(cap)
  }

  const pole = tube(0.011, h, mat.metal(0xc0c5cc, 0.26, 1), seg(12, 6))
  pole.position.set(0, h / 2 + 0.09, -0.035)
  g.add(pole)

  const top = roundedBox(w + 0.02, 0.018, 0.028, 0.005, mat.metal(0xc0c5cc, 0.26, 1))
  top.position.y = h + 0.09
  g.add(top)

  return g
}

/* ── overhead rig ────────────────────────────────────────────────────────── */

/** Box truss spanning `span` metres along X, merged into one draw call. */
export function makeTruss({ span = 6, size = 0.26, segments = 10 } = {}) {
  const metal = mat.metal(0xc4c8ce, 0.32, 3)
  const half = size / 2
  const parts = []
  const scratch = new THREE.Object3D()

  const add = (geometry, position, rotation) => {
    scratch.position.set(...position)
    scratch.rotation.set(...rotation)
    scratch.scale.set(1, 1, 1)
    scratch.updateMatrix()
    parts.push(geometry.clone().applyMatrix4(scratch.matrix))
  }

  const chordGeo = new THREE.CylinderGeometry(0.026, 0.026, span, seg(12, 6))
  for (const [y, z] of [
    [half, half],
    [half, -half],
    [-half, half],
    [-half, -half],
  ]) {
    add(chordGeo, [0, y, z], [0, 0, Math.PI / 2])
  }
  chordGeo.dispose()

  const braceGeo = new THREE.CylinderGeometry(0.012, 0.012, size * 1.42, seg(8, 5))
  const crossGeo = new THREE.CylinderGeometry(0.012, 0.012, size, seg(8, 5))
  const nodeGeo = new THREE.SphereGeometry(0.021, seg(10, 6), seg(8, 4))
  const segCount = Math.max(4, Math.round(segments * (IS_HIGH ? 1 : 0.7)))

  for (let i = 0; i <= segCount; i++) {
    const x = -span / 2 + (span / segCount) * i
    for (const z of [half, -half]) {
      add(braceGeo, [x, 0, z], [0, 0, i % 2 ? Math.PI / 4 : -Math.PI / 4])
    }
    if (i % 2 === 0) {
      for (const y of [half, -half]) add(crossGeo, [x, y, 0], [Math.PI / 2, 0, 0])
      // Welded nodes at the corners.
      for (const y of [half, -half]) {
        for (const z of [half, -half]) add(nodeGeo, [x, y, z], [0, 0, 0])
      }
    }
  }
  braceGeo.dispose()
  crossGeo.dispose()
  nodeGeo.dispose()

  const truss = new THREE.Mesh(mergeGeometries(parts), metal)
  truss.name = 'truss'
  truss.castShadow = true
  for (const p of parts) p.dispose()
  return truss
}

/** Stage spot: housing, barn doors, emissive lens. */
export function makeSpot({ color = 0xfff0d8, withLight = false, intensity = 12, target = null } = {}) {
  const g = new THREE.Group()
  g.name = 'spot'

  const yoke = new THREE.Mesh(
    new THREE.TorusGeometry(0.078, 0.009, seg(8, 5), seg(20, 10), Math.PI),
    mat.dark(0x1a1d24, 1)
  )
  yoke.rotation.y = Math.PI / 2
  g.add(yoke)

  const bodyProfile = []
  bodyProfile.push(new THREE.Vector2(0.028, 0))
  bodyProfile.push(new THREE.Vector2(0.06, 0.012))
  bodyProfile.push(new THREE.Vector2(0.062, 0.13))
  bodyProfile.push(new THREE.Vector2(0.079, 0.185))
  bodyProfile.push(new THREE.Vector2(0.079, 0.2))
  bodyProfile.push(new THREE.Vector2(0.066, 0.2))
  bodyProfile.push(new THREE.Vector2(0.05, 0.14))
  bodyProfile.push(new THREE.Vector2(0.02, 0.02))
  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile, seg(28, 12)), mat.dark(0x23272f, 2))
  body.rotation.x = Math.PI / 2
  body.position.z = -0.02
  body.castShadow = true
  g.add(body)

  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.062, seg(24, 12)),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.4 })
  )
  lens.position.z = 0.176
  g.add(lens)

  // Barn doors.
  for (const [rx, ry] of [
    [0.5, 0],
    [-0.5, 0],
    [0, 0.5],
    [0, -0.5],
  ]) {
    const flap = roundedBox(0.09, 0.09, 0.004, 0.003, mat.dark(0x16191f, 1))
    flap.position.set(ry * 0.2, rx * 0.2, 0.2)
    flap.rotation.set(rx * 0.9, ry * 0.9, 0)
    g.add(flap)
  }

  if (withLight) {
    const light = new THREE.SpotLight(color, intensity, 14, Math.PI / 7, 0.45, 1.6)
    light.position.set(0, 0, 0.1)
    g.add(light)
    if (target) {
      light.target = target
      g.userData.light = light
    }
  }
  return g
}

/**
 * Circular hanging sign above the stand — the classic expo "ring".
 *
 * `rise` is the length of the four suspension wires running up from the ring.
 * These signs hang off the venue's ceiling rig, not off the stand — so the
 * wires just head upward and leave frame, which is what a visitor expects to
 * see when they look up.
 */
export function makeHangingSign({ radius = 1.2, height = 0.8, map, accent = 0x2f6bff, rise = 1.4 } = {}) {
  const g = new THREE.Group()
  g.name = 'hanging_sign'

  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, seg(72, 28), 1, true),
    map ? mat.emissivePrint(map, 0.45) : mat.panel(0xffffff, 0.7, 2)
  )
  drum.material.side = THREE.DoubleSide
  drum.name = 'logo_slot_hanging'
  drum.castShadow = true
  g.add(drum)

  for (const y of [height / 2, -height / 2]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.022, seg(10, 6), seg(72, 28)),
      new THREE.MeshStandardMaterial({ color: accent, roughness: 0.55, metalness: 0.12 })
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = y
    ring.castShadow = true
    g.add(ring)
  }

  if (rise > 0) {
    // Thin meshes rather than Lines: a 1 px line vanishes at any distance, and
    // four of them is not a draw call worth economising on.
    const wireMat = mat.metal(0x9aa1ad, 0.55, 1)
    const lean = new THREE.Object3D()
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const foot = new THREE.Vector3(Math.cos(a) * radius * 0.78, height / 2, Math.sin(a) * radius * 0.78)
      const head = new THREE.Vector3(0, height / 2 + rise, 0)
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, foot.distanceTo(head), 6),
        wireMat
      )
      wire.position.copy(foot).add(head).multiplyScalar(0.5)
      lean.position.copy(foot)
      lean.lookAt(head)
      // lookAt aims −Z; a cylinder runs along +Y, so tip it a quarter turn.
      wire.quaternion.copy(lean.quaternion)
      wire.rotateX(-Math.PI / 2)
      g.add(wire)
    }
  }
  return g
}

/* ── small dressing ─────────────────────────────────────────────────────── */

export function makeCup({ color = 0xffffff } = {}) {
  const g = new THREE.Group()
  const profile = []
  profile.push(new THREE.Vector2(0, 0))
  profile.push(new THREE.Vector2(0.026, 0))
  profile.push(new THREE.Vector2(0.031, 0.008))
  profile.push(new THREE.Vector2(0.036, 0.09))
  profile.push(new THREE.Vector2(0.0335, 0.09))
  profile.push(new THREE.Vector2(0.029, 0.01))
  profile.push(new THREE.Vector2(0, 0.009))
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, seg(32, 14)), mat.ceramic(color, 1))
  body.castShadow = true
  g.add(body)

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.018, 0.0035, seg(8, 5), seg(24, 10), Math.PI * 1.3),
    mat.ceramic(color, 1)
  )
  handle.position.set(0.034, 0.05, 0)
  handle.rotation.z = -0.4
  handle.scale.z = 0.6
  g.add(handle)

  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.064, 0.056, 0.007, seg(36, 16)),
    mat.ceramic(color, 1)
  )
  saucer.position.y = 0.0035
  saucer.receiveShadow = true
  g.add(saucer)
  return g
}

export function makeBrochureStack({ map, count: n = 3 } = {}) {
  const g = new THREE.Group()
  for (let i = 0; i < n; i++) {
    // A4: 210 × 297 mm. The artwork is painted at the same aspect, so the top
    // face of the stack shows the card without squashing it.
    const sheet = new THREE.Mesh(
      new RoundedBoxGeometry(0.21, 0.006, 0.297, 1, 0.0015),
      map ? mat.print(map, { emissiveBoost: 0.03 }) : mat.paper(0xffffff, 2)
    )
    sheet.position.set((Math.random() - 0.5) * 0.022, 0.003 + i * 0.0072, (Math.random() - 0.5) * 0.022)
    sheet.rotation.y = (Math.random() - 0.5) * 0.14
    sheet.castShadow = true
    sheet.receiveShadow = true
    g.add(sheet)
  }
  return g
}

/** Velvet rope / queue post pair. */
export function makeRopePost({ accent = 0x2f6bff } = {}) {
  const g = new THREE.Group()
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.023, 0.03, 0.95, seg(24, 10)),
    mat.metal(0xc7ccd4, 0.22, 1)
  )
  post.position.y = 0.475
  post.castShadow = true
  g.add(post)

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.038, seg(24, 12), seg(16, 8)), mat.metal(0xdde1e6, 0.18, 1))
  cap.position.y = 0.968
  g.add(cap)

  const baseProfile = []
  baseProfile.push(new THREE.Vector2(0, 0.042))
  baseProfile.push(new THREE.Vector2(0.06, 0.04))
  baseProfile.push(new THREE.Vector2(0.14, 0.018))
  baseProfile.push(new THREE.Vector2(0.16, 0.004))
  baseProfile.push(new THREE.Vector2(0.162, 0))
  baseProfile.push(new THREE.Vector2(0, 0))
  const base = new THREE.Mesh(new THREE.LatheGeometry(baseProfile, seg(36, 16)), mat.dark(0x2a2f3a, 2))
  base.castShadow = true
  g.add(base)

  // The post tapers 0.03 → 0.023, so at y = 0.9 it is 0.0234 across the radius.
  // A torus of radius 0.042 has a 0.035 hole and hung 12 mm clear of the post.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.007, seg(8, 5), seg(20, 10)),
    new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6, metalness: 0.08 })
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.9
  g.add(ring)
  return g
}

/**
 * The soft ellipse of light a spot throws on the floor.
 *
 * Cheaper and more controllable than a real SpotLight, and it gives the deck
 * something to do — an evenly lit floor is a big part of why CG interiors look
 * flat.
 */
let _poolTexture = null
export function makeLightPool({ radius = 1, color = 0xfff0d8, opacity = 0.16 } = {}) {
  if (!_poolTexture) {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,.8)')
    g.addColorStop(0.35, 'rgba(255,255,255,.36)')
    g.addColorStop(0.7, 'rgba(255,255,255,.09)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    _poolTexture = new THREE.CanvasTexture(c)
    _poolTexture.colorSpace = THREE.SRGBColorSpace
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: _poolTexture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = 2
  return mesh
}

/**
 * Shelved product wall: a lit back panel with glass shelves carrying repeated
 * product cards. Gives a stand something to actually display.
 */
/** Shelf stock size, mirrored by `booth-textures.js` so the print is not squashed. */
export const CARD = { w: 0.22, h: 0.3 }

export function makeProductWall({ w = 2.0, h = 2.2, map, accent = 0x2f6bff, shelves = 3, perShelf = 3 } = {}) {
  const g = new THREE.Group()
  g.name = 'product_wall'

  const backer = roundedBox(w, h, 0.06, 0.01, mat.panel(0xfbfbfd, 0.68, 3))
  backer.position.y = h / 2
  g.add(backer)

  // Tinted recess behind the shelves.
  const recess = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.14, h - 0.14),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(accent),
      emissiveIntensity: 0.18,
      roughness: 0.7,
    })
  )
  recess.position.set(0, h / 2, 0.032)
  g.add(recess)

  const shelfCount = count(shelves)
  for (let s = 0; s < shelfCount; s++) {
    const y = h * (0.22 + (s * 0.66) / Math.max(1, shelfCount - 1 || 1))

    const shelf = roundedBox(w - 0.2, 0.022, 0.24, 0.006, mat.glass())
    shelf.position.set(0, y, 0.15)
    g.add(shelf)

    const bracketMat = mat.metal(0xb9bec7, 0.3, 1)
    for (const x of [-(w / 2 - 0.16), w / 2 - 0.16]) {
      const bracket = box(0.02, 0.05, 0.22, bracketMat)
      bracket.position.set(x, y - 0.02, 0.15)
      g.add(bracket)
    }

    const items = count(perShelf)
    for (let i = 0; i < items; i++) {
      const card = new THREE.Mesh(
        new RoundedBoxGeometry(CARD.w, CARD.h, 0.05, 2, 0.008),
        map ? mat.print(map, { emissiveBoost: 0.05 }) : mat.panel(0xffffff, 0.7, 1)
      )
      // Stood ON the shelf: the shelf is 22 mm thick and centred on `y`, so the
      // card's centre is half a card above its top face. This used to sit at
      // y + 0.17, which floated every card 9 mm clear of the glass.
      card.position.set(
        -(w - 0.6) / 2 + ((w - 0.6) / Math.max(1, items - 1 || 1)) * i,
        y + 0.011 + CARD.h / 2,
        0.16
      )
      card.rotation.y = (Math.random() - 0.5) * 0.12
      card.castShadow = true
      g.add(card)
    }
  }

  const trim = box(w + 0.02, 0.03, 0.08, new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6, metalness: 0.05 }))
  trim.position.set(0, h - 0.02, 0.03)
  g.add(trim)

  return g
}

/** Catenary rope between two posts. */
export function makeRope(from, to, { color = 0x9c2b3b, sag = 0.22 } = {}) {
  const mid = from.clone().add(to).multiplyScalar(0.5)
  mid.y -= sag
  const curve = new THREE.CatmullRomCurve3([from, mid, to])
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, seg(28, 12), 0.016, seg(10, 6), false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, ...surface('fabric', 8) })
  )
  mesh.castShadow = true
  return mesh
}

export { UP }
