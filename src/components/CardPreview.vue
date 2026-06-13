<script setup lang="ts">
/**
 * 即時預覽 —— 透過註冊好的 <momo-product-card> custom element 渲染，
 * 與 sample.html 同一個渲染來源。draft 可能暫時無效，此時 WC 會自行顯示錯誤狀態。
 */
defineProps<{ data: Record<string, unknown> }>()
</script>

<template>
  <div class="preview">
    <momo-product-card :data="data" />
  </div>
</template>

<style scoped>
.preview {
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
}
</style>
