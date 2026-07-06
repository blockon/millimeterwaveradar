const appTarget = import.meta.env.VITE_APP_TARGET || 'web'

export const isApkTarget = appTarget === 'apk'

export const enableDebugLogs =
  import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true' ||
  (!isApkTarget && import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'false')

export function debugLog(...args) {
  if (enableDebugLogs) console.log(...args)
}

export function highFrequencyLog(...args) {
  if (enableDebugLogs) console.log(...args)
}
