const RADAR_BASE_URL = import.meta.env.VITE_RADAR_HTTP_BASE || 'https://mmradar.inchitech.com'

// 直接从 env 取值，不依赖 tree-shake
const RADAR_WS_PATH = import.meta.env.VITE_RADAR_WS_URL || 'wss://mmradar.inchitech.com/v2/ws/'
const LOGIN_API_PATH = import.meta.env.VITE_RADAR_LOGIN_URL || `${RADAR_BASE_URL}/api/manage/user/loginWeb`

export const RADAR_WS_URL = RADAR_WS_PATH
export const AUTH_API = {
  LOGIN_PASSWORD: LOGIN_API_PATH,
}
