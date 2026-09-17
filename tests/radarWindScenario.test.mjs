import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolveRadarWind, reportedWindMode, radarWindZone, radarWindDeflectionDeg, radarWindSwingAmount, WIND_POSITION_LEVELS } from '../src/utils/radarWindScenario.js'
import * as THREE from 'three'
import { horizontalAngleDegFromXZ } from '../src/utils/radarPersonMetrics.js'
import { RADAR_VIEW_ROTATION_DEG } from '../src/rendering/radarView.js'

const angles = { L: 310, M: 270, R: 230 }
const resolve = (mode, positions, action, distanceM = 3) => resolveRadarWind({ mode, targets: [...positions].map(p => ({ angel: angles[p] })), action, distanceM })
const expected = {
  1: { L: ['L_L','R_L'], R: ['L_R','R_R'], M: ['L_M','R_M'], LR: ['L_L','R_R'], LM: ['L_L','R_L'], RM: ['L_R','R_R'], LMR: ['L_M','R_M'] },
  2: { L: ['L_R','R_R'], R: ['L_L','R_L'], M: ['L_LSmall','R_RSmall'], LR: ['L_M','R_M'], LM: ['L_R','R_R'], RM: ['L_L','R_L'], LMR: ['L_M','R_M'] },
}
test('风效跟随人物的实际相机投影左右，避人模式反向', () => {
  const camera = new THREE.PerspectiveCamera(60, 1.25, 0.1, 100)
  const target = new THREE.Vector3(0, 1, 0)
  const offset = new THREE.Vector3(6, 5, 6).sub(target)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), RADAR_VIEW_ROTATION_DEG * Math.PI / 180)
  camera.position.copy(target.clone().add(offset))
  camera.lookAt(target)
  camera.updateMatrixWorld()
  for (const [x, z] of [[2, 2], [-2, 2], [2, -2], [-2, -2], [-2, 0], [2, 0]]) {
    const screenX = new THREE.Vector3(x, 1, z).project(camera).x
    const side = Math.abs(screenX) < 1e-8 ? 'M' : screenX < 0 ? 'L' : 'R'
    const targets = [{ angel: horizontalAngleDegFromXZ(x, z) }]
    const follow = resolveRadarWind({ mode: 1, targets, action: 2 })
    assert.equal(follow.left.image, `L_${side}Strong.png`)
    assert.equal(follow.right.image, `R_${side}Strong.png`)
    if (side !== 'M') {
      const avoid = resolveRadarWind({ mode: 2, targets, action: 2 })
      const opposite = side === 'L' ? 'R' : 'L'
      assert.equal(avoid.left.image, `L_${opposite}Strong.png`)
      assert.equal(avoid.right.image, `R_${opposite}Strong.png`)
    }
  }
})
for (const mode of [1, 2]) {
  for (const positions of Object.keys(expected[mode])) {
    for (const action of [2, 3, 4]) {
      test(`模式${mode} 站位${positions} 动作${action}`, () => {
        const result = resolve(mode, positions, action)
        const weakOnly = mode === 2 && ['M', 'LR'].includes(positions)
        assert.equal(result.speed, weakOnly || action === 4 ? 2 : 4)
        const strengths = [0, 1].map(side => weakOnly || action === 4 ? 'Weak' : 'Strong')
        if (mode === 2 && action === 4 && positions === 'L') strengths[1] = 'Strong'
        if (mode === 2 && action === 4 && positions === 'R') strengths[0] = 'Strong'
        for (const [i, side] of ['left', 'right'].entries()) {
          assert.equal(result[side].image, `${expected[mode][positions][i]}${strengths[i]}.png`)
          const direction = expected[mode][positions][i][2]
          const positionsBySide = { left: { L: 100, M: 50, R: 0 }, right: { L: 0, M: 50, R: 100 } }
          assert.equal(result[side].position, positionsBySide[side][direction])
          assert.ok(existsSync(new URL(`../src/assets/imgs/${result[side].image}`, import.meta.url)))
          const short = mode === 2 && (positions === 'LR' || positions === 'LM' && side === 'left' || positions === 'RM' && side === 'right')
          assert.equal(result[side].scale, short ? 0.6 : 1)
        }
      })
    }
  }
}
// radarSimulation 的 RADAR.radarAzimuth_room，正前方 = 180 - 该方位角。
const SIM_RADAR_AZIMUTH_DEG = 90
const SIM_FORWARD_DEG = 180 - SIM_RADAR_AZIMUTH_DEG

