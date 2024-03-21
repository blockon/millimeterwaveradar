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
  <router-view v-slot="{ Component }">
    <keep-alive>
        <component :is="Component" />
      </keep-alive>
  </router-view>
</template>

<script setup>
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
