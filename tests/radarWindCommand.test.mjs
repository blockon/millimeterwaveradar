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
  'setTimeout', 'clearTimeout', 'onUnmounted', 'simulationEnabled',
  homeSource.slice(start, end + cleanup.length),
)

function createHarness(t) {
  const simulationEnabled = ref(false)
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
    simulationEnabled,
  ))
  const dispose = () => { unmount(); scope.stop() }
  t.after(dispose)
  const flushDelay = async () => {
    await nextTick()
    const pending = [...timers.values()]
    timers.clear()
    pending.forEach(callback => callback())
  }
  return { simulationEnabled, desiredSpeed, devData, commands, flushDelay, dispose }
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


test('进入模拟取消待发风速，模拟变化不下发，退出恢复纠偏', async t => {
  const h = createHarness(t)
  h.devData.value.speed = 2
  await nextTick()
  h.simulationEnabled.value = true
  await h.flushDelay()
  h.desiredSpeed.value = 2
  await h.flushDelay()
  h.desiredSpeed.value = 4
  await h.flushDelay()
  assert.deepEqual(h.commands, [])
  h.simulationEnabled.value = false
  await h.flushDelay()
  assert.deepEqual(h.commands, [{ mark: 4 }])
})

test('模拟模式切换不下发功能指令，取消待播报并阻止模拟播报', async t => {
  const simulationEnabled = ref(false), simulationMode = ref(1)
  const broadcasts = [], commands = [], timers = new Map()
  const WIND_MODE_FIELDS = { 1: 'radarWindFollowPeople', 2: 'radarWindAvoidPeople', 3: 'radarPeopleNearSoftWind' }
  const deviceStore = { sendCommand: c => commands.push(c), sendBroadcast: c => broadcasts.push(c) }
  const handlerStart = homeSource.indexOf('function handleTestSend(mode)')
  const handlerEnd = homeSource.indexOf('// 风速变化稳定后下发', handlerStart)
  const send = new Function('simulationEnabled', 'simulationMode', 'deviceStore', 'WIND_MODE_FIELDS',
    homeSource.slice(handlerStart, handlerEnd) + '\nreturn handleTestSend')(simulationEnabled, simulationMode, deviceStore, WIND_MODE_FIELDS)
  const start = homeSource.indexOf('let windBroadcastTimer = null')
  const cleanup = 'onUnmounted(() => clearTimeout(windBroadcastTimer))'
  const end = homeSource.indexOf(cleanup, start) + cleanup.length
  const plan = ref({ speed: 4 }), dev = ref({ swing_mode: 1 })
  const install = new Function('watch', 'WIND_BROADCAST_IDS', 'devData', 'radarWindPlan', 'mqttConnected',
    'simulationEnabled', 'deviceStore', 'setTimeout', 'clearTimeout', 'onUnmounted', homeSource.slice(start, end))
  const scope = effectScope(); let timerId = 0, unmount
  scope.run(() => install(watch, { 1: { 2: 10, 4: 11 }, 2: { 2: 12, 4: 13 } }, dev, plan, ref(true), simulationEnabled,
    deviceStore, callback => { timers.set(++timerId, callback); return timerId }, id => timers.delete(id), cb => { unmount = cb }))
  t.after(() => { unmount(); scope.stop() })
  plan.value = { speed: 2 }
  await nextTick()
  assert.equal(timers.size, 1)
  simulationEnabled.value = true
  await nextTick()
  assert.equal(timers.size, 0)
  for (const mode of [1, 2, 3]) { send(mode); assert.equal(simulationMode.value, mode) }
  dev.value = { swing_mode: 2 }; plan.value = { speed: 4 }
  await nextTick()
  for (const callback of timers.values()) callback()
  assert.deepEqual(commands, [])
  assert.deepEqual(broadcasts, [])
})

test('风向即时下发、同向帧去重、回报不重发，模拟离线打印指令，真实断线及无目标不下发', async t => {
  const start = homeSource.indexOf('// 风向与界面同步下发。')
  const end = homeSource.indexOf('// 模式/目标风速稳定后独立播报', start)
  assert.ok(start >= 0 && end > start)
  const install = new Function('watch', 'radarWindPlan', 'devData', 'mqttConnected', 'simulationEnabled', 'deviceStore', 'console', homeSource.slice(start, end))
  const plan = ref(null), dev = ref({ swing_mode: 1, power: 1 })
  const connected = ref(true), simulated = ref(false), commands = [], logs = []
  const scope = effectScope()
  scope.run(() => install(watch, plan, dev, connected, simulated, { sendCommand: c => commands.push(c) }, { log: (...args) => logs.push(args) }))
  t.after(() => scope.stop())
  const setPlan = async (left, right) => {
    plan.value = { left: { position: left }, right: { position: right }, speed: 4 }
    await nextTick()
  }
  await setPlan(100, 0)
  assert.deepEqual(commands, [{ setPositionForLeftRightWind: 100, setPositionForLeftRightWindH2: 0 }])
  await setPlan(100, 0)
  dev.value.left_swing_area = 80
  await nextTick()
  assert.equal(commands.length, 1)
  await setPlan(50, 50)
  assert.deepEqual(commands.at(-1), { setPositionForLeftRightWind: 50, setPositionForLeftRightWindH2: 50 })
  connected.value = false
  await setPlan(0, 100)
  assert.equal(commands.length, 2)
  connected.value = true
  await nextTick()
  assert.deepEqual(commands.at(-1), { setPositionForLeftRightWind: 0, setPositionForLeftRightWindH2: 100 })
  connected.value = false
  simulated.value = true
  await setPlan(100, 100)
  assert.equal(commands.length, 3)
  assert.equal(logs.length, 1)
  assert.deepEqual(JSON.parse(logs[0].at(-1)), { setPositionForLeftRightWind: 100, setPositionForLeftRightWindH2: 100, mark: 4 })
  await setPlan(100, 100)
  assert.equal(logs.length, 1)
  await setPlan(0, 100)
  assert.deepEqual(JSON.parse(logs.at(-1).at(-1)), { setPositionForLeftRightWind: 0, setPositionForLeftRightWindH2: 100, mark: 4 })
  plan.value.speed = 2
  await nextTick()
  assert.equal(logs.length, 3)
  assert.deepEqual(JSON.parse(logs.at(-1).at(-1)), { setPositionForLeftRightWind: 0, setPositionForLeftRightWindH2: 100, mark: 2 })
  connected.value = true
  await nextTick()
  assert.equal(commands.length, 3)
  simulated.value = false
  await nextTick()
  assert.equal(commands.length, 4)
  // 关机、退出模式、雷达断开或无人时，实际计算属性都会返回 null。
  plan.value = null
  await nextTick()
  assert.equal(commands.length, 4)
  await setPlan(100, 100)
  assert.equal(commands.length, 5)
  dev.value.swing_mode = 3
  await nextTick()
  assert.equal(commands.length, 6)
  scope.stop()
  await setPlan(50, 50)
  assert.equal(commands.length, 6)
})
