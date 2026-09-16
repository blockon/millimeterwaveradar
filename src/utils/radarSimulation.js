import { COCO_SKELETON_EDGES } from '../constants/cocoKpts.js'

// 区域可重复：包含双人/三人同区，共 20 种无序占位组合（含无人）。
const combinations = [[]]
function addCombinations(prefix, start, remaining) {
  if (!remaining) { combinations.push(prefix); return }
  for (let i = start; i < 3; i++) addCombinations([...prefix, ['L', 'M', 'R'][i]], i, remaining - 1)
}
for (let count = 1; count <= 3; count++) addCombinations([], 0, count)
export const OCCUPANCY_PRESETS = combinations.map(zones => ({
  zones, label: zones.length ? `${zones.length}人 · ${zones.map(z => ({ L: '左', M: '中', R: '右' })[z]).join(' / ')}` : '无人',
}))
const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) && value !== ''
  ? Math.min(max, Math.max(min, Number(value))) : fallback

const ROOM = Object.freeze({ width: 5, depth: 5 })
const RADAR = Object.freeze({ radarX_room: 0, radarY_room: 0, radarHeight: 2.2, radarAzimuth_room: 90 })

// 与真实数据共用安装参数；null/空串不能作为有效的零值。
export function simulationEnvironment(radarParams = {}, roomConfig = {}) {
  const number = (value, fallback) => value != null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : fallback
  const depth = number(roomConfig.depth, ROOM.depth)
  const width = number(roomConfig.width, ROOM.width)
  return {
    roomConfig: { width: width > 0 ? width : ROOM.width, depth: depth > 0 ? depth : ROOM.depth },
    radarParams: { ...radarParams, ...Object.fromEntries(Object.entries(RADAR).map(([key, fallback]) => [key, number(radarParams[key], fallback)])) },
  }
}

export function buildSimulationFrame(people, tick = 0, environment = simulationEnvironment()) {
  const frame = { trackIds: [], kpts: [], positions: [], distances: [], actions: [], pointCloud: [],
    roomConfig: environment.roomConfig, radarParams: environment.radarParams }
  people.slice(0, 3).forEach((person, index) => {
    const phase = tick ? Math.sin(tick + index) : 0
    // angle 是相对雷达正前方的偏角，而非写死的世界坐标角度。
    const offset = clamp(clamp(person.angle, -60, 60, 0) + phase * 50, -60, 60, 0)
    const forward = 180 - frame.radarParams.radarAzimuth_room
    const angle = forward + offset
    const distance = clamp(clamp(person.distance, 0.5, 5, 3) + phase * 0.8, 0.5, 5, 3)
    const x = Math.sin(angle * Math.PI / 180) * distance + frame.radarParams.radarY_room
    const y = frame.radarParams.radarX_room - Math.cos(angle * Math.PI / 180) * distance
    const seated = Number(person.action) === 4
    const moving = Number(person.action) === 3
    // COCO 17 点；头部水平位置为目标中心，保证距离与排序一致。
    const joints = [[0,0,1.7],[-.04,0,1.75],[.04,0,1.75],[-.09,0,1.7],[.09,0,1.7],
      [-.2,0,1.45],[.2,0,1.45],[-.3,0,1.18],[.3,0,1.18],[-.32,0,.95],[.32,0,.95],
      [-.13,0,.95],[.13,0,.95],[-.13,0,.5],[.13,0,.5],[-.13,0,.08],[.13,0,.08]]
    if (seated) joints.forEach((joint, i) => { if (i < 13) joint[2] -= .45; else joint[1] = .35 })
    if (moving) { joints[7][2] = 1.7; joints[9][2] = 1.95; joints[9][0] -= .12 * Math.sin(tick) }
    // 人体朝向随安装朝向旋转，脚底固定在场景地面。
    const rad = forward * Math.PI / 180
    const world = joints.map(([dx, dy, z]) => [
      x + dx * Math.cos(rad) + dy * Math.sin(rad),
      y + dx * Math.sin(rad) - dy * Math.cos(rad), z - .05,
    ])
    frame.trackIds.push(index + 1)
    // 骨架和点云渲染都会给高度 +1；两者使用同一输入高度基准。
    frame.kpts.push([0, 1, 2].map(axis => world.map(joint => joint[axis] - (axis === 2 ? 1 : 0))))
    frame.positions.push([x, y])
    frame.distances.push(distance)
    frame.actions.push(Number(person.action))
    // 点云渲染器会给高度 +1，这里按其输入格式反向换算。
    for (const [a, b] of COCO_SKELETON_EDGES) {
      for (let sample = 0; sample < 24; sample++) {
        const t = sample / 23, noise = (sample + index * 7) * 2.39996
        frame.pointCloud.push([
          world[a][0] * (1 - t) + world[b][0] * t + Math.cos(noise) * .07,
          world[a][1] * (1 - t) + world[b][1] * t + Math.sin(noise) * .07,
          world[a][2] * (1 - t) + world[b][2] * t - 1, 0, 1,
        ])
      }
    }
  })
  return frame
}
