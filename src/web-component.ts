import { defineCustomElement } from 'vue'
import ProductCard from './cards/product/ProductCard.ce.vue'

/**
 * Web Component 進入點。把 Vue SFC 轉成真正的 custom element。
 * Showroom（app build）與 sample.html（wc build）共用同一個元件 → 單一渲染來源。
 */
export const MomoProductCard = defineCustomElement(ProductCard)

if (!customElements.get('momo-product-card')) {
  customElements.define('momo-product-card', MomoProductCard)
}
