const RADAR_BASE_URL = import.meta.env.VITE_RADAR_HTTP_BASE || 'https://mmradar.inchitech.com'

// 直接从 env 取值，不依赖 tree-shake
const RADAR_WS_PATH = import.meta.env.VITE_RADAR_WS_URL || 'wss://mmradar.inchitech.com/v2/ws/'
const LOGIN_API_PATH = import.meta.env.VITE_RADAR_LOGIN_URL || `${RADAR_BASE_URL}/api/manage/user/loginWeb`
// 网页端通过 Vite 代理绕过 CORS，原生直连
const LOGIN_API_PROXY = '/radar-api/api/manage/user/loginWeb'
const LOCAL_WEB_HOSTS = ['localhost', '127.0.0.1', '::1']
const IS_LOCAL_WEB_HOST = typeof window !== 'undefined' && LOCAL_WEB_HOSTS.includes(window.location.hostname)
const LOGIN_API_RUNTIME = import.meta.env.MODE === 'dev' || IS_LOCAL_WEB_HOST ? LOGIN_API_PROXY : LOGIN_API_PATH

export const RADAR_WS_URL = RADAR_WS_PATH
export const AUTH_API = {
  LOGIN_PASSWORD: LOGIN_API_PATH,
  LOGIN_PASSWORD_PROXY: LOGIN_API_PROXY,
  LOGIN_PASSWORD_FOR_RUNTIME: LOGIN_API_RUNTIME,
}
