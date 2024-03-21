<template>
  <!-- 页面的通用顶部 -->
  <div class="titlebar" :class="{ 'title-blur': titleBlur, 'title-color-whtie': titleColorWhtie }">
    <i class="iconfont" @click="backClick">&#xe641;</i>
    <div class="title-name">{{ title }}</div>
    <div class="right">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: '标题',
    },
    goBack: {
      type: Function,
    },
    titleBlur: {
      type: Boolean,
      default: false,
    }, // 启用高斯模糊标题，会变透明
    titleColorWhtie: {
      type: Boolean,
      default: false,
    }, // 标题颜色
  },
  methods: {
    backClick() {
      if (typeof this.goBack === 'function') {
        this.goBack()
      } else {
        this.$router.go(-1)
      }
    },
  },
}
</script>

<style lang="scss">
.titlebar {
  height: 44px;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2;
  text-align: center;
  justify-content: space-between;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  &.title-blur {
    background-color: transparent;
    backdrop-filter: blur(20px);
  }
  &.title-color-whtie * {
    color: #fff !important;
  }
  .title-name {
    color: #333;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    line-height: 20px;
    font-size: 18px;
  }
}
</style>
