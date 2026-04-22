import { useViteDevProxy } from '@/config/deviceApi'

const RADAR_BASE_URL = import.meta.env.VITE_RADAR_HTTP_BASE || 'https://mmradar.inchitech.com'

export const RADAR_WS_URL = useViteDevProxy()
  ? '/radar-ws/v2/ws/'
  : 'wss://mmradar.inchitech.com/v2/ws/'

export const AUTH_API = {
  LOGIN_PASSWORD: useViteDevProxy()
    ? '/radar-api/api/manage/user/loginWeb'
    : `${RADAR_BASE_URL}/api/manage/user/loginWeb`,
}
