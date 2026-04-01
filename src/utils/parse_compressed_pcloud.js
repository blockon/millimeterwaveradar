/**
 * 解析压缩的点云数据
 * @param {string} hexStr 十六进制字符串（小端序）
 * @param {number} axisPerPoint 每点字段数，默认5 [x,y,z,v,p]
 * @returns {Array<Array<number>>}
 */
export function parseCompressedPcloud(hexStr, axisPerPoint = 5) {
  if (!hexStr) return []

  try {
    const rawBytes = hexToBytes(hexStr)
    const bytesPerPoint = axisPerPoint * 2

    if (rawBytes.length % bytesPerPoint !== 0) {
      throw new Error(`数据长度错误: ${rawBytes.length} bytes，应为 ${bytesPerPoint} 的倍数`)
    }

    const arr = new Int16Array(rawBytes.buffer)
    const xyz = []

    for (let i = 0; i < arr.length; i += axisPerPoint) {
      const point = []
      for (let j = 0; j < axisPerPoint; j++) {
        point.push(arr[i + j] / 1000.0)
      }
      xyz.push(point)
    }

    return xyz
  } catch (error) {
    console.error(`解析点云数据失败: ${error.message}`)
    return []
  }
}

function hexToBytes(hexStr) {
  if (hexStr.length % 2 !== 0) hexStr = `0${hexStr}`

  const bytes = new Uint8Array(hexStr.length / 2)
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16)
  }
  return bytes
}
