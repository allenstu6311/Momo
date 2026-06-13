import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

/**
 * 第二個建置：把卡片 Web Component 打包成單檔 IIFE（vue 內聯），
 * 輸出到 samples/momo-cards.js，讓 sample.html 用 <script> 離線載入。
 *   pnpm build:wc
 */
export default defineConfig({
  plugins: [vue()],
  define: {
    // 關閉 Vue 開發期警告，讓 IIFE 走 production 路徑。
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'samples',
    emptyOutDir: false, // 別清掉 sample.html / scraped json
    lib: {
      entry: fileURLToPath(new URL('./src/web-component.ts', import.meta.url)),
      formats: ['iife'],
      name: 'MomoCards',
      fileName: () => 'momo-cards.js',
    },
  },
})
