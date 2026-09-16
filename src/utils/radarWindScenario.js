/** 60GHz 新需求：姿态决定风速，功能模式始终由设备状态决定。 */
export const WIND_MODE_LABELS = Object.freeze({ 1: '风随人动', 2: '风避人吹', 3: '人近风柔' })
export const WIND_MODE_FIELDS = Object.freeze({ 1: 'radarWindFollowPeople', 2: 'radarWindAvoidPeople', 3: 'radarPeopleNearSoftWind' })

/** CHS 雷达专用播报：按功能模式和目标风速匹配。 */
export const WIND_BROADCAST_IDS = Object.freeze({
  1: Object.freeze({ 2: 65010, 4: 65011 }), // 风随人动：低风、高风
  2: Object.freeze({ 2: 65008, 4: 65009 }), // 风避人吹：低风、高风
  3: Object.freeze({ 2: 65012, 4: 65013 }), // 人近风柔：低风、高风
})

export function reportedWindMode(current, report) {
  const enabled = Object.keys(WIND_MODE_FIELDS).find(mode => report[WIND_MODE_FIELDS[mode]] == 1)
  if (enabled) return Number(enabled)
  return report[WIND_MODE_FIELDS[current]] == 0 ? 0 : current
}

// 保持现有雷达视角：160°～200°为中间，超过200°为左侧。
export function radarWindZone(angle) {
  if (typeof angle !== 'number' || !Number.isFinite(angle)) return null
  if (angle >= 160 && angle <= 200) return 'middle'
  return angle > 180 ? 'left' : 'right'
}

const beam = (side, direction, strength, short = false) => ({
  image: `${side}_${direction}${short && side === direction && strength === 'Weak' ? 'Small' : ''}${strength}.png`,
  // 外侧短弱风有原图，其余短风以出风口为中心缩短。
  scale: short && !(side === direction && strength === 'Weak') ? 0.6 : 1,
})

/** targets 按距离升序，最多三人；未识别姿态/位置时不推断控制命令。 */
export function resolveRadarWind({ mode, targets, action, distanceM }) {
  mode = Number(mode)
  if (!WIND_MODE_LABELS[mode] || !targets.length || ![2, 3, 4].includes(action)) return null
  const sitting = action === 4
  if (mode === 3 && !sitting && (typeof distanceM !== 'number' || !Number.isFinite(distanceM))) return null
  const speed = sitting || (mode === 3 && distanceM <= 2.5) ? 2 : 4
  const strength = speed === 2 ? 'Weak' : 'Strong'
  const pair = (left, right, leftStrength = strength, rightStrength = strength, leftShort = false, rightShort = false) => ({
    speed, left: beam('L', left, leftStrength, leftShort), right: beam('R', right, rightStrength, rightShort),
  })
  if (mode === 3) return pair('L', 'R', strength, strength, speed === 2, speed === 2)
  const zones = new Set(targets.slice(0, 3).map(target => radarWindZone(target.angel)))
  if (zones.has(null)) return null
  const left = zones.has('left'), right = zones.has('right'), middle = zones.has('middle')
  if (mode === 1) {
    if (left && right) return middle ? pair('M', 'M') : pair('L', 'R')
    return left ? pair('L', 'L') : right ? pair('R', 'R') : pair('M', 'M')
  }
  if (left && right) return middle ? pair('M', 'M') : pair('M', 'M', 'Weak', 'Weak', true, true)
  if (!left && !right) return pair('L', 'R', 'Weak', 'Weak', true, true)
  if (left) return pair('R', 'R', strength, sitting && !middle ? 'Strong' : strength, middle, false)
  return pair('L', 'L', sitting && !middle ? 'Strong' : strength, strength, false, middle)
}
