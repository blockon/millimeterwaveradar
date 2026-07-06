import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import '../classtocss_global.css'
import './style/index.scss'
import vant from 'vant';
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { debugLog } from '@/utils/debugLog'

// 测试包始终启用 vConsole
if (typeof VConsole !== 'undefined') {
  new VConsole()
  debugLog('[vConsole] 已启动')
}

const app = createApp(App)

const pinia = createPinia() // pinia相关,集中状态管理插件（vuex升级版）
pinia.use(piniaPluginPersistedstate) // 持久化pinia状态
app.use(pinia)

app.use(router) // 使用路由

app.use(vant) // 使用vant UI组件

app.mount('#app') // 挂在目录
