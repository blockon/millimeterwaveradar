const isDev = import.meta.env.DEV
const RADAR_BASE_URL = "https://mmradar.inchitech.com"

export const RADAR_WS_URL = isDev ? "/radar-ws/v2/ws/" : "wss://mmradar.inchitech.com/v2/ws/"

export const AUTH_API = {
  LOGIN_PASSWORD: isDev ? "/radar-api/api/manage/user/loginWeb" : `${RADAR_BASE_URL}/api/manage/user/loginWeb`,
}
