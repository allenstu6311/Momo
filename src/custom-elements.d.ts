import type { DefineComponent } from 'vue'

/**
 * 讓 vue-tsc 認得 <momo-product-card> 這個 custom element 與它的 data prop，
 * 在 template 內做型別檢查時不會報「未知元件」。
 */
declare module 'vue' {
  export interface GlobalComponents {
    'momo-product-card': DefineComponent<{
      data?: Record<string, unknown> | string
    }>
  }
}

export {}
