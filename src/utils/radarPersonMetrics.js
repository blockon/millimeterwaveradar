/**
 * 与 StickmanScene.kptToScene 一致：关节 i 的场景水平坐标 (x, z)。
 */
export function kptJointToSceneXZ(personData, jointIndex, roomDepth) {
  const x = Number(personData?.[0]?.[jointIndex]) - roomDepth / 2
  const z = -Number(personData?.[1]?.[jointIndex])
  return { x, z }
}

export function horizontalDistanceFromOriginXZ(x, z) {
  return Math.sqrt(x * x + z * z)
}

/** 与 StickmanScene.updateRadarModel 中 floorOrigin 的 xz 一致，扇形地面圆心 */
export function getFloorOriginXZFromRadarParams(radarParams, roomDepth) {
  const depth = Number(roomDepth)
  const d = Number.isFinite(depth) && depth > 0 ? depth : 5
  if (!radarParams || typeof radarParams !== "object") {
    return { x: 0, z: 0 }
  }
  const radarX = parseFloat(radarParams.radarX_room ?? radarParams.radarXroom) || 0
  const radarY = parseFloat(radarParams.radarY_room ?? radarParams.radarYroom) || 0
  return {
    x: radarY - d / 2,
    z: -radarX,
  }
}

export function horizontalAngleDegFromXZ(x, z) {
  let deg = (Math.atan2(x, z) * 180) / Math.PI
  if (deg < 0) deg += 360
  return Math.round(deg)
}

export function formatTrackIdForHeatItem(trackId) {
  const id = Number(trackId)
  if (!Number.isFinite(id)) return String(trackId)
  return id >= 9 ? String(id) : `0${id}`
}

/**
 * @param {{ x?: number, z?: number }|null} floorOriginXZ 雷达地面投影（扇形圆心）；缺省为场景原点
 */
export function buildNearestRadarPersonRows(kptsList, trackIds, roomDepth, maxRows = 3, floorOriginXZ = null) {
  const ox = floorOriginXZ != null && Number.isFinite(floorOriginXZ.x) ? floorOriginXZ.x : 0
  const oz = floorOriginXZ != null && Number.isFinite(floorOriginXZ.z) ? floorOriginXZ.z : 0
  if (!Array.isArray(kptsList) || kptsList.length === 0) return []
  const rows = []
  const n = kptsList.length
  for (let index = 0; index < n; index++) {
    const personData = kptsList[index]
    if (!personData || typeof personData !== "object") continue
    const trackId = Array.isArray(trackIds) && trackIds[index] != null ? trackIds[index] : index
    const { x, z } = kptJointToSceneXZ(personData, 0, roomDepth)
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue
    const dx = x - ox
    const dz = z - oz
    const distanceM = horizontalDistanceFromOriginXZ(dx, dz)
    const angel = horizontalAngleDegFromXZ(dx, dz)
    rows.push({ trackId, distanceM, angel, sortKey: distanceM, sourceIndex: index })
  }
  rows.sort((a, b) => a.sortKey - b.sortKey)
  return rows
    .slice(0, maxRows)
    .map(({ trackId, distanceM, angel, sourceIndex }) => ({ trackId, distanceM, angel, sourceIndex }))
}
