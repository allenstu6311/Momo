import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // 讓編譯器把 <momo-*> 當成 custom element，不要當 Vue 元件解析。
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('momo-'),
        },
      },
    }),
  ],
})
