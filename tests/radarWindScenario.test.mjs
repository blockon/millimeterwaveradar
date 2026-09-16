import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolveRadarWind, reportedWindMode } from '../src/utils/radarWindScenario.js'
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
        assert.equal(result.speed, action === 4 ? 2 : 4)
        const weakOnly = mode === 2 && ['M', 'LR'].includes(positions)
        const strengths = [0, 1].map(side => weakOnly || action === 4 ? 'Weak' : 'Strong')
        if (mode === 2 && action === 4 && positions === 'L') strengths[1] = 'Strong'
        if (mode === 2 && action === 4 && positions === 'R') strengths[0] = 'Strong'
        for (const [i, side] of ['left', 'right'].entries()) {
          assert.equal(result[side].image, `${expected[mode][positions][i]}${strengths[i]}.png`)
          assert.ok(existsSync(new URL(`../src/assets/imgs/${result[side].image}`, import.meta.url)))
          const short = mode === 2 && (positions === 'LR' || positions === 'LM' && side === 'left' || positions === 'RM' && side === 'right')
          assert.equal(result[side].scale, short ? 0.6 : 1)
        }
      })
    }
  }
}
for (const action of [2, 3, 4]) {
  for (const distance of [2.49, 2.5, 2.51, 5]) {
    test(`人近风柔 动作${action} 距离${distance}`, () => {
      const result = resolve(3, 'LMR', action, distance)
      const low = action === 4 || distance <= 2.5
      assert.equal(result.speed, low ? 2 : 4)
      assert.equal(result.left.image, low ? 'L_LSmallWeak.png' : 'L_LStrong.png')
      assert.equal(result.right.image, low ? 'R_RSmallWeak.png' : 'R_RStrong.png')
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
