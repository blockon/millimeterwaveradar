<!--
    title: String 标题
    titleColorWhtie: Boolean 文字白色
    titleBlur: Boolean 开启背景模糊,颜色会变透明
    bounce:Boolean 回弹效果
    useScroll: 使用betterScroll滚动
    hideHeader: Boolean 隐藏标题
    bodyTop0: Boolean 默认false 内容是否从top0开始
    goBack: Function 返回按钮事件
    hideHeader: 隐藏header
    usesOnPullDown: Boolean 下拉
    isPullDownLoading: Boolean 下拉加载中，false表示完成，会结束下拉事件
    useOnPullUp: Boolean 上拉
    useOnScroll: Boolean 滚动
    @onPullDown: Function 下拉回调
    @onPullUp: Function 上拉回调
    @onScroll: Function 滚动回调
    EventBus.emit('pageScrollTo', { x: 0, y: 0 }) // 滚动
    EventBus.emit('pageRefresh') // 刷新
    EventBus.on('pageStopScroll', stopScroll) // enable，disable切换
 -->
<template>
  <div :class="['page-layout', { hideHeader }]" id="pageLayout">
    <!-- 标题栏 -->
    <AppTitleBar v-if="!hideHeader" :title="title" :go-back="goBack" :titleBlur="titleBlur" :titleColorWhtie="titleColorWhtie">
      <slot name="rightbtn" />
    </AppTitleBar>

    <div ref="pagebody" class="page-body" :class="{ noscroll: !useScroll, 'top-0-important': bodyTop0 }">
      <div class="flex-1">
        <div v-show="usesOnPullDown" class="center pulldown-wrapper">{{ pulldownTxt }}</div>
        <div id="scroll-wrapper" class="flex-col">
          <slot :scrollTo="scrollTo" />
        </div>
        <div v-show="useOnPullUp" class="pull-up">上拉刷新</div>
      </div>

      <slot name="noscroll" />
    </div>

    <!-- 网络异常 -->
    <div v-if="!hideHeader && networkStore.networkError == '404'" class="network-error">
      <svg class="iconfont-c mr-10 f-l" aria-hidden="true" style="font-size: 20px">
        <use xlink:href="#icon-ic_tips1" />
      </svg>
      <span> 网络异常，请检查您的网络设置</span>
    </div>
  </div>
</template>
<script setup>
import BScroll from '@better-scroll/core' //要先引入BetterScroll插件
import PullDown from '@better-scroll/pull-down' //再引入 pulldown 插件
import Pullup from '@better-scroll/pull-up'
import ObserveDOM from '@better-scroll/observe-dom'
import ObserveImage from '@better-scroll/observe-image'

BScroll.use(ObserveImage)
BScroll.use(ObserveDOM)
BScroll.use(PullDown)
BScroll.use(Pullup)

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  titleBlur: {
    type: Boolean,
    default: true,
  }, // 启用高斯模糊标题，会变透明
  titleColorWhtie: {
    type: Boolean,
    default: false,
  }, // 标题颜色
  usesOnPullDown: {
    type: Boolean,
    default: false,
  },
  isPullDownLoading: {
    type: Boolean,
    default: false,
  },
  useOnPullUp: {
    type: Boolean,
    default: false,
  },
  goBack: {
    type: Function,
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
  useScroll: {
    type: Boolean,
    default: true,
  },
  bounce: {
    type: Boolean,
    default: true,
  },
  useOnScroll: {
    type: Boolean,
    default: true,
  },
  bodyTop0: {
    type: Boolean,
    default: false,
  }, // 内容默认top0
})
const emit = defineEmits(['onPullDown', 'onPullUp', 'onScroll'])

const stopScroll = (val = true) => {
  if (!scrollInstance) return
  if (val) {
    scrollInstance.disable()
  } else {
    scrollInstance.enable()
  }
}

const scrollTo = ({ x = 0, y = 0 }) => {
  scrollInstance.scrollTo(x, y)
}

const refresh = () => {
  scrollInstance.refresh()
}

EventBus.on('pageStopScroll', stopScroll)
EventBus.on('pageRefresh', refresh)
EventBus.on('pageScrollTo', scrollTo)

const pagebody = ref(null)
const pulldownTxt = ref('下拉刷新')
let scrollInstance = {}
onMounted(() => {
  if (!props.useScroll) return

  nextTick(() => {
    const isIos = Tools.browserEnv().ios
    const options = {
      probeType: 3,
      mouseWheel: true,
      observeDOM: true, // 开启 observe-dom 插件
      observeImage: true, // 开启 observe-image 插件
      scrollY: true,
      pullDownRefresh: false,
      pullUpLoad: false,
      bindToWrapper: true,
      click: false,
      bounce: props.bounce,
      useTransition: !isIos,
      eventPassthrough: 'horizontal',
    }
    if (props.usesOnPullDown) options.pullDownRefresh = { threshold: 70, stop: 50 }
    if (props.useOnPullUp) options.pullUpLoad = { threshold: -70, stop: 50 }
    scrollInstance = new BScroll(pagebody.value, options)

    // 监听下拉刷新事件
    if (props.usesOnPullDown) {
      watch(
        () => props.isPullDownLoading,
        (val) => {
          if (!val) {
            console.log('下拉刷新完成')
            scrollInstance.finishPullDown()
          }
        }
      )
      scrollInstance.on('pullingDown', () => {
        console.log('下拉刷新开始')
        pulldownTxt.value = '刷新中'
        emit('onPullDown', scrollInstance)
      })
    }

    // 监听上拉刷新事件
    if (props.useOnPullUp) {
      scrollInstance.on('pullingUp', () => {
        emit('onPullUp', scrollInstance)
        setTimeout(() => {
          scrollInstance.finishPullUp()
        }, 1000)
      })
    }

    // 监听滚动事件
    if (props.useOnScroll) {
      scrollInstance.on('scroll', (e) => {
        emit('onScroll', e.y)
      })
    }
  })
})
</script>
<style rel="stylesheet/less" lang="scss">
.page-layout {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .titlebar {
    & + .page-body {
      top: 44px;
    }
  }

  // &.hideHeader {
  //   .page-body {
  //     padding-top: 44px;
  //   }
  // }
  .page-body {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    // overflow: hidden;
    &.noscroll {
      overflow: auto;
    }

    #scroll-wrapper {
      min-height: calc(100vh - 40px);
    }
  }

  .pulldown-wrapper {
    position: absolute;
    width: 100%;
    padding: 20px;
    transform: translateY(-100%) translateZ(0);
    text-align: center;
    color: #999;
  }

  .pull-up {
    width: 100%;
    padding: 20px;
    text-align: center;
    position: absolute;
    color: #999;
  }
}

.network-error {
  z-index: 9;
  position: absolute;
  top: 44px;
  left: 0;
  width: 100%;
  background: #ffecee;
  color: #ff5d72;
  font-size: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
}
</style>
