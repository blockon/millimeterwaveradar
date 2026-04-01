<template>
  <div ref="containerRef" class="three-stickman-container" />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue"
import { StickmanScene } from "@/rendering/StickmanScene"

const props = defineProps({
  kptsData: { type: Array, default: () => [] },
  trackIds: { type: Array, default: () => [] },
  pointCloudData: { type: Array, default: () => [] },
  roomConfig: { type: Object, default: () => ({ width: 5, depth: 5 }) },
  radarParams: { type: Object, default: () => ({}) },
  showSkeleton: { type: Boolean, default: false },
  showPointCloud: { type: Boolean, default: true },
  skeletonMode: { type: String, default: "stickman" },
})

const containerRef = ref(null)
let sceneManager = null
let animationId = null
let resizeObserver = null

function animate() {
  if (sceneManager) sceneManager.animate()
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (!containerRef.value) return
  const canvas = document.createElement("canvas")
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.display = "block"
  containerRef.value.appendChild(canvas)

  sceneManager = new StickmanScene(canvas, {
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
    roomWidth: props.roomConfig.width,
    roomDepth: props.roomConfig.depth,
    renderMode: props.skeletonMode === "stickman" ? "stickman" : "model",
  })
  animate()

  resizeObserver = new ResizeObserver(() => {
    if (containerRef.value && sceneManager) {
      sceneManager.handleResize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    }
  })
  resizeObserver.observe(containerRef.value)
  if (sceneManager) {
    sceneManager.setSkeletonVisible(props.showSkeleton)
    sceneManager.setPointCloudVisible(props.showPointCloud)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  if (resizeObserver && containerRef.value) resizeObserver.disconnect()
  if (sceneManager) {
    sceneManager.dispose()
    sceneManager = null
  }
})

watch(
  () => props.kptsData,
  (data) => {
    if (sceneManager) sceneManager.updateHumanPose(data, props.trackIds)
  },
  { deep: true }
)

watch(
  () => props.roomConfig,
  (cfg) => {
    if (sceneManager && cfg) sceneManager.updateRoom(cfg.width ?? 5, cfg.depth ?? 5)
  },
  { deep: true }
)

watch(
  () => props.radarParams,
  (params) => {
    if (sceneManager && params) sceneManager.updateRadarModel(params)
  },
  { deep: true }
)

watch(
  () => props.pointCloudData,
  (data) => {
    if (sceneManager) sceneManager.updatePointCloud(data)
  },
  { deep: true }
)

watch(
  () => props.showSkeleton,
  (v) => {
    if (sceneManager) sceneManager.setSkeletonVisible(v)
  }
)

watch(
  () => props.showPointCloud,
  (v) => {
    if (sceneManager) sceneManager.setPointCloudVisible(v)
  }
)
</script>

<style scoped>
.three-stickman-container {
  width: 100%;
  height: 100%;
  min-height: 320px;
  position: relative;
  overflow: hidden;
}
</style>
