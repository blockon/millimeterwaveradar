<!--
 * @Author: chuan.wang chuan.wang@changhong.com
 * @Date: 2022-12-20 10:42:19
 * @LastEditors: chuan.wang chuan.wang@changhong.com
 * @LastEditTime: 2024-01-23 13:58:57
 * @FilePath: \MeilingSmartHome-NewOperationd:\虹美公司\project\2023\MillimeterWaveRadar\src\App.vue
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
-->
<template>
  <div class="app-shell">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <div
      v-show="showWinActions"
      class="electron-win-drag"
      @dblclick="onMaximize"
    />
    <div
      v-show="showWinActions"
      class="electron-win-actions"
    >
      <button
        type="button"
        class="electron-win-actions__btn"
        aria-label="最小化"
        @click="onMinimize"
      >
        −
      </button>
      <button
        type="button"
        class="electron-win-actions__btn"
        aria-label="最大化"
        @click="onMaximize"
      >
        {{ isMaximized ? '❐' : '□' }}
      </button>
      <button
        type="button"
        class="electron-win-actions__btn electron-win-actions__btn--close"
        aria-label="关闭"
        @click="onClose"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const hasElectron = ref(false)
const isMaximized = ref(false)
const isFullScreen = ref(false)

let offWindowState = null

const showWinActions = computed(
  () => hasElectron.value && !isFullScreen.value
)

async function syncState() {
  const api = window.electronAPI
  if (!api?.getWindowState) return
  const s = await api.getWindowState()
  if (s) {
    isMaximized.value = !!s.isMaximized
    isFullScreen.value = !!s.isFullScreen
  }
}

function onMinimize() {
  window.electronAPI?.minimizeWindow?.()
}

function onMaximize() {
  window.electronAPI?.maximizeToggle?.()
}

function onClose() {
  window.electronAPI?.closeWindow?.()
}

onMounted(() => {
  if (!window.electronAPI) return
  hasElectron.value = true
  syncState()
  if (window.electronAPI.onWindowState) {
    offWindowState = window.electronAPI.onWindowState((payload) => {
      if (!payload) return
      if (typeof payload.isMaximized === 'boolean') isMaximized.value = payload.isMaximized
      if (typeof payload.isFullScreen === 'boolean') isFullScreen.value = payload.isFullScreen
    })
  }
})

onUnmounted(() => {
  if (typeof offWindowState === 'function') offWindowState()
})
</script>

<style>
.go-enter-active,
.go-leave-active,
.back-enter-active,
.back-leave-active {
  transition: transform 0.4s ease;
  position: absolute;
}

.go-enter-from,
.back-leave-to {
  transform: translateX(100vw);
}

.go-leave-to,
.back-enter-from {
  transform: translateX(-100vw);
}
</style>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100%;
}

.electron-win-drag {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  z-index: 2147482990;
  -webkit-app-region: drag;
}

.electron-win-actions {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 2147483000;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  pointer-events: auto;
}

.electron-win-actions__btn {
  width: 100px;
  height: 100px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.92);
  font-size: 40px;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.electron-win-actions__btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.electron-win-actions__btn--close:hover {
  background: #e81123;
  color: #fff;
}

.electron-win-actions__btn + .electron-win-actions__btn {
  margin-left: 4px;
}
</style>
