<!-- svga播放器 宽度高度100% -->
<!-- 参数 url -->
<template>
  <div :id="id" class="w-full h-full"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import SVGA from 'svgaplayerweb'

const props = defineProps({
  url: {
    type: String,
  },
})

const id = 'player_' + Date.now() + (Math.random() * 10000).toFixed(0)
const svga_player = (url, id) => {
  let player = new SVGA.Player('#' + id)
  let parser = new SVGA.Parser()
  parser.load(url, function (videoItem) {
    player.setVideoItem(videoItem)
    player.startAnimation()
  })
}
onMounted(() => {
  setTimeout(() => {
    svga_player(props.url, id)
  })
})
</script>
