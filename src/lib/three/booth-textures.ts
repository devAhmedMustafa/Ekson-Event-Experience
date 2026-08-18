import { brand } from '$lib/brand.svelte'
import {
  getLogoImage,
  getProductImage,
  logoTexture,
  bannerTexture,
  towerTexture,
  productCardTexture,
  productTexture,
  carpetTexture,
  hangingTexture,
  standNumberTexture,
  clearTextureCache
} from './logo-texture'
import { BOOTH } from './booth'
import { CARD } from './props'

let cached: any = null
let cachedFor = ''

export function invalidateBoothTextures() {
  clearTextureCache()
  cached = null
  cachedFor = ''
}

export async function buildBoothTextures({ standNumber = 'B-14', hall = 'HALL 3' } = {}) {
  const signature = `${brand.logo?.slice(-32)}|${brand.name}|${brand.primaryColor}|${brand.darkColor}|${brand.description}`
  if (cached && cachedFor === signature) return cached

  const [logoImg, productImg] = await Promise.all([getLogoImage(), getProductImage()])

  const RING_ASPECT = (2 * Math.PI * BOOTH.ring.radius) / BOOTH.ring.height

  cached = {
    logo: logoTexture(logoImg, { padding: 0.06 }),
    logoPlate: logoTexture(logoImg, { background: '#ffffff', padding: 0.2 }),
    banner: bannerTexture(logoImg),
    tower: towerTexture(logoImg, productImg),
    productCard: productCardTexture(productImg, logoImg),
    productScreen: productCardTexture(productImg, logoImg, {
      size: 768,
      aspect: BOOTH.screen.w / BOOTH.screen.h,
    }),
    productShelf: productCardTexture(productImg, logoImg, { size: 384, aspect: (CARD as any).w / (CARD as any).h }),
    productSheet: productCardTexture(productImg, logoImg, { size: 384, aspect: 210 / 297 }),
    product: productTexture(productImg),
    carpet: carpetTexture(brand.primaryColor, { repeat: 7 }),
    hanging: hangingTexture(logoImg, { aspect: RING_ASPECT }),
    standNumber: standNumberTexture(standNumber, hall),
  }
  cachedFor = signature
  return cached
}