// 偏角必须以雷达安装方位角的反向为正前方。曾经取成相机方位角的反向（270°），
// 幅度整体偏 180°，五档里除了正前只会落到满偏。
test('偏角以雷达安装方位角的反向为正前方', () => {
  // 模拟的 offset 负值在左侧，偏角（正数偏左）与之符号相反。
  for (const offset of [-60, -40, -20, 20, 40, 60]) {
    assert.equal(radarWindDeflectionDeg(SIM_FORWARD_DEG + offset), -offset, `offset=${offset}`)
  }
  assert.equal(radarWindDeflectionDeg(SIM_FORWARD_DEG), 0)
  assert.equal(Math.abs(radarWindDeflectionDeg(270)), 180)
})

// 摆幅从中间区边界 20° 起算，到满偏角 60° 封顶，中间按 30° / 50° 切成三档。
test('摆幅按偏角取档，拿不到偏角时按满偏处理', () => {
  assert.equal(radarWindSwingAmount(0), 0)
  assert.equal(radarWindSwingAmount(20), 0)
  assert.equal(radarWindSwingAmount(29), 0)
  assert.equal(radarWindSwingAmount(30), 25)
  assert.equal(radarWindSwingAmount(40), 25)
  assert.equal(radarWindSwingAmount(49), 25)
  assert.equal(radarWindSwingAmount(50), 50)
  assert.equal(radarWindSwingAmount(90), 50)
  assert.equal(radarWindSwingAmount(-50), 50)
  assert.equal(radarWindSwingAmount(null), 50)
  assert.equal(radarWindSwingAmount(Infinity), 50)
})

test('摆叶位置按偏角取五档刻度，左右镜像', () => {
  const cases = [
    [SIM_FORWARD_DEG - 29, 'left', 50, 50], // 偏左 29°，尚未进档
    [SIM_FORWARD_DEG - 30, 'left', 75, 25], // 偏左 30°，中间档
    [SIM_FORWARD_DEG - 40, 'left', 75, 25], // 偏左 40°
    [SIM_FORWARD_DEG - 50, 'left', 100, 0], // 偏左 50°，满偏
    [SIM_FORWARD_DEG, 'middle', 50, 50],
    [SIM_FORWARD_DEG + 29, 'right', 50, 50],
    [SIM_FORWARD_DEG + 30, 'right', 25, 75], // 偏右 30°，中间档
    [SIM_FORWARD_DEG + 40, 'right', 25, 75],
    [SIM_FORWARD_DEG + 50, 'right', 0, 100], // 偏右 50°，满偏
  ]
  for (const [angle, zone, left, right] of cases) {
    assert.equal(radarWindZone(angle), zone)
    const result = resolveRadarWind({ mode: 1, targets: [{ angel: angle }], action: 2 })
    assert.equal(result.left.position, left, `角度${angle} 左片`)
    assert.equal(result.right.position, right, `角度${angle} 右片`)
  }
})

test('点云模拟的左中右站位落在中间档，满偏留给 ±60°', () => {
  const cases = [[-60, 100, 0], [-40, 75, 25], [0, 50, 50], [40, 25, 75], [60, 0, 100]]
  for (const [offset, left, right] of cases) {
    const result = resolveRadarWind({ mode: 1, targets: [{ angel: SIM_FORWARD_DEG + offset }], action: 4 })
    assert.equal(result.left.position, left, `offset=${offset} 左片`)
    assert.equal(result.right.position, right, `offset=${offset} 右片`)
  }
})

