<script setup lang="ts">
import { computed } from 'vue'
import type { CardSchema, FieldDescriptor, ValidationResult } from '../cards/schema'

/**
 * Schema 驅動的調整面板。**完全由 schema.fields 生成欄位**，不為任何卡型寫死表單。
 * 直接讀 / 改傳入的 reactive `draft`（由 Showroom 持有並負責驗證 + commit）。
 */
const props = defineProps<{
  schema: CardSchema
  draft: Record<string, unknown>
  validation: ValidationResult
}>()

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

const currentVariant = computed(() => String(props.draft.variant ?? ''))

function isApplicable(field: FieldDescriptor): boolean {
  return !field.appliesTo || field.appliesTo.includes(currentVariant.value)
}

const visibleFields = computed(() =>
  props.schema.fields.filter((f) => f.key === 'variant' || isApplicable(f)),
)

function errorsFor(key: string) {
  return props.validation.errors.filter((e) => e.path === key)
}

/* --- 各型別的 setter（空值 → 刪鍵，讓 optional 欄位不殘留空字串） --- */
function setText(key: string, value: string) {
  if (value === '') delete props.draft[key]
  else props.draft[key] = value
}
function setNumber(key: string, raw: string) {
  if (raw === '') {
    delete props.draft[key]
    return
  }
  const n = Number(raw)
  // 非數字也寫入（保留為字串）→ 讓 validate() 抓到並顯示錯誤（示範驗證）。
  props.draft[key] = Number.isNaN(n) ? raw : n
}
function setBool(key: string, value: boolean) {
  props.draft[key] = value
}
function setList(key: string, raw: string, sep: RegExp) {
  const arr = raw.split(sep).map((s) => s.trim()).filter(Boolean)
  if (arr.length === 0) delete props.draft[key]
  else props.draft[key] = arr
}
function listValue(key: string): string {
  const v = props.draft[key]
  return Array.isArray(v) ? v.join('\n') : ''
}
function tagsValue(key: string): string {
  const v = props.draft[key]
  return Array.isArray(v) ? v.join(', ') : ''
}

/** 切換變體：剪掉不適用欄位、補上新變體必填欄位的預設值。 */
function changeVariant(v: string) {
  props.draft.variant = v
  for (const f of props.schema.fields) {
    if (f.key === 'variant') continue
    const applicable = !f.appliesTo || f.appliesTo.includes(v)
    if (!applicable) {
      delete props.draft[f.key]
      continue
    }
    const required = f.requiredIn === 'all' || (Array.isArray(f.requiredIn) && f.requiredIn.includes(v))
    if (required && props.draft[f.key] === undefined && f.default !== undefined) {
      props.draft[f.key] = clone(f.default)
    }
  }
}
</script>

<template>
  <form class="editor" @submit.prevent>
    <p class="status" :class="validation.valid ? 'ok' : 'bad'">
      {{ validation.valid ? '✓ 有效（已自動儲存）' : `✗ ${validation.errors.length} 個錯誤（未儲存）` }}
    </p>

    <div v-for="field in visibleFields" :key="field.key" class="field">
      <label :for="`f-${field.key}`">
        {{ field.label }}
        <span v-if="field.requiredIn === 'all' || (Array.isArray(field.requiredIn) && field.requiredIn.includes(currentVariant))" class="req">*</span>
        <small v-if="field.help">{{ field.help }}</small>
      </label>

      <!-- enum（含 variant） -->
      <select
        v-if="field.type === 'enum'"
        :id="`f-${field.key}`"
        :value="draft[field.key]"
        @change="field.key === 'variant' ? changeVariant(($event.target as HTMLSelectElement).value) : setText(field.key, ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="o in field.options" :key="o" :value="o">{{ o }}</option>
      </select>

      <!-- boolean -->
      <input
        v-else-if="field.type === 'boolean'"
        :id="`f-${field.key}`"
        type="checkbox"
        :checked="Boolean(draft[field.key])"
        @change="setBool(field.key, ($event.target as HTMLInputElement).checked)"
      />

      <!-- number（用 text 以便示範非法輸入被驗證攔下） -->
      <input
        v-else-if="field.type === 'number'"
        :id="`f-${field.key}`"
        type="text"
        inputmode="decimal"
        :value="draft[field.key] ?? ''"
        @input="setNumber(field.key, ($event.target as HTMLInputElement).value)"
      />

      <!-- imageList：一行一個 URL -->
      <textarea
        v-else-if="field.type === 'imageList'"
        :id="`f-${field.key}`"
        rows="2"
        :value="listValue(field.key)"
        @input="setList(field.key, ($event.target as HTMLTextAreaElement).value, /\n/)"
      />

      <!-- tags：逗號分隔 -->
      <input
        v-else-if="field.type === 'tags'"
        :id="`f-${field.key}`"
        type="text"
        :value="tagsValue(field.key)"
        @input="setList(field.key, ($event.target as HTMLInputElement).value, /[,\n]/)"
      />

      <!-- text / image -->
      <input
        v-else
        :id="`f-${field.key}`"
        type="text"
        :value="draft[field.key] ?? ''"
        @input="setText(field.key, ($event.target as HTMLInputElement).value)"
      />

      <p v-for="(e, i) in errorsFor(field.key)" :key="i" class="err">
        期望 {{ e.expected }}
      </p>
    </div>
  </form>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.status {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
}
.status.ok {
  color: #0a7d33;
  background: #eafbe7;
}
.status.bad {
  color: #a40000;
  background: #fff0f0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}
.field label small {
  display: block;
  font-weight: 400;
  color: #999;
  font-size: 11px;
}
.req {
  color: #dd2222;
}
.field input[type='text'],
.field select,
.field textarea {
  font: inherit;
  font-size: 14px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}
.err {
  margin: 0;
  font-size: 12px;
  color: #dd2222;
}
</style>
