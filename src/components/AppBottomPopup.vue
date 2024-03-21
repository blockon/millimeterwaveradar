<!-- 自定义 下弹出 popup，自动挂载body, 对van-popup的简单封装，原生返回时自动关闭 -->
<!-- 暴露v-model:show 双向绑定 -->
<!-- 暴露title -->
<!-- 暴露closeOnConfirm 默认true @confirm 是自动关闭弹窗 -->
<!-- 暴露confirmText -->
<!-- 暴露@confirm方法 -->
<!-- 暴露@close方法 -->
<!-- 暴露hideConfirm 表示是否展示确认按钮 -->
<template>
  <van-popup @close="close" v-model:show="showLocal" position="bottom" closeable round lock-scroll teleport="body" safe-area-inset-bottom>
    <div class="flex flex-col mid-center p-24_16_0">
      <div class="fs-18 color-333333">{{ title }}</div>

      <div class="w-full mt-20" :class="{ 'pb-30 ': !hideConfirm }">
        <slot>slot内容</slot>
      </div>

      <div class="mb-36">
        <VanButton v-if="!hideConfirm" @click="confirm" class="w-311" round type="primary">{{ confirmText }}</VanButton>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '请传入title属性',
  },
  confirmText: {
    type: String,
    default: '确认',
  },
  show: {
    type: Boolean,
    default: false,
  },
  closeOnConfirm: {
    type: Boolean,
    default: true,
  },
  hideConfirm: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['confirm', 'close', 'cancel', 'update:show'])
const showLocal = ref(false)
usePopupBack(props.show)

watch(
  () => props.show,
  (val) => {
    showLocal.value = val
  }
)

watch(showLocal, (newVal, oldVal) => {
  emit('update:show', newVal)
})

const confirm = () => {
  if (props.closeOnConfirm) showLocal.value = false
  emit('confirm')
}
const close = () => {
  emit('close')
}
</script>
