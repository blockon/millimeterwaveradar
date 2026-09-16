import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSimulationFrame, simulationEnvironment, OCCUPANCY_PRESETS } from '../src/utils/radarSimulation.js'
import { buildNearestRadarPersonRows, getFloorOriginXZFromRadarParams } from '../src/utils/radarPersonMetrics.js'
import { radarWindZone, resolveRadarWind } from '../src/utils/radarWindScenario.js'
const angles = { L: -40, M: 0, R: 40 }
function rows(frame) {
  return buildNearestRadarPersonRows(frame.kpts, frame.trackIds, frame.roomConfig.depth, 3,
    getFloorOriginXZFromRadarParams(frame.radarParams, frame.roomConfig.depth), frame.positions, frame.distances)
}
test('全部二十种占位通过真实坐标转换得到正确区域、人数、点云', () => {
  assert.equal(OCCUPANCY_PRESETS.length, 20)
  assert.equal(new Set(OCCUPANCY_PRESETS.map(p => p.zones.join(''))).size, 20)
  for (const preset of OCCUPANCY_PRESETS) {
    const f = buildSimulationFrame(preset.zones.map((zone, i) => ({ angle: angles[zone], distance: 2 + i * .65, action: 2 })))
    const targets = rows(f)
    assert.equal(targets.length, preset.zones.length)
    assert.deepEqual(targets.map(t => radarWindZone(t.angel)), preset.zones.map(z => ({ L: 'left', M: 'middle', R: 'right' })[z]))
    assert.equal(f.pointCloud.length > 0, targets.length > 0)
    assert.ok(f.pointCloud.flat().every(Number.isFinite))
    for (const mode of [1, 2, 3]) assert.equal(resolveRadarWind({ mode, targets, action: 2, distanceM: f.distances[0] }) !== null, targets.length > 0)
  }
})
test('最近人员动作及 2.5 米边界控制风速', () => {
  for (const distance of [2.49, 2.5, 2.51]) {
    const f = buildSimulationFrame([{ angle: -40, distance: 4, action: 4 }, { angle: 40, distance, action: 2 }])
    const targets = rows(f), i = targets[0].sourceIndex
    assert.equal(i, 1)
    assert.ok(Math.abs(targets[0].distanceM - distance) < 1e-10)
    assert.equal(resolveRadarWind({ mode: 3, targets, action: f.actions[i], distanceM: f.distances[i] }).speed, distance <= 2.5 ? 2 : 4)
  }
})
test('动态帧同步改变位置、距离，非法输入不产生非有限坐标', () => {
  const people = [{ angle: 0, distance: 2.5, action: 3 }]
  const first = buildSimulationFrame(people), next = buildSimulationFrame(people, 1)
  assert.notDeepEqual(first.kpts, next.kpts)
  assert.notDeepEqual(first.pointCloud, next.pointCloud)
  assert.notEqual(first.distances[0], next.distances[0])
  assert.ok(buildSimulationFrame([{ angle: NaN, distance: '', action: 0 }]).pointCloud.flat().every(Number.isFinite))
})


test('模拟沿用真实安装原点、朝向和房间尺寸，人物脚底落地', () => {
  for (const azimuth of [0, 90, 180, -90]) {
    const env = simulationEnvironment({ radarX_room: 1.2, radarY_room: 2.1, radarAzimuth_room: azimuth, radarHeight: 2.5 }, { depth: 8, width: 6 })
    const f = buildSimulationFrame([{ angle: 0, distance: 2.2, action: 2 }], 0, env)
    assert.equal(f.radarParams, env.radarParams)
    assert.equal(f.roomConfig, env.roomConfig)
    const target = rows(f)[0]
    assert.ok(Math.abs(target.distanceM - 2.2) < 1e-10)
    assert.equal(target.angel, ((180 - azimuth) % 360 + 360) % 360)
    assert.ok(Math.abs(f.kpts[0][2][15] + 1 - .03) < 1e-10)
    assert.ok(Math.abs(f.kpts[0][2][16] + 1 - .03) < 1e-10)
  }
})
test('离线扇形向观众展开，空安装参数使用有效默认值', () => {
  const env = simulationEnvironment({ radarAzimuth_room: null, radarY_room: '' }, { depth: 0 })
  assert.equal(env.radarParams.radarAzimuth_room, 90)
  assert.equal(env.radarParams.radarY_room, 0)
  assert.equal(env.roomConfig.depth, 5)
})

test('站姿和坐姿的骨架与点云使用相同高度基准', () => {
  for (const action of [2, 3, 4]) {
    const f = buildSimulationFrame([{ angle: 0, distance: 2.2, action }])
    // 第一条骨架边从左肩开始；两种渲染均对输入高度 +1。
    assert.equal(f.pointCloud[0][2], f.kpts[0][2][5])
    assert.ok(Math.abs(f.kpts[0][2][15] + 1 - .03) < 1e-10)
  }
})
