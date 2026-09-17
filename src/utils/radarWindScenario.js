import { RADAR_VIEW_AZIMUTH_DEG } from '../rendering/radarView.js'

/** 60GHz 新需求：具体场景优先决定风速，功能模式始终由设备状态决定。 */
export const WIND_MODE_LABELS = Object.freeze({ 1: '风随人动', 2: '风避人吹', 3: '人近风柔' })
export const WIND_MODE_FIELDS = Object.freeze({ 1: 'radarWindFollowPeople', 2: 'radarWindAvoidPeople', 3: 'radarPeopleNearSoftWind' })

/** CHS 雷达专用播报：按功能模式和目标风速匹配。 */
export const WIND_BROADCAST_IDS = Object.freeze({
  1: Object.freeze({ 2: 65010, 4: 65011 }), // 风随人动：低风、高风
  2: Object.freeze({ 2: 65008, 4: 65009 }), // 风避人吹：低风、高风
  3: Object.freeze({ 2: 65012, 4: 65013 }), // 人近风柔：低风、高风
})

/**
 * 视线前后轴两侧各 20° 视为中间区。这条边界同时是摆叶摆幅的起始角：
 * 中间区一律发 50，出了中间区才按偏角往两侧加档。
 */
export const WIND_ZONE_MIDDLE_HALF_WIDTH_DEG = 20

/**
 * 空调正前方方位角。雷达安装方位角默认 90°（见 `radarSimulation.js` 的 `RADAR.radarAzimuth_room`），
 * 正前方是它的反向 `180 - 90 = 90`，与仿真的 `forward` 一致。
 * ⚠️ 换安装方位角时这里要跟着改（或把 `radarParams.radarAzimuth_room` 传进来）。
 */
export const WIND_FRONT_BEARING_DEG = 90

/**
 * 偏角达到 60° 即发满偏（左 100 / 右 0），20°~60° 之间取中间档。
 * 60° 取自点云模拟的偏角上限（`radarSimulation.js` 把偏角 clamp 到 ±60°），
 * 这样 ±40° 的预设站位落在中间档、运动模拟扫到 ±60° 才满偏。
 * 实机观察后想让摆叶更早满偏就调小这个值，想更平缓就调大。
 */
export const WIND_POSITION_FULL_DEFLECTION_DEG = 60

/** 相邻两档的刻度差；摆幅最多跨两档，即 50 与 50±50。 */
export const WIND_POSITION_STEP = 25

/** 摆幅档数：正前到满偏之间跨 0 / 1 / 2 档。 */
const WIND_SWING_STEPS = 2

/** 摆叶位置五档刻度：正前 50，往左 75 / 100，往右 25 / 0。 */
export const WIND_POSITION_LEVELS = Object.freeze([0, 1, 2, 3, 4].map(index => index * WIND_POSITION_STEP))

export function reportedWindMode(current, report) {
  const enabled = Object.keys(WIND_MODE_FIELDS).find(mode => report[WIND_MODE_FIELDS[mode]] == 1)
  if (enabled) return Number(enabled)
  return report[WIND_MODE_FIELDS[current]] == 0 ? 0 : current
}

// 按固定视角投影分区：视线前后轴的左右各 20°均属于画面中间。
export function radarWindZone(angle) {
  if (typeof angle !== 'number' || !Number.isFinite(angle)) return null
  angle = ((angle - RADAR_VIEW_AZIMUTH_DEG) % 360 + 360) % 360
  const half = WIND_ZONE_MIDDLE_HALF_WIDTH_DEG
  if (angle <= half || angle >= 360 - half || (angle >= 180 - half && angle <= 180 + half)) return 'middle'
  return angle > 180 ? 'left' : 'right'
}

/** 正前方为 0，带符号偏角：正数偏画面左侧，负数偏右侧，单位度。 */
export function radarWindDeflectionDeg(angle) {
  if (typeof angle !== 'number' || !Number.isFinite(angle)) return null
  const delta = ((WIND_FRONT_BEARING_DEG - angle) % 360 + 360) % 360
  return delta > 180 ? delta - 360 : delta
}

