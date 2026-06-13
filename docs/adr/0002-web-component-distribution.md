# 0002 — 用 Vue defineCustomElement + `.ce.vue` 發佈卡片 Web Component

卡片元件只寫一次（[src/cards/product/ProductCard.ce.vue](../../src/cards/product/ProductCard.ce.vue)），透過 `defineCustomElement` 註冊成 `<momo-product-card>`（[src/web-component.ts](../../src/web-component.ts)），再用第二份 Vite 設定打包成單檔 IIFE（[vite.wc.config.ts](../../vite.wc.config.ts)）供 `samples/sample.html` 以 `<script>` 載入。Showroom 預覽也走**同一個** custom element → 單一渲染來源。

## 為什麼這樣，而非 Lit / vanilla / 獨立 renderer

需求要求「sample 用 web component / script 載入」，而 repo 本身是 Vue。用 Vue `defineCustomElement` 可以**單一作者模型**同時供 Vue app 與框架無關的 HTML 使用，不必引入第二套元件框架（Lit）或維護第二條渲染路徑。

## 為什麼檔名是 `.ce.vue`（技術強制，非命名喜好）

`@vitejs/plugin-vue` 對 `*.ce.vue` 會把 `<style>` 編譯成**字串注入 shadow DOM**；普通 `.vue` 則注入全域 `<head>`。後者在 web component 的 shadow DOM 內拿不到樣式 → 卡片裸奔。也因此 Showroom 內**不**把它當普通元件 import，而是統一走註冊後的 custom element，避免「同檔在兩情境樣式行為不同」。

## 取捨

- IIFE 內聯 vue（~73 kB gzip 28 kB），換取 sample.html 單檔離線可開。
- dev 編譯需設定 `isCustomElement: tag => tag.startsWith('momo-')`（見 vite.config.ts）。
