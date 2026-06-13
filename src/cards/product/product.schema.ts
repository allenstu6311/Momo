import { defineCardSchema, type InferData } from '../schema'

/** 真實抓到的兩個變體（見 samples/momo-scraped-cards.json）。 */
export const VARIANTS = ['ranking', 'standard'] as const
export type Variant = (typeof VARIANTS)[number]

/**
 * momo 商品卡 schema。欄位與適用變體均依真實爬取結果定義：
 *  - ranking（排行榜卡）：有 rank、單圖、無原價、無操作層
 *  - standard（標準卡）：有原價刪除線、多圖輪播、hover 操作層、無 rank
 */
export const productSchema = defineCardSchema({
  type: 'product',
  label: 'momo 商品卡',
  variants: VARIANTS,
  fields: [
    {
      key: 'variant',
      label: '卡片版型',
      type: 'enum',
      options: VARIANTS,
      requiredIn: 'all',
      help: 'ranking = 排行榜卡；standard = 標準卡',
    },
    {
      key: 'rank',
      label: '排名橫幅',
      type: 'text',
      appliesTo: ['ranking'],
      requiredIn: ['ranking'],
      default: 'TOP1',
      help: '僅排行榜卡，如 TOP1 / TOP2',
    },
    {
      key: 'brand',
      label: '品牌',
      type: 'text',
      default: '',
    },
    {
      key: 'title',
      label: '標題',
      type: 'text',
      requiredIn: 'all',
      default: '商品標題',
    },
    {
      key: 'promoText',
      label: '促銷文案',
      type: 'text',
      default: '',
      help: '紅色促銷行，如 滿1000折150',
    },
    {
      key: 'images',
      label: '商品圖（可多張＝輪播）',
      type: 'imageList',
      requiredIn: 'all',
      default: [],
    },
    {
      key: 'price',
      label: '售價',
      type: 'number',
      min: 0,
      requiredIn: 'all',
      default: 0,
    },
    {
      key: 'originalPrice',
      label: '原價（刪除線）',
      type: 'number',
      min: 0,
      appliesTo: ['standard'],
      help: '僅標準卡有；排行榜卡無原價',
    },
    {
      key: 'rating',
      label: '評分',
      type: 'number',
      min: 0,
      max: 5,
    },
    {
      key: 'reviewCount',
      label: '評論數',
      type: 'number',
      min: 0,
    },
    {
      key: 'salesText',
      label: '銷量文字',
      type: 'text',
      default: '',
      help: '如 總銷量>1,000',
    },
    {
      key: 'tags',
      label: '標籤',
      type: 'tags',
      default: [],
      help: '如 折價券、登記',
    },
    {
      key: 'actions',
      label: '操作按鈕',
      type: 'tags',
      appliesTo: ['standard'],
      default: [],
      help: '標準卡 hover 操作層，如 cart、wishlist',
    },
  ],
})

/** 由 schema 推導的卡片資料型別（單一來源；元件 props 用它，防 drift）。 */
export type ProductCardData = InferData<typeof productSchema>
