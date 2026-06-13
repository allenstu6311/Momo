import type { CardRecord, CardSchema } from './schema'
import { productSchema } from './product/product.schema'
import { productSeed } from './product/seed'

/**
 * 卡型 registry —— 「插座」：卡型擴充點。
 *
 * 一個卡型 = schema（驅動驗證 + 表單生成）+ 種子範例。
 * 新增卡型 = 註冊一個 definition，validate / getSchema / 表單生成全部泛用、零改動。
 */
export interface CardTypeDefinition {
  readonly schema: CardSchema
  /** 該卡型的種子／範例資料。 */
  readonly samples: CardRecord[]
}

const registry = new Map<string, CardTypeDefinition>()

export function registerCardType(def: CardTypeDefinition): void {
  registry.set(def.schema.type, def)
}

export function getCardType(type: string): CardTypeDefinition | undefined {
  return registry.get(type)
}

export function listCardTypes(): CardTypeDefinition[] {
  return [...registry.values()]
}

export function getSchema(type: string): CardSchema | undefined {
  return registry.get(type)?.schema
}

// 預設註冊：momo 商品卡。
registerCardType({
  schema: productSchema,
  samples: productSeed,
})
