<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { validate } from '../schema'
import { productSchema, type ProductCardData } from './product.schema'

/**
 * 純展示元件。可當 Web Component（<momo-product-card data='...'>）或
 * 在 Showroom 內透過註冊的 custom element 使用。
 *
 * 輸入可為物件（property 綁定）或 JSON 字串（靜態 HTML 的 data attribute）。
 * 一律跑同一個 validate()；不通過 → 顯示錯誤狀態 + console.error 結構化錯誤。
 */
const props = defineProps<{ data?: Record<string, unknown> | string }>()

const parsed = computed(() => {
  const raw = props.data
  if (raw == null) return { ok: false as const, error: 'no data provided' }
  if (typeof raw === 'string') {
    try {
      return { ok: true as const, value: JSON.parse(raw) as Record<string, unknown> }
    } catch (e) {
      return { ok: false as const, error: `invalid JSON: ${(e as Error).message}` }
    }
  }
  return { ok: true as const, value: raw }
})

const validation = computed(() => {
  if (!parsed.value.ok) {
    return {
      valid: false,
      errors: [{ path: '(data)', expected: 'valid JSON object', received: props.data }],
    }
  }
  return validate(productSchema, parsed.value.value)
})

const card = computed<ProductCardData | null>(() =>
  parsed.value.ok && validation.value.valid
    ? (parsed.value.value as ProductCardData)
    : null,
)

watchEffect(() => {
  if (!validation.value.valid) {
    // 瀏覽器端的 agent 監督：壞資料被擋下並回報結構化錯誤。
    console.error('[momo-product-card] invalid data', validation.value.errors)
  }
})

const stars = computed(() => {
  const r = card.value?.rating ?? 0
  return [1, 2, 3, 4, 5].map((i) => i <= Math.round(r))
})
const hasAction = (name: string) => card.value?.actions?.includes(name) ?? false
</script>

<template>
  <!-- 驗證失敗：明顯的錯誤狀態（同時 console.error 結構化錯誤） -->
  <div v-if="!card" class="card card--error" role="alert">
    <strong>⚠ 卡片資料無效</strong>
    <ul>
      <li v-for="(e, i) in validation.errors" :key="i">
        <code>{{ e.path }}</code> — 期望 {{ e.expected }}
      </li>
    </ul>
  </div>

  <article v-else class="card" :class="`card--${card.variant}`">
    <div v-if="card.variant === 'ranking' && card.rank" class="rank">{{ card.rank }}</div>

    <div class="body">
      <div class="imgwrap">
        <img class="img" :src="card.images[0]" :alt="card.title" loading="lazy" />
        <div v-if="card.images.length > 1" class="dots">
          <span v-for="(_, i) in card.images" :key="i" :class="{ on: i === 0 }" />
        </div>
      </div>

      <p v-if="card.promoText" class="promo">{{ card.promoText }}</p>

      <h3 class="title">{{ card.title }}</h3>

      <div class="prices">
        <span class="price"><i>$</i>{{ card.price.toLocaleString() }}</span>
        <s v-if="card.originalPrice" class="orig">${{ card.originalPrice.toLocaleString() }}</s>
      </div>

      <div v-if="card.rating != null" class="rating">
        <span class="stars">
          <span v-for="(on, i) in stars" :key="i" :class="{ on }">★</span>
        </span>
        <span v-if="card.reviewCount != null" class="count">({{ card.reviewCount }})</span>
      </div>

      <p v-if="card.salesText" class="sales">{{ card.salesText }}</p>

      <div v-if="card.tags && card.tags.length" class="tags">
        <span v-for="t in card.tags" :key="t" class="tag">{{ t }}</span>
      </div>
      
      <div v-if="card.variant === 'standard' && (hasAction('cart') || hasAction('wishlist'))" class="actions">
        <button v-if="hasAction('cart')" type="button" aria-label="加入購物車">🛒</button>
        <button v-if="hasAction('wishlist')" type="button" aria-label="收藏">♡</button>
      </div>
    </div>
  </article>
</template>

<style>
:host {
  display: inline-block;
  --pink: #e4007f;
  --tag: #ff4c76;
}
* {
  box-sizing: border-box;
}
.card {
  width: 230px;
  font-family: system-ui, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 4px;
  overflow: hidden;
  color: #333;
}
.card--ranking {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.rank {
  background: #f3f3f3;
  padding: 8px 10px;
  font-size: 18px;
  font-weight: 700;
  color: #111;
}
.body {
  padding: 10px;
}
.imgwrap {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f5f5f5;
  border-radius: 2px;
  overflow: hidden;
}
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dots {
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  display: flex;
  gap: 4px;
  justify-content: center;
}
.dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
}
.dots span.on {
  background: var(--pink);
}
.promo {
  margin: 8px 0 4px;
  font-size: 13px;
  color: #dd2222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.title {
  margin: 4px 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.35;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 35px;
}
.prices {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 6px 0 4px;
}
.price {
  color: var(--pink);
  font-weight: 700;
  font-size: 19px;
}
.price i {
  font-size: 13px;
  font-style: normal;
  font-weight: 500;
}
.orig {
  color: #999;
  font-size: 13px;
}
.rating {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 18px;
}
.stars {
  letter-spacing: 1px;
  font-size: 13px;
  color: #ddd;
}
.stars .on {
  color: #ffc800;
}
.count {
  font-size: 11px;
  color: #b3b3b3;
}
.sales {
  margin: 4px 0;
  font-size: 12px;
  color: #888;
}
.tags {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.tag {
  background: var(--tag);
  color: #fff;
  font-size: 11px;
  line-height: 14px;
  padding: 1px 4px;
  border-radius: 2px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
.actions button {
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.actions button:hover {
  border-color: var(--pink);
}
.card--error {
  border-color: #dd2222;
  background: #fff5f5;
  padding: 12px;
  color: #a40000;
  font-size: 12px;
}
.card--error ul {
  margin: 6px 0 0;
  padding-left: 18px;
}
.card--error code {
  font-family: ui-monospace, Consolas, monospace;
}
</style>