/**
 * 相对正前的摆幅档位 0 / 25 / 50，落在五档刻度上取最近一档。
 * 偏角在中间区边界内为 0，到满偏角为止；拿不到偏角时按满偏处理，
 * 避免缺数据时悄悄把风收成中间风。
 */
export function radarWindSwingAmount(deflectionDeg) {
  const deg = Number(deflectionDeg)
  const known = deflectionDeg != null && Number.isFinite(deg)
  const over = known ? Math.max(Math.abs(deg) - WIND_ZONE_MIDDLE_HALF_WIDTH_DEG, 0) : Infinity
  const span = WIND_POSITION_FULL_DEFLECTION_DEG - WIND_ZONE_MIDDLE_HALF_WIDTH_DEG
  const ratio = span > 0 ? Math.min(over / span, 1) : 1
  // 比例取最近一档，避免摆幅在档位之间来回跳。
  return Math.min(Math.round(WIND_SWING_STEPS * ratio), WIND_SWING_STEPS) * WIND_POSITION_STEP
}

const beam = (side, direction, strength, short = false, deflectionDeg = Infinity, minSwing = 0) => ({
  // 两组大摆叶刻度相反；图片与设备定位共用同一个方向。
  // 摆幅由偏角决定，吹向仍由图片的 L/M/R 决定：方向为正前时摆幅取 0，落在 50。
  position: 50 + (side === direction ? 1 : -1) * (direction === 'M' ? 0 : Math.max(minSwing, radarWindSwingAmount(deflectionDeg))),
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
  // 摆幅由该侧最近一人的偏角决定；不传即满偏，等价于只有 0/50/100 三档的旧行为。
  const pair = (left, right, {
    leftStrength = strength, rightStrength = strength,
    leftShort = false, rightShort = false,
    leftDeflection = Infinity, rightDeflection = Infinity,
    minSwing = 0,
  } = {}) => ({
    speed,
    left: beam('L', left, leftStrength, leftShort, leftDeflection, minSwing),
    right: beam('R', right, rightStrength, rightShort, rightDeflection, minSwing),
  })
  if (mode === 3) return pair('L', 'R', { leftShort: speed === 2, rightShort: speed === 2 })
  const rows = targets.slice(0, 3).map(target => ({ target, zone: radarWindZone(target.angel) }))
  if (rows.some(row => row.zone === null)) return null
  const zones = new Set(rows.map(row => row.zone))
  const left = zones.has('left'), right = zones.has('right'), middle = zones.has('middle')
  const deflectionOf = zone => radarWindDeflectionDeg(rows.find(row => row.zone === zone)?.target.angel)
  const leftDeg = deflectionOf('left'), rightDeg = deflectionOf('right')
  if (mode === 1) {
    if (left && right) {
      return middle
        ? pair('M', 'M')
        : pair('L', 'R', { leftDeflection: leftDeg, rightDeflection: rightDeg })
    }
    if (left) return pair('L', 'L', { leftDeflection: leftDeg, rightDeflection: leftDeg })
    if (right) return pair('R', 'R', { leftDeflection: rightDeg, rightDeflection: rightDeg })
    return pair('M', 'M')
  }
  // 具体场景的短弱风优先于站立/挥拳的通用高风规则，整机也使用低风。
  if (left && right) {
    return middle
      ? pair('M', 'M')
      : { ...pair('M', 'M', { leftStrength: 'Weak', rightStrength: 'Weak', leftShort: true, rightShort: true }), speed: 2 }
  }
  if (!left && !right) {
    return { ...pair('L', 'R', { leftStrength: 'Weak', rightStrength: 'Weak', leftShort: true, rightShort: true }), speed: 2 }
  }
  if (left) {
    return pair('R', 'R', {
      // 避人至少偏转一档，避免边界附近取整为正前方而吹向中间的人。
      minSwing: WIND_POSITION_STEP,
      leftDeflection: leftDeg, rightDeflection: leftDeg,
      rightStrength: sitting && !middle ? 'Strong' : strength, leftShort: middle,
    })
  }
  return pair('L', 'L', {
    minSwing: WIND_POSITION_STEP,
    leftDeflection: rightDeg, rightDeflection: rightDeg,
    leftStrength: sitting && !middle ? 'Strong' : strength, rightShort: middle,
  })
}
