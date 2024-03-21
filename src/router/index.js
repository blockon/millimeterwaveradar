import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 跳转的页面也要用二级导航，会根据/个数判断前进还是后退
 * meta.keepAlive: 不设置默认true，关闭可配置 meta.keepAlive 为 false；
 *            设置时需要把route的name设置为组件名称（vue3默认name是文件名），因为exclude直接取得name作为组件名
 */

export const routes = [
  {
    path: '/',
    redirect: 'AppHome',
  },
  {
    path: '/AppHome', // app 首页
    name: 'AppHome',
    component: () => import('../page/home/index.vue'),
  },
  {
    path: '/seting',
    name: 'Test',
    component: () => import('../page/setting/index.vue'),
  },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
