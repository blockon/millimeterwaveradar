<template>
  <appPage title="设置">
    <CommonSeting :hardwareVersion="hardwareVersion" :deviceInfo="deviceStore.deviceInfo"/>
  </appPage>
</template>

<script setup>
const hardwareVersion = computed(() => deviceStore.deviceState?.hardwareVersion ? "V" + deviceStore.deviceState?.hardwareVersion : "")
</script>

<style lang="scss">

</style>
