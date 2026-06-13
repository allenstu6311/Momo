import { reactive, watch } from 'vue'
import { validate, type CardRecord, type ValidationResult } from '../cards/schema'
import { getSchema, listCardTypes } from '../cards/registry'
import * as persistence from './persistence'

/**
 * 單一真實來源（single source of truth）。
 *
 * 一致性保證（Q6）：commit 前先 validate()，**只有有效快照才寫入 store /
 * localStorage**。編輯器持有可暫時無效的草稿，無效時不呼叫 commit。
 */

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

/** 由 registry 所有卡型的種子組成初始資料。 */
function seedCards(): CardRecord[] {
  return listCardTypes().flatMap((d) => d.samples.map(clone))
}

function initialCards(): CardRecord[] {
  const loaded = persistence.load()
  return loaded && loaded.length ? loaded : seedCards()
}

const state = reactive<{ cards: CardRecord[] }>({ cards: initialCards() })

// 有效變更 → debounce 寫入持久化。
let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => state.cards,
  () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => persistence.save(state.cards), 150)
  },
  { deep: true },
)

function getById(id: string): CardRecord | undefined {
  return state.cards.find((c) => c.id === id)
}

/**
 * 提交一筆卡片資料：先 validate，**通過才寫入**。回驗證結果讓 UI 顯示錯誤。
 * 無效時 store 不變（草稿留在編輯器）。
 */
function commit(id: string, data: Record<string, unknown>): ValidationResult {
  const rec = getById(id)
  if (!rec) {
    return { valid: false, errors: [{ path: '(id)', expected: 'existing card id', received: id }] }
  }
  const schema = getSchema(rec.type)
  if (!schema) {
    return { valid: false, errors: [{ path: 'type', expected: 'registered card type', received: rec.type }] }
  }
  const result = validate(schema, data)
  if (result.valid) rec.data = clone(data)
  return result
}

function reset(): void {
  persistence.reset()
  state.cards.splice(0, state.cards.length, ...seedCards())
}

export function useCardStore() {
  return {
    cards: state.cards,
    getById,
    commit,
    reset,
  }
}
