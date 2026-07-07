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
export function buildNearestRadarPersonRows(
  kptsList,
  trackIds,
  roomDepth,
  maxRows = 3,
  floorOriginXZ = null,
  trackPositions = [],
  distancesToRadar = []
) {
  const ox = floorOriginXZ != null && Number.isFinite(floorOriginXZ.x) ? floorOriginXZ.x : 0
  const oz = floorOriginXZ != null && Number.isFinite(floorOriginXZ.z) ? floorOriginXZ.z : 0
  const kptsCount = Array.isArray(kptsList) ? kptsList.length : 0
  const posCount = Array.isArray(trackPositions) ? trackPositions.length : 0
  const distCount = Array.isArray(distancesToRadar) ? distancesToRadar.length : 0
  const trackCount = Array.isArray(trackIds) ? trackIds.length : 0
  const n = trackCount > 0 ? trackCount : Math.max(kptsCount, posCount, distCount)
  if (n === 0) return []
  const rows = []
  for (let index = 0; index < n; index++) {
    const trackId = Array.isArray(trackIds) && trackIds[index] != null ? trackIds[index] : index
    const personData = Array.isArray(kptsList) ? kptsList[index] : null
    let point = null
    if (personData && typeof personData === "object") {
      const jointPoint = kptJointToSceneXZ(personData, 0, roomDepth)
      if (Number.isFinite(jointPoint.x) && Number.isFinite(jointPoint.z)) point = jointPoint
    }
    if (!point && Array.isArray(trackPositions)) {
      const pos = trackPositions[index]
      if (Array.isArray(pos)) {
        const x = Number(pos[0]) - roomDepth / 2
        const z = -Number(pos[1])
        if (Number.isFinite(x) && Number.isFinite(z)) point = { x, z }
      }
    }
    const distanceFromField = Array.isArray(distancesToRadar) ? Number(distancesToRadar[index]) : NaN
    if (!point && !Number.isFinite(distanceFromField)) continue
    const dx = point ? point.x - ox : 0
    const dz = point ? point.z - oz : 0
    const distanceM = point ? horizontalDistanceFromOriginXZ(dx, dz) : distanceFromField
    const angel = point ? horizontalAngleDegFromXZ(dx, dz) : null
    rows.push({ trackId, distanceM, angel, sortKey: distanceM, sourceIndex: index })
  }
  rows.sort((a, b) => a.sortKey - b.sortKey)
  return rows
    .slice(0, maxRows)
    .map(({ trackId, distanceM, angel, sourceIndex }) => ({ trackId, distanceM, angel, sourceIndex }))
}
