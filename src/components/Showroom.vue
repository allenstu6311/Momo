<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { validate, type ValidationResult } from '../cards/schema'
import { getSchema } from '../cards/registry'
import { useCardStore } from '../store/useCardStore'
import CardGallery from './CardGallery.vue'
import CardPreview from './CardPreview.vue'
import CardEditor from './CardEditor.vue'

const store = useCardStore()
const selectedId = ref(store.cards[0]?.id ?? '')

const selected = computed(() => store.getById(selectedId.value))
const schema = computed(() => (selected.value ? getSchema(selected.value.type) : undefined))

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

// 編輯草稿（可暫時無效）。預覽綁草稿；只有有效時才 commit 進 store。
const draft = ref<Record<string, unknown>>({})
function resetDraft() {
  draft.value = selected.value ? clone(selected.value.data) : {}
}
watch(selectedId, resetDraft, { immediate: true })

const validation = computed<ValidationResult>(() =>
  schema.value ? validate(schema.value, draft.value) : { valid: true, errors: [] },
)

// 傳給 custom element 的資料：每次變更都產生新物件 identity，
// 這樣 Vue 才會重新設定 <momo-product-card> 的 data property（就地 mutate 不會觸發）。
const previewData = computed(() => clone(draft.value))

watch(
  draft,
  () => {
    if (validation.value.valid && selected.value) {
      store.commit(selected.value.id, draft.value)
    }
  },
  { deep: true },
)

function doReset() {
  store.reset()
  selectedId.value = store.cards[0]?.id ?? ''
  resetDraft()
}
</script>

<template>
  <div class="showroom">
    <header>
      <h1>momo Card Showroom</h1>
      <div class="toolbar">
        <button type="button" @click="doReset">重置</button>
      </div>
    </header>

    <section class="block">
      <h2>所有商品卡（{{ store.cards.length }}）</h2>
      <CardGallery :cards="store.cards" :selected-id="selectedId" @select="selectedId = $event" />
    </section>

    <section v-if="selected && schema" class="block detail">
      <div class="detail-grid">
        <div>
          <h2>預覽</h2>
          <CardPreview :data="previewData" />
        </div>
        <div>
          <h2>細節調整</h2>
          <CardEditor :schema="schema" :draft="draft" :validation="validation" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.showroom {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 80px;
  text-align: left;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}
h1 {
  font-size: 24px;
  margin: 0;
}
h2 {
  font-size: 15px;
  color: #666;
  margin: 0 0 12px;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.toolbar button {
  font: inherit;
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.block {
  margin-bottom: 32px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}
@media (max-width: 720px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
.schema-out {
  margin-top: 24px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 8px 12px;
}
.schema-out summary {
  cursor: pointer;
  font-size: 13px;
  color: #666;
}
.schema-out pre {
  font-size: 12px;
  overflow: auto;
  max-height: 320px;
  background: #fafafa;
  padding: 12px;
  border-radius: 4px;
}
</style>
