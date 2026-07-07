<template>
  <div ref="containerRef" class="three-stickman-container" />
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue"
import { StickmanScene } from "@/rendering/StickmanScene"
import { isTvPerformanceMode } from "@/utils/debugLog"

const props = defineProps({
  kptsData: { type: Array, default: () => [] },
  trackIds: { type: Array, default: () => [] },
  pointCloudData: { type: Array, default: () => [] },
  roomConfig: { type: Object, default: () => ({ width: 5, depth: 5 }) },
  radarParams: { type: Object, default: () => ({}) },
  showSkeleton: { type: Boolean, default: false },
  showPointCloud: { type: Boolean, default: true },
  skeletonMode: { type: String, default: "stickman" },
  showSectorFloor: { type: Boolean, default: true },
  sectorFloorIdle: { type: Boolean, default: false },
  performanceMode: { type: Boolean, default: null },
})

const containerRef = ref(null)
let sceneManager = null
let animationId = null
let resizeObserver = null
let lastRenderTime = 0

const performanceModeEnabled = computed(() =>
  props.performanceMode == null ? isTvPerformanceMode : props.performanceMode
)
const targetFrameInterval = computed(() => (performanceModeEnabled.value ? 1000 / 30 : 0))

function animate(now = 0) {
  if (sceneManager) {
    const interval = targetFrameInterval.value
    if (interval <= 0 || now - lastRenderTime >= interval) {
      lastRenderTime = now
      sceneManager.animate()
    }
  }
  animationId = requestAnimationFrame(animate)
}

function syncHumanPose(data = props.kptsData) {
  if (!sceneManager) return
  if (!props.showSkeleton) {
    sceneManager.updateHumanPose([], [])
    return
  }
  sceneManager.updateHumanPose(data, props.trackIds)
}

function syncPointCloud(data = props.pointCloudData) {
  if (!sceneManager) return
  if (!props.showPointCloud) {
    sceneManager.updatePointCloud([])
    return
  }
  sceneManager.updatePointCloud(data)
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
    performanceMode: performanceModeEnabled.value,
  })
  animationId = requestAnimationFrame(animate)

  resizeObserver = new ResizeObserver(() => {
    if (containerRef.value && sceneManager) {
      sceneManager.handleResize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    }
  })
  resizeObserver.observe(containerRef.value)
  if (sceneManager) {
    sceneManager.setSkeletonVisible(props.showSkeleton)
    sceneManager.setPointCloudVisible(props.showPointCloud)
    sceneManager.updateRadarModel(props.radarParams && typeof props.radarParams === "object" ? props.radarParams : {})
    sceneManager.setSectorFloorVisible(props.showSectorFloor !== false)
    sceneManager.setSectorFloorIdle(!!props.sectorFloorIdle)
    syncHumanPose()
    syncPointCloud()
  }
})

onUnmounted(() => {
  if (animationId != null) cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (sceneManager) {
    sceneManager.dispose()
    sceneManager = null
  }
})

watch(
  () => props.kptsData,
  (data) => {
    syncHumanPose(data)
  }
)

watch(
  () => props.trackIds,
  () => {
    syncHumanPose()
  }
)

watch(
  () => props.roomConfig,
  (cfg) => {
    if (sceneManager && cfg) sceneManager.updateRoom(cfg.width ?? 5, cfg.depth ?? 5)
  }
)

watch(
  () => props.radarParams,
  (params) => {
    if (sceneManager && params) sceneManager.updateRadarModel(params)
  }
)

watch(
  () => props.pointCloudData,
  (data) => {
    syncPointCloud(data)
  }
)

watch(
  () => props.showSkeleton,
  (v) => {
    if (sceneManager) {
      sceneManager.setSkeletonVisible(v)
      syncHumanPose()
    }
  }
)

watch(
  () => props.showPointCloud,
  (v) => {
    if (sceneManager) {
      sceneManager.setPointCloudVisible(v)
      syncPointCloud()
    }
  }
)

watch(
  () => props.showSectorFloor,
  (v) => {
    if (sceneManager) sceneManager.setSectorFloorVisible(v !== false)
  }
)

watch(
  () => props.sectorFloorIdle,
  (v) => {
    if (sceneManager) sceneManager.setSectorFloorIdle(!!v)
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
