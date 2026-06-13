import { createApp } from 'vue'
import './style.css'
import './web-component' // 註冊 <momo-product-card> custom element（Showroom 預覽與 sample 同源）
import App from './App.vue'

createApp(App).mount('#app')
