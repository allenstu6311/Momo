<script setup lang="ts">
import type { CardRecord } from '../cards/schema'
import CardPreview from './CardPreview.vue'

/** 列出所有卡片（型錄）。點選 → 進入單卡細節調整。 */
defineProps<{ cards: CardRecord[]; selectedId: string }>()
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="gallery">
    <button
      v-for="c in cards"
      :key="c.id"
      type="button"
      class="cell"
      :class="{ active: c.id === selectedId }"
      @click="$emit('select', c.id)"
    >
      <!-- <span class="badge">{{ c.type }} · {{ c.data.variant }}</span> -->
      <CardPreview :data="c.data" />
    </button>
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.cell {
  border: 2px solid transparent;
  border-radius: 10px;
  background: none;
  padding: 4px;
  cursor: pointer;
  position: relative;
}
.cell.active {
  border-color: #e4007f;
}
.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
.cell :deep(.preview) {
  padding: 8px;
  background: transparent;
}
</style>
