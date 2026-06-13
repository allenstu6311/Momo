/**
 * 卡片 schema 核心 —— 單一真實來源（single source of truth）。
 *
 * 一份 FieldDescriptor 同時驅動四件事：
 *  (a) 執行期驗證          validate()
 *  (b) 編輯器自動生成表單    （CardEditor 直接讀 fields）
 *  (c) 機器可讀 schema      toJsonSchema()   → 給 agent
 *  (d) TypeScript 資料型別   InferData<S>     → 防止元件 props 與 schema drift
 *
 * 變體（variant）是一等公民：每個欄位用 appliesTo / requiredIn 宣告它在
 * 哪些變體適用、在哪些變體必填，validate / 表單 / JSON Schema 全部共用這份宣告。
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'image'
  | 'boolean'
  | 'enum'
  | 'imageList'
  | 'tags'

/** `'all'` = 所有變體都必填；陣列 = 只在這些變體必填；未指定 = 永不必填。 */
export type RequiredIn = readonly string[] | 'all'

export interface FieldDescriptor {
  readonly key: string
  readonly label: string
  readonly type: FieldType
  readonly help?: string
  readonly default?: unknown
  /** number 欄位的範圍。 */
  readonly min?: number
  readonly max?: number
  /** enum 欄位的可選值。 */
  readonly options?: readonly string[]
  /** 此欄位適用於哪些變體；未指定 = 全部變體。 */
  readonly appliesTo?: readonly string[]
  /** 此欄位在哪些變體必填；未指定 = 永不必填。 */
  readonly requiredIn?: RequiredIn
}

export interface CardSchema {
  readonly type: string
  readonly label: string
  readonly variants: readonly string[]
  readonly fields: readonly FieldDescriptor[]
}

/**
 * 存放在 store / 持久化裡的一筆卡片。`data` 在此層以泛型 record 表示
 * （由對應 type 的 schema 驗證）；元件邊界才收斂成精確型別。
 */
export interface CardRecord {
  readonly id: string
  readonly type: string
  /** 可變：store 在「有效」時把新草稿 commit 進來。 */
  data: Record<string, unknown>
}

/**
 * 以 const 型別參數保留 fields 的字面量型別，讓 InferData 能推導出精確的資料型別，
 * 不必在呼叫端寫 `as const`。
 */
export function defineCardSchema<const S extends CardSchema>(schema: S): S {
  return schema
}

/* ------------------------------------------------------------------ *
 * 型別推導：InferData<S> —— 從 schema 推出卡片資料的 TS 型別
 * ------------------------------------------------------------------ */

type ValueOfField<F extends FieldDescriptor> = F['type'] extends 'number'
  ? number
  : F['type'] extends 'boolean'
    ? boolean
    : F['type'] extends 'imageList' | 'tags'
      ? string[]
      : F['type'] extends 'enum'
        ? F['options'] extends readonly (infer O extends string)[]
          ? O
          : string
        : string // text | image

type AlwaysRequired<F extends FieldDescriptor> = F['requiredIn'] extends 'all'
  ? true
  : false

type Prettify<T> = { [K in keyof T]: T[K] } & {}

/**
 * 由 schema 推導資料型別。`requiredIn: 'all'` 的欄位為必填（non-optional），
 * 其餘為 optional（變體條件必填由執行期 validate() 把關，型別層為寬鬆超集）。
 */
export type InferData<S extends CardSchema> = S extends {
  fields: infer Fs extends readonly FieldDescriptor[]
}
  ? Prettify<
      {
        [F in Fs[number] as AlwaysRequired<F> extends true
          ? F['key']
          : never]: ValueOfField<F>
      } & {
        [F in Fs[number] as AlwaysRequired<F> extends true
          ? never
          : F['key']]?: ValueOfField<F>
      }
    >
  : never

/* ------------------------------------------------------------------ *
 * 驗證：validate(schema, data) —— 回結構化錯誤（給人，也給 agent）
 * ------------------------------------------------------------------ */

export interface ValidationError {
  /** 出錯的欄位路徑（目前為 top-level key）。 */
  readonly path: string
  /** 期望的型別／條件（agent 依此自我修正）。 */
  readonly expected: string
  /** 實際收到的值。 */
  readonly received: unknown
}

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: ValidationError[]
}

function isRequiredInVariant(field: FieldDescriptor, variant: string): boolean {
  if (field.requiredIn === 'all') return true
  if (Array.isArray(field.requiredIn)) return field.requiredIn.includes(variant)
  return false
}

function appliesToVariant(field: FieldDescriptor, variant: string): boolean {
  if (!field.appliesTo) return true
  return field.appliesTo.includes(variant)
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

/** 檢查單一值是否符合欄位型別；回 null = OK，否則回「期望」字串。 */
function checkType(field: FieldDescriptor, value: unknown): string | null {
  switch (field.type) {
    case 'text':
    case 'image':
      return typeof value === 'string' ? null : 'string'
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) return 'number'
      if (field.min !== undefined && value < field.min) return `number >= ${field.min}`
      if (field.max !== undefined && value > field.max) return `number <= ${field.max}`
      return null
    }
    case 'boolean':
      return typeof value === 'boolean' ? null : 'boolean'
    case 'enum': {
      const opts = field.options ?? []
      return typeof value === 'string' && opts.includes(value)
        ? null
        : `one of [${opts.join(', ')}]`
    }
    case 'imageList':
    case 'tags':
      return Array.isArray(value) && value.every((v) => typeof v === 'string')
        ? null
        : 'string[]'
  }
}

/**
 * 依 `data.variant` 套用變體條件規則驗證。能抓到：
 *  - 缺少必填欄位（含變體條件必填，如 ranking 缺 rank）
 *  - 型別 / enum / 範圍錯誤
 *  - 不適用於此變體卻出現的欄位（如 ranking 帶 originalPrice）
 *  - schema 未定義的未知欄位（typo 防呆）
 */
export function validate(schema: CardSchema, data: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ path: '(root)', expected: 'object', received: data }],
    }
  }

  const record = data as Record<string, unknown>
  const variant = record.variant

  // variant 必須先有效，後續規則才有意義。
  if (typeof variant !== 'string' || !schema.variants.includes(variant)) {
    errors.push({
      path: 'variant',
      expected: `one of [${schema.variants.join(', ')}]`,
      received: variant,
    })
    return { valid: false, errors }
  }

  const knownKeys = new Set(schema.fields.map((f) => f.key))

  for (const field of schema.fields) {
    if (field.key === 'variant') continue
    const value = record[field.key]
    const applicable = appliesToVariant(field, variant)

    if (!applicable) {
      if (!isEmpty(value)) {
        errors.push({
          path: field.key,
          expected: `not present for variant "${variant}"`,
          received: value,
        })
      }
      continue
    }

    if (isEmpty(value)) {
      if (isRequiredInVariant(field, variant)) {
        errors.push({
          path: field.key,
          expected: `${field.type} (required in "${variant}")`,
          received: value,
        })
      }
      continue
    }

    const expected = checkType(field, value)
    if (expected) {
      errors.push({ path: field.key, expected, received: value })
    }
  }

  // 未知欄位（schema 沒定義）→ 防 typo、給 agent 明確訊號。
  for (const key of Object.keys(record)) {
    if (!knownKeys.has(key)) {
      errors.push({
        path: key,
        expected: 'no such field in schema',
        received: record[key],
      })
    }
  }

  return { valid: errors.length === 0, errors }
}

