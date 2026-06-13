import { validate, type CardRecord } from '../cards/schema'
import { getSchema } from '../cards/registry'

/**
 * 瀏覽器端持久化 —— 版本化 + migration + 驗證。
 *
 * 一致性策略：
 *  - 存的資料蓋 version；讀取時若為舊版自動跑 migration 升級。
 *  - 讀取時對每筆卡片跑 validate()，髒/不合法資料被濾掉、不崩潰。
 *  - save 只由 store 在「有效狀態」時呼叫（見 useCardStore）。
 */
export const STORAGE_KEY = 'momo-card-showroom'
export const SCHEMA_VERSION = 1

export interface Persisted {
  version: number
  cards: CardRecord[]
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

/* ----------------------------- migration ----------------------------- */

/**
 * v0 → v1：早期格式每張卡的 data 用單數 `image: string` 與舊名 `badges`，
 * v1 改為 `images: string[]` 與 `tags`。此函式把舊資料就地升級。
 */
function migrateCardV0toV1(card: Record<string, unknown>): CardRecord {
  const data: Record<string, unknown> = { ...(card.data as Record<string, unknown>) }
  if (typeof data.image === 'string' && data.images === undefined) {
    data.images = [data.image]
    delete data.image
  }
  if (Array.isArray(data.badges) && data.tags === undefined) {
    data.tags = data.badges
    delete data.badges
  }
  return {
    id: String(card.id),
    type: typeof card.type === 'string' ? card.type : 'product',
    data,
  }
}

/** 把任意讀進來的資料正規化成最新版 Persisted（純函式，方便測試）。 */
export function migrate(raw: unknown): Persisted {
  const obj = (raw ?? {}) as Record<string, unknown>
  const version = typeof obj.version === 'number' ? obj.version : 0
  const rawCards: Record<string, unknown>[] = Array.isArray(obj.cards)
    ? (obj.cards as Record<string, unknown>[])
    : Array.isArray(raw)
      ? (raw as Record<string, unknown>[])
      : []

  if (version < 1) {
    return { version: 1, cards: rawCards.map(migrateCardV0toV1) }
  }

  return { version, cards: rawCards as unknown as CardRecord[] }
}

/** 濾掉沒有對應 schema 或驗證不過的卡片（純函式，方便測試）。 */
export function sanitize(cards: CardRecord[]): CardRecord[] {
  return cards.filter((c) => {
    if (!c || typeof c !== 'object') return false
    const schema = getSchema(c.type)
    if (!schema) return false
    return validate(schema, c.data).valid
  })
}

/* ------------------------------- io ---------------------------------- */

/** 讀取並升級 + 驗證；無資料或解析失敗回 null（由 store 改用種子）。 */
export function load(): CardRecord[] | null {
  if (!hasStorage()) return null
  let raw: unknown
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return null
    raw = JSON.parse(text)
  } catch {
    return null
  }
  return sanitize(migrate(raw).cards)
}

/** 寫入（蓋上目前版本號）。 */
export function save(cards: CardRecord[]): void {
  if (!hasStorage()) return
  const payload: Persisted = { version: SCHEMA_VERSION, cards }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function reset(): void {
  if (!hasStorage()) return
  localStorage.removeItem(STORAGE_KEY)
}
