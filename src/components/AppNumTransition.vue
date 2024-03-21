<template>
  <div class="inline-block">
    <span>{{ output.toFixed(decimalLen) }}</span>
  </div>
</template>
<script setup>
import { TransitionPresets, useTransition } from '@vueuse/core'

const props = defineProps({ value: Number })
const source = ref(0)
const decimalLen = computed(() => String(props.value).split('.')[1]?.length)

setTimeout(() => {
  source.value = props.value
})
const output = useTransition(source, {
  duration: 1000,
  transition: TransitionPresets.linear,
})
</script>