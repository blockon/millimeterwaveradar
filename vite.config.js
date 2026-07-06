import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import pxtovw from 'postcss-px-to-viewport'
import AutoImport from 'unplugin-auto-import/vite'
import { resolve } from 'path'
import commonjs from 'rollup-plugin-commonjs'
import externalGlobals from 'rollup-plugin-external-globals'
import { createHtmlPlugin } from 'vite-plugin-html'
// 引入@vitejs/plugin-legacy
import legacy from '@vitejs/plugin-legacy'

// 移动端自适应配置
const loder_pxtovw = pxtovw({ viewportWidth: 3840 /* 设计稿宽度*/, viewportUnit: 'vw' })
const outDir = 'www/controllPage/html'
const globals = externalGlobals({
  // vue: 'Vue',
  // vant: 'vant',
  // vueRouter: 'VueRouter',
})
const plugins = [commonjs(), globals]
const autoPlugins = [
  Components({
    dts: true, // 加上这个vscode才有代码提示，其他编辑器未知
    dirs: ['./src/components', './src/pages/**/components'], // 组件目录,page子组件目录
  }),
  AutoImport({
    imports: [
      'vue',
      'vue-router',
      'pinia',
      {
        '@vueuse/router': ['useRouteQuery', 'useRouteParams'],
      },
      {
        '@vueuse/core': ['useDateFormat', 'useVModel', 'useVModels', 'useRefHistory', 'useElementVisibility', 'useNow'],
      },
    ], // 自动引入库相关api
    dirs: ['./src/store', './src/api', './src/utils', './src/useHooks'], // 自动导入文件夹下的所有东西
    dts: 'src/auto-imports.d.ts', // 自动生成的引用文件，加上这个vscode才有代码提示，其他编辑器未知
    vueTemplate: true, // 自动引入的变量等，可在<template>中使用
  }),
]

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const appTarget = process.env.VITE_APP_TARGET || env.VITE_APP_TARGET || 'web'
  const deviceHost = env.VITE_LOCAL_DEVICE_HOST || '192.168.1.1'
  const devicePort = env.VITE_LOCAL_DEVICE_PORT || '8089'
  const localDeviceApiBase =
    env.VITE_LOCAL_DEVICE_API_BASE || `http://${deviceHost}:${devicePort}`
  return defineConfig({
    base: './',
    build: {
      outDir,
      rollupOptions: {
        plugins: [...autoPlugins, ...plugins],
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/name-[hash].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@img': resolve(__dirname, 'src/assets/imgs'),
      },
    },
    plugins: [
      vue(),
      legacy({
        targets: ['chrome 52'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        renderLegacyChunks: true,
        polyfills: [
          'es.symbol',
          'es.array.filter',
          'es.promise',
          'es.promise.finally',
          'es/map',
          'es/set',
          'es.array.for-each',
          'es.object.define-properties',
          'es.object.define-property',
          'es.object.get-own-property-descriptor',
          'es.object.get-own-property-descriptors',
          'es.object.keys',
          'es.object.to-string',
          'web.dom-collections.for-each',
          'esnext.global-this',
          'esnext.string.match-all',
        ],
      }),
      ...autoPlugins,
      createHtmlPlugin({
        minify: env.NODE_ENV == 'pro',
        entry: '/src/main.js',
        inject: {
          data: {
            mode,
            title: '毫米波雷达demo',
            cdn: appTarget !== 'apk'
              ? [
                  'https://apppic.mymlsoft.com/app_static/vconsole.min.js',
                ]
              : [],
            env, // 环境变量
          },
        },
      }),
    ],
    css: {
      postcss: {
        plugins: [loder_pxtovw],
      },
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/style/_variables.scss";',
        },
      },
    },
    server: {
      port: '1573',
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: localDeviceApiBase,
          changeOrigin: true,
        },
        '/radar-api': {
          target: 'https://mmradar.inchitech.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/radar-api/, ''),
        },
        '/radar-ws': {
          target: 'wss://mmradar.inchitech.com',
          changeOrigin: true,
          ws: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/radar-ws/, ''),
        },
      }
    },
  })
}