test('摆幅取该侧最近一人，风避人吹反向且摆幅一致', () => {
  const nearestWide = resolveRadarWind({ mode: 1, targets: [{ angel: SIM_FORWARD_DEG - 50 }, { angel: SIM_FORWARD_DEG - 30 }], action: 2 })
  const nearestNarrow = resolveRadarWind({ mode: 1, targets: [{ angel: SIM_FORWARD_DEG - 30 }, { angel: SIM_FORWARD_DEG - 50 }], action: 2 })
  assert.equal(nearestWide.left.position, 100)
  assert.equal(nearestNarrow.left.position, 75)
  const avoid = resolveRadarWind({ mode: 2, targets: [{ angel: SIM_FORWARD_DEG - 30 }], action: 2 })
  assert.equal(avoid.left.position, 25)
  assert.equal(avoid.right.position, 75)
  assert.equal(avoid.left.image, 'L_RStrong.png')
  assert.equal(avoid.right.image, 'R_RStrong.png')
})

test('风避人吹在中间区外至少避让一档，左右及中间有人时均生效', () => {
  for (const offset of [-30, -29, -21, 21, 29, 30]) {
    for (const hasMiddle of [false, true]) {
      for (const action of [2, 3, 4]) {
        const targets = [{ angel: SIM_FORWARD_DEG + offset }]
        if (hasMiddle) targets.push({ angel: SIM_FORWARD_DEG })
        const result = resolveRadarWind({ mode: 2, targets, action })
        assert.equal(result.left.position, offset < 0 ? 25 : 75)
        assert.equal(result.right.position, offset < 0 ? 75 : 25)
        assert.equal(result.speed, action === 4 ? 2 : 4)
      }
    }
  }
  for (const offset of [-20, 20]) {
    const result = resolveRadarWind({ mode: 2, targets: [{ angel: SIM_FORWARD_DEG + offset }], action: 2 })
    assert.equal(result.left.position, 100)
    assert.equal(result.right.position, 100)
    assert.equal(result.speed, 2)
  }
})

test('摆叶位置始终落在五档刻度内', () => {
  for (let angle = 0; angle < 360; angle++) {
    for (const mode of [1, 2]) {
      const result = resolveRadarWind({ mode, targets: [{ angel: angle }], action: 2 })
      if (!result) continue
      for (const side of ['left', 'right']) {
        assert.ok(WIND_POSITION_LEVELS.includes(result[side].position), `模式${mode} 角度${angle} ${side}=${result[side].position}`)
      }
    }
  }
})

for (const action of [2, 3, 4]) {
  for (const distance of [2.49, 2.5, 2.51, 5]) {
    test(`人近风柔 动作${action} 距离${distance}`, () => {
      const result = resolve(3, 'LMR', action, distance)
      const low = action === 4 || distance <= 2.5
      assert.equal(result.speed, low ? 2 : 4)
      assert.equal(result.left.image, low ? 'L_LSmallWeak.png' : 'L_LStrong.png')
      assert.equal(result.right.image, low ? 'R_RSmallWeak.png' : 'R_RStrong.png')
      assert.equal(result.left.position, 100)
      assert.equal(result.right.position, 100)
    })
  }
}
test('未知数据、无人和非目标姿态不触发控制', () => {
  for (const action of [null, 0, 1, 5, 6, 7, 8]) assert.equal(resolve(1, 'L', action), null)
  assert.equal(resolve(0, 'L', 2), null)
  assert.equal(resolve(1, '', 2), null)
  assert.equal(resolveRadarWind({ mode: 1, targets: [{ angel: null }], action: 2 }), null)
  assert.equal(resolve(3, 'L', 2, null), null)
})
test('模式关闭和局部上报不会误清除其它已开启模式', () => {
  assert.equal(reportedWindMode(1, { radarWindAvoidPeople: 0 }), 1)
  assert.equal(reportedWindMode(1, { radarWindFollowPeople: 0 }), 0)
  assert.equal(reportedWindMode(1, { radarWindFollowPeople: 0, radarPeopleNearSoftWind: 1 }), 3)
  assert.equal(reportedWindMode(2, { mark: 2 }), 2)
})
