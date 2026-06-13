import type { CardRecord } from '../schema'
import type { ProductCardData } from './product.schema'

/**
 * 真實種子資料 —— 取自 samples/momo-scraped-cards.json
 * （momo PLAYBOY 分類頁，E2E 爬取，scrapedAt 2026-06-13）。
 *
 * 用「原始列」+ map 的寫法，讓資料來源一目了然、轉換邏輯只寫一次。
 */
interface RawCard {
  iCode: string
  variant: 'ranking' | 'standard'
  rank?: string
  title: string
  brand: string
  promoText: string
  image: string
  price: number
  originalPrice?: number
  rating?: number
  reviewCount?: number
  salesText?: string
  tags: string[]
}

const RAW: RawCard[] = [
  // --- ranking（排行榜卡：單圖、有 TOP 橫幅、無原價）---
  { iCode: '13098575', variant: 'ranking', rank: 'TOP1', title: '【PLAYBOY】momo獨家★手提包(多款任選)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i3.momoshop.com.tw/1781147061/goodsimg/0013/098/575/13098575_OL_m.webp', price: 968, rating: 4.7, reviewCount: 17, salesText: '總銷量>100', tags: ['折價券', '登記'] },
  { iCode: '11544783', variant: 'ranking', rank: 'TOP2', title: '【PLAYBOY】手提包精選款(多款任選)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i3.momoshop.com.tw/1781162314/goodsimg/0011/544/783/11544783_OL_m.webp', price: 1268, rating: 4.8, reviewCount: 420, salesText: '總銷量>3,000', tags: ['折價券', '登記'] },
  { iCode: '12555045', variant: 'ranking', rank: 'TOP3', title: '【PLAYBOY】精選人氣斜背包款(多款任選)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i2.momoshop.com.tw/1781162239/goodsimg/0012/555/045/12555045_OL_m.webp', price: 1268, rating: 4.8, reviewCount: 213, salesText: '總銷量>1,000', tags: ['折價券', '登記'] },
  // --- standard（標準卡：售價 + 原價刪除線、操作層）---
  { iCode: '13035080', variant: 'standard', title: '【PLAYBOY】後背包 Chill系列(黑色)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i2.momoshop.com.tw/1720760460/goodsimg/0013/035/080/13035080_OR_m.webp', price: 3130, originalPrice: 3580, rating: 4.8, reviewCount: 63, salesText: '總銷量>100', tags: ['折價券', '登記'] },
  { iCode: '11361880', variant: 'standard', title: '【PLAYBOY】人氣精選斜背包/側背包(多款任選)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i3.momoshop.com.tw/1780648040/goodsimg/0011/361/880/11361880_OR_m.webp', price: 1468, originalPrice: 3280, rating: 4.7, reviewCount: 211, salesText: '總銷量>1,000', tags: ['折價券', '登記'] },
  { iCode: '12556525', variant: 'standard', title: '【PLAYBOY】優質人氣小物款(多款任選)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i3.momoshop.com.tw/1781146953/goodsimg/0012/556/525/12556525_OR_m.webp', price: 968, originalPrice: 2380, rating: 4.7, reviewCount: 29, salesText: '總銷量>100', tags: ['折價券', '登記'] },
  { iCode: '13101016', variant: 'standard', title: '【PLAYBOY】momo獨家★斜背包(多款任選)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i4.momoshop.com.tw/1781155883/goodsimg/0013/101/016/13101016_OR_m.webp', price: 1168, originalPrice: 2680, rating: 4.8, reviewCount: 93, salesText: '總銷量>500', tags: ['折價券', '登記'] },
  { iCode: '13883154', variant: 'standard', title: '【PLAYBOY】斜背包 My Way系列(藍色)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i2.momoshop.com.tw/1744181904/goodsimg/0013/883/154/13883154_OR_m.webp', price: 1900, originalPrice: 2200, rating: 5, reviewCount: 5, tags: ['折價券', '登記'] },
  { iCode: '12564460', variant: 'standard', title: '【PLAYBOY】春夏出遊百搭包款(多款任選)', brand: 'PLAYBOY', promoText: '滿1000折150', image: 'https://i2.momoshop.com.tw/1781174281/goodsimg/0012/564/460/12564460_OR_m.webp', price: 1918, originalPrice: 3780, rating: 4.7, reviewCount: 43, salesText: '總銷量>100', tags: ['折價券', '登記'] },
]

function toData(raw: RawCard): ProductCardData {
  const data: ProductCardData = {
    variant: raw.variant,
    brand: raw.brand,
    title: raw.title,
    promoText: raw.promoText,
    images: [raw.image],
    price: raw.price,
    tags: raw.tags,
  }
  if (raw.rank !== undefined) data.rank = raw.rank
  if (raw.originalPrice !== undefined) data.originalPrice = raw.originalPrice
  if (raw.rating !== undefined) data.rating = raw.rating
  if (raw.reviewCount !== undefined) data.reviewCount = raw.reviewCount
  if (raw.salesText !== undefined) data.salesText = raw.salesText
  if (raw.variant === 'standard') data.actions = ['cart', 'wishlist']
  return data
}

/** Showroom 初始種子（store 第一次啟動時載入）。 */
export const productSeed: CardRecord[] = RAW.map((raw) => ({
  id: `product-${raw.variant}-${raw.iCode}`,
  type: 'product',
  data: toData(raw),
}))
