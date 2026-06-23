// 构建时 import.meta.env.DEV 被 Vite 替换为 false，esbuild 可正确 tree-shake
export const IS_DEV_PROXY = import.meta.env.DEV

function parseDeviceApiBaseMap() {
  const raw = import.meta.env.VITE_DEVICE_API_BASE_MAP
  if (!raw || typeof raw !== 'string') return {}
  try {
    const o = JSON.parse(raw)
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

export function resolveDeviceApiBase(deviceIp) {
  const map = parseDeviceApiBaseMap()
  const ip =
    String(deviceIp || '').trim() || String(import.meta.env.VITE_LOCAL_DEVICE_HOST || '').trim()
  if (ip && Object.prototype.hasOwnProperty.call(map, ip)) {
    const u = map[ip]
    if (u) return String(u).replace(/\/$/, '')
  }
  if (ip) {
    const port = String(import.meta.env.VITE_LOCAL_DEVICE_PORT || '8089').trim()
    return `http://${ip}:${port}`
  }
  const full = String(import.meta.env.VITE_LOCAL_DEVICE_API_BASE || '').trim().replace(/\/$/, '')
  if (full) return full
  return ''
}

export function getDataHttpBase(deviceLanHost) {
  if (IS_DEV_PROXY) return ''
  return resolveDeviceApiBase(deviceLanHost)
}
