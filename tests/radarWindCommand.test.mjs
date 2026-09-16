import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { computed, effectScope, nextTick, ref, watch } from 'vue'

// 直接执行首页的风速监听，避免复制实现后测试与页面行为脱节。
const homeSource = readFileSync(new URL('../src/page/home/index.vue', import.meta.url), 'utf8')
const start = homeSource.indexOf('let windSpeedCommandTimer = null')
const cleanup = 'onUnmounted(() => clearTimeout(windSpeedCommandTimer))'
const end = homeSource.indexOf(cleanup, start)
assert.ok(start >= 0 && end > start, '首页应包含风速监听及卸载清理')
const installWatcher = new Function(
  'watch', 'radarWindPlan', 'devData', 'mqttConnected', 'deviceStore',
  'setTimeout', 'clearTimeout', 'onUnmounted',
  homeSource.slice(start, end + cleanup.length),
)

function createHarness(t) {
  const desiredSpeed = ref(4)
  const devData = ref({ speed: 4, swing_mode: 1, power: 1 })
  const radarWindPlan = computed(() => devData.value.power ? { speed: desiredSpeed.value } : null)
  const commands = []
  const timers = new Map()
  let timerId = 0
  let unmount
  const scope = effectScope()
  scope.run(() => installWatcher(
    watch, radarWindPlan, devData, ref(true),
    { sendCommand: command => commands.push(command) },
    (callback, delay) => {
      assert.equal(delay, 500)
      timers.set(++timerId, callback)
      return timerId
    },
    id => timers.delete(id),
    callback => { unmount = callback },
  ))
  const dispose = () => { unmount(); scope.stop() }
  t.after(dispose)
  const flushDelay = async () => {
    await nextTick()
    const pending = [...timers.values()]
    timers.clear()
    pending.forEach(callback => callback())
  }
  return { desiredSpeed, devData, commands, flushDelay, dispose }
}

test('坐下后站起，延迟的低风回报到达时补发高风，确认后不重复发送', async t => {
  const h = createHarness(t)
  h.desiredSpeed.value = 2
  await h.flushDelay()
  assert.deepEqual(h.commands, [{ mark: 2 }])

  h.desiredSpeed.value = 4
  await h.flushDelay()
  assert.deepEqual(h.commands, [{ mark: 2 }])

  h.devData.value.speed = 2
  await h.flushDelay()
  assert.deepEqual(h.commands, [{ mark: 2 }, { mark: 4 }])

  h.devData.value.speed = 4
  await h.flushDelay()
  await h.flushDelay()
  assert.deepEqual(h.commands, [{ mark: 2 }, { mark: 4 }])
})

test('关机后不因延迟回报补发风速指令', async t => {
  const h = createHarness(t)
  h.devData.value.speed = 2
  await nextTick()
  h.devData.value.power = 0
  await h.flushDelay()
  assert.deepEqual(h.commands, [])
})

test('卸载时取消延迟回报触发的待发指令', async t => {
  const h = createHarness(t)
  h.devData.value.speed = 2
  await nextTick()
  h.dispose()
  await h.flushDelay()
  assert.deepEqual(h.commands, [])
})
