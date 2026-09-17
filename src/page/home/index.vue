<!--
 * @Author: chuan.wang chuan.wang@changhong.com
 * @Date: 2022-12-20 10:42:19
 * @LastEditors: chuan.wang chuan.wang@changhong.com
 * @LastEditTime: 2024-03-21 17:32:43
 * @FilePath: \MeilingSmartHome-NewOperationd:\虹美公司\project\2023\MillimeterWaveRadar\src\page\home\index.vue
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
-->
<template>
  <!-- 左边-空调摆风区域 -->
  <div class="home_page mid">
    <button class="radar_settings_btn" @click="showLoginPanel = true">设置</button>
    <button class="radar_test_btn" @click="showTestPanel = !showTestPanel">测试</button>

    <div v-if="showLoginPanel" class="radar_control_mask">
      <div class="radar_control_panel">
        <button class="control_close_btn" @click="showLoginPanel = false">×</button>
        <div class="control_title">雷达连接设置</div>
        <input v-model.trim="radarLoginForm.username" class="control_input" placeholder="用户名/手机号" />
        <input v-model="radarLoginForm.password" class="control_input" type="password" placeholder="密码" />
        <input v-model.trim="radarLoginForm.sn" class="control_input" placeholder="设备SN" />
        <input v-model.trim="radarLoginForm.deviceId" class="control_input" placeholder="雷达设备ID" />
        <input v-model.trim="radarLoginForm.mqttCid" class="control_input" placeholder="MQTT CID" />
        <div class="control_actions">
          <button class="control_btn" :disabled="loginLoading || radarConnecting" @click="handleLoginAndConnect">
            {{ loginLoading ? '登录中...' : radarConnecting ? '连接中...' : '登录并展示' }}
          </button>
        </div>
        <div class="control_status" :class="{ error: radarError }">
          {{ radarError || (liveRadarConnected ? '已连接，数据实时展示中' : '未连接') }}
        </div>
      </div>
    </div>

    <div v-if="simulationEnabled" class="simulation_badge">
      模拟中 · {{ radarActionLabel }} · {{ radarPersonCount }}人
      <button @click="showTestPanel = true">调整场景</button>
      <button @click="toggleSimulation">退出模拟</button>
    </div>
    <!-- 指令测试面板 -->
    <div v-if="showTestPanel" class="radar_control_mask">
      <div class="radar_control_panel test_panel">
        <button class="control_close_btn" @click="showTestPanel = false">×</button>
        <div class="control_title">功能与点云测试</div>
        <div class="simulation_controls">
          <button @click="toggleSimulation">{{ simulationEnabled ? '退出模拟，恢复实时数据' : '开启点云模拟' }}</button>
          <p>{{ simulationEnabled ? '模拟中：摆叶和整机风速指令输出到控制台，无需连接设备。关闭面板可查看完整画面。' : '开启模拟后可离线预览全部人员占位场景。' }}</p>
          <template v-if="simulationEnabled">
            <label>占位预设
              <select v-model="simulationPreset" @change="applySimulationPreset(OCCUPANCY_PRESETS[Number($event.target.value)])">
                <option disabled value="">请选择（支持全部 0～3 人组合）</option>
                <option v-for="(preset, index) in OCCUPANCY_PRESETS" :key="preset.label" :value="index">{{ preset.label }}</option>
              </select>
            </label>
            <div v-for="(person, index) in simulationPeople" :key="index" class="simulation_person">
              <strong>人员 {{ index + 1 }}</strong>
              <label>相对雷达正前方 {{ person.angle }}°（负值向左 / 正值向右）
                <input v-model.number="person.angle" type="range" min="-60" max="60" step="1" />
              </label>
              <label>距离（米）<input v-model.number="person.distance" type="number" min="0.5" max="5" step="0.01" /></label>
              <div class="simulation_distances"><button v-for="distance in [2.49, 2.5, 2.51]" :key="distance" @click="person.distance = distance">{{ distance }}m</button></div>
              <label>姿态<select v-model.number="person.action"><option :value="2">站立</option><option :value="3">挥手 / 运动</option><option :value="4">坐姿</option><option :value="0">未识别</option></select></label>
            </div>
            <label><input v-model="simulationMotion" type="checkbox" />自动左右移动、靠近及远离</label>
            <p>风速由最近人员决定；当前：{{ radarWindPlan ? windSpeedArr[radarWindPlan.speed] : '无有效联动目标' }}</p>
            <button @click="showTestPanel = false">查看模拟画面</button>
          </template>
        </div>
        <div class="test_status" :class="{ connected: mqttConnected }">
          MQTT: {{ mqttConnected ? '已连接' : '未连接' }}
        </div>
        <div class="test_buttons">
          <div v-for="item in testScenarios" :key="item.key" class="test_row">
            <span class="test_label">{{ item.label }}</span>
            <span class="test_hint">{{ item.hint }}</span>
            <button class="test_send_btn" @click="handleTestSend(item.key)">{{ simulationEnabled ? '预览' : '发送' }}{{ item.label }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="page_left center">
      <!-- 风速 -->
      <div class="wind_speed_num">
        <img
          class="running_anticlockwise"
          :style="`animation-duration:${Math.abs(6 - displayWindSpeed)}s`"
          :src="powerState"
          :class="{ noScan: devData.power == 0 }" />
        <div class="powertext center">
          <div class="wind_speed_str">{{ devData.power ? '开机' : '关机' }}</div>
          <div class="wind_speed_hint" v-if="devData.power">{{ devData.set_temper / 10 }}℃ | {{ windSpeedArr[displayWindSpeed] }}</div>
        </div>
      </div>

      <!-- 摆风区域 -->
      <div ref="windAreaRef" class="wind_area">
        <img ref="deviceImageRef" class="img_pro" :src="devImg" />
        <div v-if="devData.power">
          <img v-if="windModeImgLeft" :src="windModeImgLeft" :style="windBeamStyle('left')" class="windAreaQuanYuBottom" :class="{ windAreaQuanYuBottomActive: windEffectActive }" />
          <img v-if="windModeImgRight" :src="windModeImgRight" :style="windBeamStyle('right')" class="windAreaQuanYuBottom" :class="{ windAreaQuanYuBottomActive: windEffectActive }" />
          <div class="windModeText">{{ radarActionLabel }}</div>
          <img src="@img/windModeBg.png" class="windModeBgImg" />
        </div>
        <!-- 网格区域 -->
        <div ref="sectorAreaRef" class="grid_area">
          <div class="radar_skeleton_layer">
            <ThreeStickmanView
              :kpts-data="displayKptsData"
              :track-ids="displayTrackIds"
              :point-cloud-data="emptyRadarData"
              :room-config="roomConfig"
              :radar-params="radarParams"
              :show-skeleton="true"
              :show-point-cloud="false"
              :show-sector-floor="true"
              :sector-floor-idle="radarNoPerson"
              :enable-controls="false"
              :fixed-view-aspect="1.25"
              skeleton-mode="stickman" />
          </div>
        </div>
      </div>
      <!-- 雷达点云小窗：位于左侧扇形场景右下角 -->
      <div class="radar_point_cloud_panel">
        <div class="dev"></div>
        <ThreeStickmanView
          :kpts-data="emptyRadarData"
          :track-ids="emptyRadarData"
          :point-cloud-data="latestPointCloud"
          :room-config="roomConfig"
          :radar-params="radarParams"
          :show-skeleton="false"
          :show-point-cloud="true"
          skeleton-mode="stickman" />
      </div>
    </div>
    <!-- 右边-人体状态感知参数区域 -->
    <div class="page_right center">
      <img class="img_title" src="@img/ic_title.png" />
      <!-- 热源数量 -->
      <div class="heat_num_area">
        <img class="running_clockwise" :src="peopleBg" />
        <img class="singleScan" :class="{ noScan: !rightPanelVisualActive }" :src="peopleScan" />
        <div class="heat_num_str" :class="{ powerOffState: !rightPanelVisualActive }">
          {{ rightPanelPersonLabel }}
        </div>
      </div>
      <!-- 未检测到人体 -->
      <div v-if="!hasRightPanelPeople" class="no_body">区域内暂未检测到人体</div>
      <!-- 雷达优先：有雷达人数时展示最近 3 人 -->
      <div v-else-if="radarConnected && nearestRadarTargets.length > 0" class="heat_list">
        <div class="heat_item mid" v-for="(item, index) in nearestRadarTargets" :key="`${item.trackId}-${index}`">
          <div class="itemLeft">{{ formatRadarRankByIndex(index) }}</div>
          <img src="@img/ic_map.png" class="itemMap" />
          <div class="itemAngel">{{ formatRadarRowAngle(item) }}</div>
          <div class="item_line"></div>
          <div class="itemDistance">{{ formatRadarRowDistance(item) }}</div>
        </div>
      </div>
      <!-- 空调侧热源列表（无雷达人数时） -->
      <div v-else-if="devData.power && devData.data_array.length > 0" class="heat_list">
        <div
          class="heat_item mid"
          v-for="(item, index) in devData.data_array.length > 6 ? devData.data_array.slice(0, 6) : devData.data_array"
          :key="index">
          <div class="itemLeft">{{ item.id >= 9 ? item.id : '0' + item.id }}</div>
          <img src="@img/ic_map.png" class="itemMap" />
          <div class="itemAngel">{{ item.angel }}°</div>
          <div class="item_line"></div>
          <div class="itemDistance">{{ item.distance / 100 }}m</div>
        </div>
      </div>
      <div class="tips">温馨提示：最多显示3个人</div>
    </div>

  </div>
</template>

<script setup>
import { P_8009369 } from '@/utils/analysis.js'
import ThreeStickmanView from '@/components/ThreeStickmanView.vue'
import { AUTH_API, RADAR_WS_URL } from '@/config/radarApi'
import { getDataHttpBase } from '@/config/deviceApi'
import sessionManager from '@/utils/login/sessionManager'
import { binaryToString } from '@/utils/binaryToString'
import { parseCompressedPcloud } from '@/utils/parse_compressed_pcloud'
import { buildNearestRadarPersonRows, getFloorOriginXZFromRadarParams } from '@/utils/radarPersonMetrics'
import { WIND_MODE_LABELS, WIND_MODE_FIELDS, WIND_BROADCAST_IDS, reportedWindMode, resolveRadarWind } from '@/utils/radarWindScenario'
import { debugLog, highFrequencyLog, isTvPerformanceMode } from '@/utils/debugLog'
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { showToast } from 'vant'
import { buildSimulationFrame, simulationEnvironment, OCCUPANCY_PRESETS } from '@/utils/radarSimulation'

const liveRadarTrackIds = ref([])
const liveLatestKpts = ref([])
const liveLatestTrackPositions = ref([])
const liveLatestDistancesToRadar = ref([])
const liveLatestActions = ref([])
const liveLatestPointCloud = ref([])
const liveRadarParams = ref({})
const liveRoomConfig = ref({ width: 5, depth: 5 })
const emptyRadarData = Object.freeze([])
const pointCloudParseStep = isTvPerformanceMode ? 2 : 1
const showLoginPanel = ref(false)
const showTestPanel = ref(false)
const radarLoginForm = reactive({
  username: localStorage.getItem('radarLoginUsername') || 'fengxia',
  password: localStorage.getItem('radarLoginPassword') || '1234567890',
  sn: localStorage.getItem('radarMqttSn') || 'D348010096TEST00RADAR623',
  deviceId: localStorage.getItem('radarDeviceId') || 'A1W2512K52T1ACKCVYTB',
  mqttCid: localStorage.getItem('mqttCid') || 'adc7d89ef6e04a20',
})
const deviceLanHost = ref(
  (localStorage.getItem('deviceLanHost') || import.meta.env.VITE_LOCAL_DEVICE_HOST || '').trim()
)
const liveRadarConnected = ref(false)
const radarConnecting = ref(false)
const radarError = ref('')
const loginLoading = ref(false)
let radarWs = null
let radarInitTimeoutId = null
let radarReconnectTimer = null
let radarReconnectAttempt = 0
let radarManualDisconnect = false
let lastPointCloudFrameAt = 0
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_BASE_DELAY = 1000
const POINT_CLOUD_STALE_MS = isTvPerformanceMode ? 3000 : 1200

const resetRadarState = () => {
  liveRadarTrackIds.value = []
  liveLatestKpts.value = []
  liveLatestTrackPositions.value = []
  liveLatestDistancesToRadar.value = []
  liveLatestActions.value = []
  liveLatestPointCloud.value = []
  lastPointCloudFrameAt = 0
  liveRadarParams.value = {}
  liveRoomConfig.value = { width: 5, depth: 5 }
}

const getRadarPointCloudHex = (data) => {
  if (typeof data?.rawpc === 'string' && data.rawpc !== '') return data.rawpc
  if (typeof data?.rawmmpc === 'string' && data.rawmmpc !== '') return data.rawmmpc
  return ''
}

const alignRadarFrameArray = (incoming, previous, previousTrackIds, nextTrackIds) => {
  if (!Array.isArray(nextTrackIds)) {
    return Array.isArray(incoming) ? incoming : previous
  }
  if (Array.isArray(incoming)) {
    return incoming.slice(0, nextTrackIds.length)
  }
  if (!Array.isArray(previous) || previous.length === 0) {
    return []
  }
  const oldIds = Array.isArray(previousTrackIds) ? previousTrackIds : []
  return nextTrackIds.map((trackId, index) => {
    const oldIndex = oldIds.findIndex((oldTrackId) => String(oldTrackId) === String(trackId))
    return oldIndex >= 0 ? previous[oldIndex] : previous[index]
  })
}

const connectRadarWs = (deviceId, token = '') => {
  if (!deviceId) {
    radarError.value = '请输入设备ID'
    return
  }
  // 清理旧连接
  if (radarWs) {
    radarWs.onclose = null
    radarWs.close()
    radarWs = null
  }
  radarManualDisconnect = false
  radarConnecting.value = true
  radarError.value = ''
  try {
    radarWs = new WebSocket(RADAR_WS_URL)
    radarWs.onopen = () => {
      debugLog(`[雷达] 已连接 (deviceId=${deviceId}, token=${token ? '有' : '无'})`)
      radarReconnectAttempt = 0
      liveRadarConnected.value = true
      radarConnecting.value = false
      const initData = {
        deviceID: deviceId,
        type: '2',
        session: Date.now().toString(),
        content: 'start',
        startTime: '',
        endTime: '',
        deviceID1: '',
        deviceID2: '',
        scene: '',
        multiradar: '',
        token,
      }
      radarInitTimeoutId = setTimeout(() => {
        radarInitTimeoutId = null
        if (radarWs && radarWs.readyState === WebSocket.OPEN) {
          radarWs.send(JSON.stringify(initData))
        }
      }, 500)
    }
    radarWs.onmessage = async (event) => {
      try {
        const raw = event.data
        const str = typeof raw === 'string' ? raw : await binaryToString(raw)
        const data = JSON.parse(str)
        // 只打印非 success 响应或有业务数据时
        if (data.code !== 200 || data.track_id || data.kpts) {
          // console.log('[雷达] 消息:', JSON.stringify(data).substring(0, 300))
        }
        if (Array.isArray(data.track_id)) {
          const previousTrackIds = liveRadarTrackIds.value
          const nextTrackIds = data.track_id
          liveRadarTrackIds.value = nextTrackIds
          liveLatestKpts.value = alignRadarFrameArray(data.kpts, liveLatestKpts.value, previousTrackIds, nextTrackIds)
          liveLatestTrackPositions.value = alignRadarFrameArray(
            data.track_pos,
            liveLatestTrackPositions.value,
            previousTrackIds,
            nextTrackIds,
          )
          liveLatestDistancesToRadar.value = Array.isArray(data.Dis2Radar)
            ? alignRadarFrameArray(data.Dis2Radar, liveLatestDistancesToRadar.value, previousTrackIds, nextTrackIds)
            : []
          liveLatestActions.value = alignRadarFrameArray(data.action, liveLatestActions.value, previousTrackIds, nextTrackIds)
        } else {
          if (Array.isArray(data.kpts)) liveLatestKpts.value = data.kpts
          if (Array.isArray(data.track_pos)) liveLatestTrackPositions.value = data.track_pos
          if (Array.isArray(data.Dis2Radar)) liveLatestDistancesToRadar.value = data.Dis2Radar
          if (Array.isArray(data.action)) liveLatestActions.value = data.action
        }
        const pointCloudHex = getRadarPointCloudHex(data)
        if (pointCloudHex) {
          const parsedPointCloud = parseCompressedPcloud(pointCloudHex, 5, pointCloudParseStep)
          if (parsedPointCloud.length > 0) {
            liveLatestPointCloud.value = parsedPointCloud
            lastPointCloudFrameAt = Date.now()
          }
        } else if (lastPointCloudFrameAt > 0 && Date.now() - lastPointCloudFrameAt > POINT_CLOUD_STALE_MS) {
          liveLatestPointCloud.value = []
          lastPointCloudFrameAt = 0
        }
        if (data.RadarParams) {
          const r = data.RadarParams
          liveRadarParams.value = {
            radarHeight: r.radarHeight ?? null,
            radarX_room: r.radarX_room ?? r.radarXroom ?? null,
            radarY_room: r.radarY_room ?? r.radarYroom ?? null,
            radarAzimuth_room: r.radarAzimuth_room ?? r.radarAzimuthroom ?? r.azimuth_room ?? null,
            downtAngle: r.downtAngle ?? null,
            radarRoll: r.radarRoll ?? null,
          }
          const dx = r.deltaX_room != null ? Number.parseFloat(r.deltaX_room) : null
          const dy = r.deltaY_room != null ? Number.parseFloat(r.deltaY_room) : null
          if (dx != null && dy != null) {
            liveRoomConfig.value = { width: dx, depth: dy }
          }
        }
      } catch (error) {
        console.error('radar ws parse error:', error)
      }
    }
    radarWs.onclose = (event) => {
      debugLog('[雷达] onclose:', { code: event.code, reason: event.reason, wasClean: event.wasClean })
      if (radarInitTimeoutId) {
        clearTimeout(radarInitTimeoutId)
        radarInitTimeoutId = null
      }
      radarWs = null
      liveRadarConnected.value = false
      radarConnecting.value = false
      resetRadarState()
      // 非主动断开则自动重连
      if (!radarManualDisconnect) {
        scheduleReconnect()
      }
    }
    radarWs.onerror = () => {
      console.warn('[雷达] onerror')
      // 不在此处 resetRadarState，onclose 会随后触发并处理
    }
  } catch (error) {
    console.error('radar ws connect error:', error)
    radarError.value = '雷达连接异常'
    liveRadarConnected.value = false
    radarConnecting.value = false
    // 构造阶段失败也触发重连
    if (!radarManualDisconnect) {
      scheduleReconnect()
    }
  }
}

const disconnectRadarWs = () => {
  radarManualDisconnect = true
  if (radarReconnectTimer) {
    clearTimeout(radarReconnectTimer)
    radarReconnectTimer = null
  }
  radarReconnectAttempt = 0
  if (radarInitTimeoutId) {
    clearTimeout(radarInitTimeoutId)
    radarInitTimeoutId = null
  }
  if (radarWs) {
    radarWs.onclose = null   // 先移除回调，避免异步触发重连
    radarWs.close()
    radarWs = null
  }
  liveRadarConnected.value = false
  radarConnecting.value = false
  resetRadarState()
}

const toSha256 = async (text) => {
  // 优先使用浏览器原生 crypto.subtle（需要 HTTPS 或 localhost）
  if (crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // 非安全上下文（如 HTTP 局域网访问）下使用纯 JS 后备方案
  const { sha256 } = await import('js-sha256')
  return sha256(text)
}

const scheduleReconnect = () => {
  if (radarReconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    radarError.value = '雷达重连失败，已达最大重试次数'
    console.warn('[雷达] 重连已达上限，停止重连')
    return
  }
  const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, radarReconnectAttempt), 30000)
  radarReconnectAttempt++
  debugLog(`[雷达] 将在 ${delay}ms 后第 ${radarReconnectAttempt} 次重连...`)
  radarReconnectTimer = setTimeout(() => {
    radarReconnectTimer = null
    const deviceId = radarLoginForm.deviceId.trim()
    const token = sessionManager.getToken() || ''
    if (deviceId) {
      connectRadarWs(deviceId, token)
    }
  }, delay)
}

const restartRadarWs = () => {
  const deviceId = radarLoginForm.deviceId.trim()
  const token = sessionManager.getToken() || ''
  disconnectRadarWs()
  debugLog(`[雷达] 重连 (token=${token ? '有' : '无'})`)
  connectRadarWs(deviceId, token)
}

// 用指定 SN 连接 MQTT（先断开旧连接）
const connectMqttWithSn = (sn) => {
  if (!sn) return
  const mqttCid = radarLoginForm.mqttCid.trim() || 'b448226a1b104435'
  deviceStore.disconnectMqtt()
  deviceStore.connectMqtt({ cid: mqttCid, deviceId: sn, secretKey: '' })
  // 根据 SN 下载设备专属协议，替换兜底的 P_8009369
  deviceStore.loadProtocolBySn(sn)
}

const handleLoginAndConnect = async () => {
  const username = radarLoginForm.username.trim()
  const password = radarLoginForm.password
  const deviceId = radarLoginForm.deviceId.trim()
  if (!username) {
    radarError.value = '请输入用户名'
    return
  }
  if (!password) {
    radarError.value = '请输入密码'
    return
  }
  if (!deviceId) {
    radarError.value = '请输入设备ID'
    return
  }
  loginLoading.value = true
  radarError.value = ''
  try {
    const hashedPassword = await toSha256(password)
    const isNative = Capacitor.isNativePlatform()
    // dev server/local static 走代理，线上网页直连；原生 HTTP 插件始终用完整 URL。
    const loginUrl = isNative ? AUTH_API.LOGIN_PASSWORD : AUTH_API.LOGIN_PASSWORD_FOR_RUNTIME
    debugLog('[雷达] 登录请求 (平台:', isNative ? '原生' : '网页', ') URL:', loginUrl)
    let res
    if (isNative) {
      res = await CapacitorHttp.request({
        method: 'POST',
        url: loginUrl,
        headers: { 'Content-Type': 'application/json' },
        data: { phone: username, password: hashedPassword },
      })
    } else {
      const fetchRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: username, password: hashedPassword }),
      })
      res = {
        status: fetchRes.status,
        data: await fetchRes.json(),
      }
    }
    debugLog('[雷达] 登录响应 status:', res.status, JSON.stringify(res.data).substring(0, 200))
    const data = res.data
    debugLog('[雷达] 登录结果:', data.code, data.message || '')
    if (data.code === 200) {
      localStorage.setItem('deviceLanHost', deviceLanHost.value.trim())
      const user = data.data || {}
      await sessionManager.setSession({
        user: {
          id: user.id,
          username: user.name,
          privileges: user.privileges,
          roles: user.roles || user.role,
        },
        sessionId: user.sessionId,
      })
      localStorage.setItem('radarLoginUsername', username)
      localStorage.setItem('radarLoginPassword', password)
      const sn = radarLoginForm.sn.trim()
      localStorage.setItem('radarMqttSn', sn)
      localStorage.setItem('radarDeviceId', radarLoginForm.deviceId.trim())
      localStorage.setItem('mqttCid', radarLoginForm.mqttCid.trim())
      showToast({ message: '登录成功', position: 'bottom' })
      showLoginPanel.value = false
      restartRadarWs()
      // 用新的 SN 重连 MQTT
      connectMqttWithSn(sn)
    } else {
      radarError.value = data.message || '登录失败'
    }
  } catch (error) {
    console.error(error)
    radarError.value = '登录请求失败'
  } finally {
    loginLoading.value = false
  }
}
const getImageUrl = (fullName) => {
  return new URL(`../../assets/imgs/${fullName}`, import.meta.url).href
}
const windSpeedArr = ['自动风', '微风', '低风', '中风', '高风', '强劲风']

let liveDevData = ref({
  json_seq: 2, //数据包编号，0~65535
  id_num: 2, //检测到的人数，0-3人
  data_array: [
    // {
    //   "id": 0,
    //   "angel": 90,   //角度，30-150°
    //   "distance": 200,   //距离，单位厘米，0-500cm
    // },
    // {
    //   "id": 1,
    //   "angel": 150,   //角度，30-150°
    //   "distance": 250,   //距离，单位厘米，0-500cm
    // }
  ],
  speed: 4, //风速，0:自动风，1：微风，2：低风，3中风，4：高风，5：强劲风
  // 扫风时绘制动画 风随人动和风逆人动动画停止，只绘制角度
  swing_mode: 0, //扫风方式，1：风随人动，2：风避人吹，3:人近风柔
  sleep_mode: 1, //睡眠模式，0：关闭，1：打开
  left_swing_area: 0, //左大摆叶：最左100，中间50，最右0
  right_swing_area: 0, //右大摆叶：最左0，中间50，最右100
  power: 1,
  set_temper: 263,
})

const simulationEnabled = ref(false)
const simulationMode = ref(1)
const simulationPreset = ref('')
const simulationPeople = ref([{ angle: 0, distance: 3, action: 2 }])
const simulationMotion = ref(false)
const simulationTick = ref(0)
const simulationFrameCounter = ref(0)
const simulationScene = computed(() => simulationEnvironment(liveRadarParams.value, liveRoomConfig.value))
const simulationFrame = computed(() => {
  simulationFrameCounter.value // 持续输出帧，让点云队列正常淘汰旧场景。
  return buildSimulationFrame(simulationPeople.value, simulationTick.value, simulationScene.value)
})
function applySimulationPreset(preset) {
  simulationMotion.value = false
  simulationTick.value = 0
  simulationPeople.value = preset.zones.map((zone, index) => ({
    angle: { L: -40, M: 0, R: 40 }[zone], distance: 2 + index * 0.65, action: 2,
  }))
  simulationEnabled.value = true
}
function toggleSimulation() {
  simulationEnabled.value = !simulationEnabled.value
  simulationMotion.value = false
  simulationTick.value = 0
}
const simulationTimer = setInterval(() => {
  if (!simulationEnabled.value) return
  simulationFrameCounter.value++
  if (simulationMotion.value) simulationTick.value += 0.15
}, 150)
onUnmounted(() => clearInterval(simulationTimer))
const radarTrackIds = computed(() => simulationEnabled.value ? simulationFrame.value.trackIds : liveRadarTrackIds.value)
const latestKpts = computed(() => simulationEnabled.value ? simulationFrame.value.kpts : liveLatestKpts.value)
const latestTrackPositions = computed(() => simulationEnabled.value ? simulationFrame.value.positions : liveLatestTrackPositions.value)
const latestDistancesToRadar = computed(() => simulationEnabled.value ? simulationFrame.value.distances : liveLatestDistancesToRadar.value)
const latestActions = computed(() => simulationEnabled.value ? simulationFrame.value.actions : liveLatestActions.value)
const latestPointCloud = computed(() => simulationEnabled.value ? simulationFrame.value.pointCloud : liveLatestPointCloud.value)
const radarParams = computed(() => simulationEnabled.value ? simulationFrame.value.radarParams : liveRadarParams.value)
const roomConfig = computed(() => simulationEnabled.value ? simulationFrame.value.roomConfig : liveRoomConfig.value)
const radarConnected = computed(() => simulationEnabled.value || liveRadarConnected.value)
const devData = computed(() => simulationEnabled.value
  ? { ...liveDevData.value, power: 1, swing_mode: simulationMode.value, speed: 4, data_array: [] }
  : liveDevData.value)

const radarPersonCount = computed(() => {
  if (radarTrackIds.value?.length > 0) {
    return radarTrackIds.value.length
  }
  return Math.max(
    radarTrackIds.value?.length ?? 0,
    latestKpts.value?.length ?? 0,
    latestTrackPositions.value?.length ?? 0,
    latestDistancesToRadar.value?.length ?? 0,
  )
})

/** 雷达已连接且 0 人：右侧隐藏扇形，左侧扇形向前 + 灰色 */
const radarNoPerson = computed(() => radarConnected.value && radarPersonCount.value === 0)

const radarFloorOriginXZ = computed(() => getFloorOriginXZFromRadarParams(radarParams.value, roomConfig.value?.depth ?? 5))

const nearestRadarTargets = computed(() => {
  const depth = roomConfig.value?.depth ?? 5
  return buildNearestRadarPersonRows(
    latestKpts.value,
    radarTrackIds.value,
    depth,
    3,
    radarFloorOriginXZ.value,
    latestTrackPositions.value,
    latestDistancesToRadar.value,
  )
})

const displayRadarSourceIndices = computed(() => {
  return nearestRadarTargets.value
    .map((row) => row?.sourceIndex)
    .filter((idx) => Number.isInteger(idx) && idx >= 0)
})

const displayKptsData = computed(() => {
  if (!Array.isArray(latestKpts.value) || latestKpts.value.length === 0) return []
  return displayRadarSourceIndices.value.map((idx) => latestKpts.value[idx]).filter(Boolean)
})

const displayTrackIds = computed(() => {
  if (!Array.isArray(radarTrackIds.value) || radarTrackIds.value.length === 0) return []
  return displayRadarSourceIndices.value
    .map((idx) => radarTrackIds.value[idx])
    .filter((trackId) => trackId != null)
})

const rightPanelPersonLabel = computed(() => {
  if (radarConnected.value) {
    const d = Math.min(radarPersonCount.value, 3)
    if (d <= 0) return '无人'
    if (d === 1) return '单人'
    if (d === 2) return '双人'
    return '三人'
  }
  if (!devData.value.power) return '无人'
  const m = devData.value.data_array?.length ?? 0
  const d = Math.min(m, 3)
  if (d <= 0) return '无人'
  if (d === 1) return '单人'
  if (d === 2) return '双人'
  return '三人'
})

const hasRightPanelPeople = computed(() => {
  if (radarConnected.value && radarPersonCount.value > 0) return true
  return !!(devData.value.power && (devData.value.data_array?.length ?? 0) > 0)
})

const rightPanelVisualActive = computed(() => {
  return !!(devData.value.power || (radarConnected.value && radarPersonCount.value > 0))
})

const formatRadarRowDistance = (row) => {
  if (!row || typeof row.distanceM !== 'number' || !Number.isFinite(row.distanceM)) return '—'
  return `${row.distanceM.toFixed(2)}m`
}

const formatRadarRowAngle = (row) => {
  if (!row || typeof row.angel !== 'number' || !Number.isFinite(row.angel)) return '—'
  return `${row.angel}°`
}

/** 右侧雷达列表按距离升序，第 1 条为 01（最近），第 3 条为 03（最远） */
const formatRadarRankByIndex = (index) => String(index + 1).padStart(2, '0')

const windModeImgLeft = ref('')
const windModeImgRight = ref('')
const windAreaRef = ref(null)
const deviceImageRef = ref(null)
const sectorAreaRef = ref(null)
const SECTOR_DEVICE_GAP_PX = 0
let sectorLayoutObserver = null
let sectorLayoutFrame = null

const syncSectorLayout = () => {
  const windArea = windAreaRef.value
  const deviceImage = deviceImageRef.value
  const sectorArea = sectorAreaRef.value
  if (!windArea || !deviceImage || !sectorArea) return

  const windAreaRect = windArea.getBoundingClientRect()
  const deviceImageRect = deviceImage.getBoundingClientRect()
  const sectorTop = deviceImageRect.bottom - windAreaRect.top + SECTOR_DEVICE_GAP_PX
  sectorArea.style.top = `${sectorTop}px`
}

const scheduleSectorLayout = () => {
  if (sectorLayoutFrame != null) cancelAnimationFrame(sectorLayoutFrame)
  sectorLayoutFrame = requestAnimationFrame(() => {
    sectorLayoutFrame = null
    syncSectorLayout()
  })
}

const windPersonCount = computed(() => {
  if (radarConnected.value) return radarPersonCount.value
  return devData.value.data_array?.length ?? 0
})
const windEffectActive = computed(() => {
  return !!(devData.value.power && windModeImgLeft.value && windModeImgRight.value)
})
const showfengYe = () => {
  if (radarWindPlan.value) {
    windModeImgLeft.value = getImageUrl(radarWindPlan.value.left.image)
    windModeImgRight.value = getImageUrl(radarWindPlan.value.right.image)
    return
  }
  let imgNameLeft = ''
  let imgNameRight = ''
  let imgNameLeftLast = devData.value.speed > 2 ? 'Strong.png' : 'Weak.png'
  let imgNameRightLast = devData.value.speed > 2 ? 'Strong.png' : 'Weak.png'
  // left_swing_area：左边摆叶（0--100） right_swing_area：右边摆叶（0--100）
  // 普通出风默认显示中间风效；风随人/风避人等模式按摆风区域切换方向。
  if (devData.value.swing_mode == 0) {
    imgNameLeft = 'L_M'
    imgNameRight = 'R_M'
  } else if (devData.value.right_swing_area == 100 && devData.value.left_swing_area == 100) {
    imgNameLeft = 'L_L' //最大角度
    imgNameRight = 'R_R' //最大角度
  } else if (devData.value.right_swing_area <= 50 && devData.value.left_swing_area <= 50) {
    imgNameLeft = 'L_M' //中间角度
    imgNameRight = 'R_M' //中间角度
  } else if (devData.value.right_swing_area < 50 && devData.value.left_swing_area > 50) {
    //整体往左吹
    imgNameLeft = 'L_L'
    imgNameRight = 'R_L'
  } else if (devData.value.right_swing_area > 50 && devData.value.left_swing_area < 50) {
    //整体往右吹
    imgNameLeft = 'L_R'
    imgNameRight = 'R_R'
  }
  // 风避人吹时
  if (devData.value.swing_mode == 2) {
    if (windPersonCount.value >= 2) {
      //双人场景 1、风避人吹时都是短风+弱风
      imgNameLeftLast = 'Weak.png'
      imgNameRightLast = 'Weak.png'
      if (devData.value.right_swing_area == 100 && devData.value.left_swing_area == 100) {
        imgNameLeft = 'L_LSmall' //最大角度,但是风只有一半
        imgNameRight = 'R_RSmall' //最大角度,但是风只有一半
      }
    } else if (windPersonCount.value == 1) {
      //单人场景1、风避人吹时人在左或右，一个强风一个弱风，中间的时候两边角度最大两边都是弱风+短风
      if (devData.value.right_swing_area < 50 && devData.value.left_swing_area > 50) {
        //整体往左吹
        imgNameLeftLast = 'Strong.png'
        imgNameRightLast = 'Weak.png'
      } else if (devData.value.right_swing_area > 50 && devData.value.left_swing_area < 50) {
        //整体往右吹
        imgNameLeftLast = 'Weak.png'
        imgNameRightLast = 'Strong.png'
      } else if (devData.value.right_swing_area == 100 && devData.value.left_swing_area == 100) {
        imgNameLeft = 'L_LSmall' //最大角度,但是风只有一半
        imgNameRight = 'R_RSmall' //最大角度,但是风只有一半
        imgNameLeftLast = 'Weak.png'
        imgNameRightLast = 'Weak.png'
      }
    }
  }
  windModeImgLeft.value = ''
  windModeImgRight.value = ''
  if (imgNameLeft.length > 0 && imgNameRight.length > 0) {
    windModeImgLeft.value = getImageUrl(`${imgNameLeft}${imgNameLeftLast}`)
    windModeImgRight.value = getImageUrl(`${imgNameRight}${imgNameRightLast}`)
  }
}

/** 多人沿用最近目标决定风速；位置采用画面中最近三人。 */
const nearestRadarAction = computed(() => {
  const sourceIndex = nearestRadarTargets.value[0]?.sourceIndex
  const action = latestActions.value[sourceIndex]
  return action == null ? null : Number(action)
})
const radarWindPlan = computed(() => {
  if (!radarConnected.value || !devData.value.power) return null
  const nearest = nearestRadarTargets.value[0]
  const reportedDistance = latestDistancesToRadar.value[nearest?.sourceIndex]
  return resolveRadarWind({
    mode: devData.value.swing_mode,
    targets: nearestRadarTargets.value,
    action: nearestRadarAction.value,
    distanceM: reportedDistance != null && Number.isFinite(Number(reportedDistance))
      ? Number(reportedDistance) : nearest?.distanceM,
  })
})
const displayWindSpeed = computed(() => radarWindPlan.value?.speed ?? devData.value.speed)
const radarActionLabel = computed(() => WIND_MODE_LABELS[devData.value.swing_mode] || '')
const windBeamStyle = (side) => ({
  transform: `scale(${radarWindPlan.value?.[side]?.scale ?? 1})`,
  transformOrigin: `${side === 'left' ? 49.1 : 50.9}% 30%`,
  animationDuration: displayWindSpeed.value > 2 ? '1.2s' : '2.2s',
})

const peopleBg = computed(() => {
  const mapper = {
    0: getImageUrl('noPeople.png'),
    1: getImageUrl('ic_singlePeople.png'),
    2: getImageUrl('morePeople.png'),
  }
  return mapper[radarPersonCount.value] || mapper[2]
})
const peopleScan = computed(() => {
  const mapper = {
    0: getImageUrl('noPeopleScan.png'),
    1: getImageUrl('singleScan.png'),
    2: getImageUrl('morePeopleScan.png'),
  }
  return mapper[radarPersonCount.value] || mapper[2]
})
const devImg = computed(() => {
  return devData.value.power == 1 ? getImageUrl('GHS_open.png') : getImageUrl('GHS_close.png')
})
const powerState = computed(() => {
  return devData.value.power == 1 ? getImageUrl('ic_wind_speed_open.png') : getImageUrl('ic_wind_speed_close.png')
})
const gridImgSrc = computed(() => {
  return devData.value.power == 1 ? getImageUrl('grid_open_new120.png') : getImageUrl('grid_close_new120.png')
})
const getHeadImg = (item) => {
  return getImageUrl(`flag${item.id}.png`)
}
//矩形的高度转化到UI上的px比例  需要减去人形的高度
//height: 493;width: 1710/2;宽高按照角度30度算下来的斜边是987
const UIXieBian = 987
//实际距离的斜边转化到UI上的px比例
const uiBiLi = (UIXieBian / 500).toFixed(2)
//标准圆弧的话，高度应该是855，实际UI上是椭圆弧，高度为493，这个椭圆弧图片高度还是不够，所以写了1100来兼容
const heightUI = (493 / 1150).toFixed(2)
const getPeopleLeft = (item) => {
  //实际距离按照比例对应到UI上
  const distanceUI = item.distance * uiBiLi
  //实际距离
  const left = item.angel == 90 ? distanceUI : distanceUI * Math.cos(((item.angel > 90 ? 180 - item.angel : item.angel) * Math.PI) / 180)
  // console.log('left',item.id,left)
  let leftUi = 0
  leftUi = item.angel > 90 ? 1012 + left : item.angel == 90 ? 1012 : 1012 - left
  // 将px单位转换为vw单位 (1vw = 38.4px，基于3840px的设计稿)
  const leftVw = ((leftUi - 70) / 38.4).toFixed(2)
  return leftVw + 'vw' //转化UI的top距离
}
const getPeopleTop = (item) => {
  const distanceUI = item.distance * uiBiLi * heightUI
  //实际距离
  let top = item.angel == 90 ? distanceUI : distanceUI * Math.sin(((item.angel > 90 ? 180 - item.angel : item.angel) * Math.PI) / 180)
  // console.log('top',item.id,top)
  const topVw = ((top - 318) / 38.4).toFixed(2)
  return topVw + 'vw' //转化UI的top距离
}
const refreshWindEffect = () => {
  showfengYe()
}

watch(
  () => [
    devData.value.power,
    devData.value.speed,
    devData.value.swing_mode,
    devData.value.left_swing_area,
    devData.value.right_swing_area,
    windPersonCount.value,
    radarWindPlan.value,
  ],
  refreshWindEffect,
  { immediate: true },
)

const timer = ref(null)
onMounted(() => {
  scheduleSectorLayout()
  window.addEventListener('resize', scheduleSectorLayout)
  if (typeof ResizeObserver !== 'undefined') {
    sectorLayoutObserver = new ResizeObserver(scheduleSectorLayout)
    if (windAreaRef.value) sectorLayoutObserver.observe(windAreaRef.value)
    if (deviceImageRef.value) sectorLayoutObserver.observe(deviceImageRef.value)
  }

  const hasToken = !!sessionManager.getToken()
  const hasDeviceId = !!radarLoginForm.deviceId.trim()
  debugLog('hasToken',hasToken,'hasDeviceId',hasDeviceId)
  if (hasToken && hasDeviceId) {
    connectRadarWs(radarLoginForm.deviceId.trim(), sessionManager.getToken() || '')
  } else if (!hasToken && radarLoginForm.username && radarLoginForm.password) {
    // 有缓存的账号密码但无 token，自动登录
    handleLoginAndConnect()
  } else {
    // 未登录且无缓存凭据，自动弹出登录面板
    showLoginPanel.value = true
  }
  timer.value = setInterval(() => {
    // getData()
  }, 500)

  // 连接 MQTT（使用雷达设置中缓存的 SN）
  const mqttSn = localStorage.getItem('radarMqttSn')
  if (mqttSn) {
    connectMqttWithSn(mqttSn)
  }
})
onUnmounted(() => {
  window.removeEventListener('resize', scheduleSectorLayout)
  sectorLayoutObserver?.disconnect()
  sectorLayoutObserver = null
  if (sectorLayoutFrame != null) cancelAnimationFrame(sectorLayoutFrame)
  sectorLayoutFrame = null
  clearInterval(timer.value)
  disconnectRadarWs()
  deviceStore.disconnectMqtt()
})
const WindlessFeeling = ref(false)
const getData = () => {
  // const data = "55AAAF0117001A03000A0147010600000000000000060002E50201060002000002060002E50200070001000107000100020700010006070001000707000100080700023CDC09070001000A070001000B070001000109000200000209000100030900020000060900020000070900020000080900025C030B09000200000C09000200000D090002F4010E09000200000F09000200001009000200001109000200001209000200001F09000200006208"
  // const data1 = "55AAC802170000010001010101000100020100018C03010001030401000132050100010006010001000002000104010200010302020001000302000100040200010005020001000602000100070200010008020002000009020001000A02000100010300010009030001000A03000200000B030001000D03000238380E03000100100300023838110300010013030002646414030001001603000264641703000100180300010019030001001C030001001E03000238381F030001002103000238380204000108070400010108040001010E04000401010100000500020000020500010103050004000000000405000400000000050500090016000700000000000705000100080500040000000009050004000000000A050001000B050004000000000C050001080D050001000F050001001005000100110500010012050001001305000100AE09"
  // dealData(data)
  // setTimeout(() => {
  //   dealData(data1)
  // },1000)
  // return
  http({
    method: 'POST',
    url: '/api/getData',
    baseURL: getDataHttpBase(deviceLanHost.value),
    skipWindowBase: true,
  })
    .then((data) => {
      if (!data) return
      debugLog(data, '接口返回数据')
      dealData(data.data)
      return
      liveDevData.value.right_swing_area = data.right_swing_area
      liveDevData.value.left_swing_area = data.left_swing_area
      // liveDevData.value.data_array = data.data_array;
      liveDevData.value.speed = data.speed
      liveDevData.value.swing_mode = data.swing_mode
      liveDevData.value.power = data.power
      liveDevData.value.set_temper = data.set_temper
      liveDevData.value.id_num = data.id_num
      getPeopleData(data.data_array) //处理人形站位
      showfengYe()
    })
    .catch((e) => {
      // console.log(e, '接口异常');
    })
}
const js = new P_8009369()
// 兜底：原生 App 流程未初始化 JsFunction 时，用通用协议解析器
if (!window.JsFunction) {
  window.JsFunction = js
}
// 将设备上报数据同步到 devData（HTTP 轮询和 MQTT 上报共用）
const applyDeviceReport = (reported) => {
  if (!reported) return
  highFrequencyLog('设备状态上报----->', reported)
  liveDevData.value.right_swing_area =
    reported?.actAnglePositionForHordirH2 !== undefined ? reported?.actAnglePositionForHordirH2 : liveDevData.value.right_swing_area
  liveDevData.value.left_swing_area =
    reported?.actAnglePositionForHordir !== undefined ? reported?.actAnglePositionForHordir : liveDevData.value.left_swing_area
  liveDevData.value.speed = reported?.mark !== undefined ? reported?.mark : liveDevData.value.speed
  liveDevData.value.swing_mode = reportedWindMode(liveDevData.value.swing_mode, reported)
  liveDevData.value.power = reported?.power !== undefined ? reported.power : liveDevData.value.power
  liveDevData.value.set_temper = reported?.settemp !== undefined ? reported?.settemp : liveDevData.value.set_temper
  liveDevData.value.id_num = reported?.radarTargetCount !== undefined ? reported?.radarTargetCount : liveDevData.value.id_num
  if (reported?.radarTargetCount == 1) {
    getPeopleData([
      {
        id: reported?.radarTarget1Speed,
        angel: reported?.radarTarget1Angle + 30, //角度，30-150°
        distance: reported?.radarTarget1Distance * 10, //距离，单位厘米，0-350cm
      },
    ])
  } else if (reported?.radarTargetCount == 2) {
    getPeopleData([
      {
        id: reported?.radarTarget1Speed,
        angel: reported?.radarTarget1Angle + 30, //角度，30-150°
        distance: reported?.radarTarget1Distance * 10, //距离，单位厘米，0-350cm
      },
      {
        id: reported?.radarTarget2Speed,
        angel: reported?.radarTarget2Angle + 30, //角度，30-150°
        distance: reported?.radarTarget2Distance * 10, //距离，单位厘米，0-350cm
      },
    ])
  }
  if (reported?.radarTargetCount == 0) {
    liveDevData.value.data_array = []
  }
  showfengYe()
}

// 监听 MQTT 上报的设备状态，自动同步到页面展示
watch(
  () => deviceStore.realtimeInfo,
  (info) => {
    if (info && Object.keys(info).length > 0) {
      applyDeviceReport(info)
    }
  },
  { deep: true }
)

// ==================== 测试面板 ====================

const mqttConnected = computed(() => deviceStore.mqttConnected)

const testScenarios = Object.entries(WIND_MODE_LABELS).map(([key, label]) => ({
  key: Number(key), label, hint: '风速随最近人员姿态联动',
}))

function handleTestSend(mode) {
  if (simulationEnabled.value) { simulationMode.value = mode; return }
  const cmd = Object.fromEntries(Object.entries(WIND_MODE_FIELDS).map(([key, field]) => [field, Number(key) === mode ? 1 : 0]))
  deviceStore.sendCommand(cmd)
}

// 风速变化稳定后下发；不再通过姿态切换模式、温度或触发旧姿态播报。
let windSpeedCommandTimer = null
watch(
  [
    () => radarWindPlan.value?.speed,
    // 旧指令的延迟回报可能覆盖当前目标，实际风速变化后需要重新纠偏。
    () => devData.value.speed,
    () => devData.value.swing_mode,
    () => devData.value.power,
    mqttConnected,
    simulationEnabled,
  ],
  () => {
    clearTimeout(windSpeedCommandTimer)
    const speed = radarWindPlan.value?.speed
    if (simulationEnabled.value || speed == null || !devData.value.power) return
    windSpeedCommandTimer = setTimeout(() => {
      if (!simulationEnabled.value && radarWindPlan.value?.speed === speed && Number(devData.value.speed) !== speed) {
        deviceStore.sendCommand({ mark: speed })
      }
    }, 500)
  },
)
onUnmounted(() => clearTimeout(windSpeedCommandTimer))

// 风向与界面同步下发。只监听目标刻度，避免连续雷达帧及摆叶运动回报重复发令。
watch(
  [
    () => radarWindPlan.value?.left.position,
    () => radarWindPlan.value?.right.position,
    () => devData.value.swing_mode,
    mqttConnected,
    simulationEnabled,
    () => simulationEnabled.value ? radarWindPlan.value?.speed : null,
  ],
  ([left, right, mode, connected, simulated, speed]) => {
    if (left == null || right == null) return
    const command = {
      setPositionForLeftRightWind: left,
      setPositionForLeftRightWindH2: right,
    }
    if (simulated) {
      console.log('[点云模拟][控制指令]', '模式:', mode, JSON.stringify({ ...command, mark: speed }))
      return
    }
    if (connected) deviceStore.sendCommand(command)
  },
)

// 模式/目标风速稳定后独立播报，设备已处于目标风速时也能播报模式切换。
let windBroadcastTimer = null
let lastWindBroadcastId = null
watch(
  [() => WIND_BROADCAST_IDS[devData.value.swing_mode]?.[radarWindPlan.value?.speed], mqttConnected, simulationEnabled],
  ([broadcastId, connected]) => {
    clearTimeout(windBroadcastTimer)
    if (simulationEnabled.value || !connected || broadcastId == null) {
      lastWindBroadcastId = null
      return
    }
    if (broadcastId === lastWindBroadcastId) return
    windBroadcastTimer = setTimeout(() => {
      if (simulationEnabled.value) return
      deviceStore.sendBroadcast({ broadcastid: broadcastId })
      lastWindBroadcastId = broadcastId
    }, 500)
  },
)
onUnmounted(() => clearTimeout(windBroadcastTimer))

const dealData = (data) => {
  let newStatusStr = js.fromDevice(data)
  try {
    let newStatus = JSON.parse(newStatusStr)
    const reported = newStatus.state.reported
    applyDeviceReport(reported)
  } catch (e) {
    console.error(e, 'updateCurStatus，数据解析失败')
  }
}
const getPeopleData = (arr) => {
  //角度变化1-5°，认为人不动，界面小人保持静止；距离变化0-20cm，认为人不动，界面小人保持静止
  const devArr = [...arr]
  if (devArr.length > 0 && liveDevData.value.data_array.length > 0) {
    for (const item of devArr) {
      for (const devItem of liveDevData.value.data_array) {
        if (devItem.id == item.id && Math.abs(item.angel - devItem.angel) <= 5 && Math.abs(item.distance - devItem.distance) <= 20) {
          item.angel = devItem.angel
          item.distance = devItem.distance
        }
      }
    }
  }
  liveDevData.value.data_array = devArr
}
</script>

<style lang="scss">
.home_page {
  width: 3840px;
  height: 100vh;
  background-image: url('@img/ic_home_bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
}

.radar_settings_btn {
  position: fixed;
  left: 2.2%;
  bottom: 2.2%;
  z-index: 999;
  width: 160px;
  height: 68px;
  border-radius: 10px;
  border: 1px solid rgba(194, 249, 255, 0.5);
  background: rgba(6, 31, 42, 0.75);
  color: #d9fdff;
  font-size: 30px;
  cursor: pointer;
}
.radar_control_mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar_control_panel {
  position: relative;
  width: 860px;
  padding: 44px 50px 46px;
  border-radius: 16px;
  border: 2px solid rgba(1, 255, 255, 0.35);
  background: rgba(6, 31, 42, 0.92);
  backdrop-filter: blur(4px);
}

.control_close_btn {
  position: absolute;
  top: 22px;
  right: 26px;
  width: 62px;
  height: 62px;
  border: none;
  border-radius: 50%;
  background: rgba(194, 249, 255, 0.2);
  color: #d9fdff;
  font-size: 34px;
  line-height: 64px;
  cursor: pointer;
}

.control_title {
  font-size: 64px;
  line-height: 64px;
  color: #c2f9ff;
  margin-bottom: 48px;
  text-align: center;
}

.control_input {
  width: 100%;
  height: 100px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid rgba(1, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
  color: #d9fdff;
  font-size: 34px;
  padding: 0 14px;
  outline: none;
  margin-bottom: 40px;
}

.control_actions {
  display: flex;
  gap: 10px;
}

.control_btn {
  flex: 1;
  height: 100px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(90deg, #00d2ff, #00ffa2);
  color: #03343d;
  font-size: 48px;
  font-weight: 700;
  cursor: pointer;
}

.control_btn.secondary {
  background: rgba(194, 249, 255, 0.2);
  color: #d9fdff;
  border: 1px solid rgba(194, 249, 255, 0.5);
}

.control_btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control_status {
  margin-top: 10px;
  font-size: 34px;
  line-height: 54px;
  color: #9dffd2;
  margin-top: 20px;
}

.control_status.error {
  color: #ff8f8f;
}

.h-50 {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.page_left {
  width: 2640px;
  height: inherit;
  position: relative;

  .wind_speed_num {
    position: fixed;
    width: 560px;
    height: 520px;
    top: 6.4%;
    left: 4.2%;

    /* 转圈动画*/
    @keyframes rotate_anticlockwise {
      0% {
        -webkit-transform: rotate(360deg);
      }

      25% {
        -webkit-transform: rotate(270deg);
      }

      50% {
        -webkit-transform: rotate(180deg);
      }

      75% {
        -webkit-transform: rotate(90deg);
      }

      100% {
        -webkit-transform: rotate(0deg);
      }
    }

    /* 
      rotate : 定义的动画名称
      1s : 动画时间
      linear : 动画以何种运行轨迹完成一个周期
      infinite :规定动画应该无限次播放
      */
    .running_anticlockwise {
      width: 560px;
      position: fixed;
      animation: rotate_anticlockwise 3s linear infinite;
    }
    .powertext {
      height: 100%;
      flex-direction: column;
    }
    .wind_speed_str {
      //margin-top: 150px;
      height: 134px;
      line-height: 134px;
      font-family: YouSheBiaoTiHei;
      font-size: 96px;
      color: #c2f9ff;
      font-weight: 600;
      text-align: center;
    }

    .wind_speed_hint {
      margin-top: 30px;
      font-family: YouSheBiaoTiHei;
      font-size: 48px;
      color: #c2f9ff;
      font-weight: 600;
      text-align: center;
      opacity: 0.8;
    }
  }

  .wind_area {
    width: 2037px;
    margin-top: 12%;
    text-align: center;
    position: relative;
    z-index: 100;

    .img_pro {
      height: 636px;
      z-index: 99;
      position: absolute;
      transform: translateX(-50%);
      left: 49.5%;
      top: 24px;
    }
    .windArea {
      height: 990px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      z-index: 103;
      top: 4%;
      margin-left: 5px;
    }
    .ml {
      margin-left: -5px !important;
    }
    @keyframes windFieldPulse {
      0%,
      100% {
        opacity: 0.78;
        filter: brightness(1);
      }
      50% {
        opacity: 1;
        filter: brightness(1.18);
      }
    }
    .windAreaQuanYuBottom {
      height: 1428px;
      position: absolute;
      left: -268px;
      top: -330px;
      z-index: 103;
      //top: 14.5%;
      //margin-left: -5px;
    }
    .windAreaQuanYuBottomActive {
      animation: windFieldPulse 2.2s ease-in-out infinite;
      will-change: opacity, filter;
    }
    .grid_wind_area {
      height: 430px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      margin-left: 16px;
      top: 37.5%;
    }
    .windModeText {
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      font-size: 72px;
      font-weight: 600;
      color: #01ffff;
      z-index: 106;
      top: 80%;
    }
    .windModeBgImg {
      width: 966px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      top: 85%;
    }
    .people_grid_area {
      position: absolute;
      //top: 30px;
      height: 318px;
      width: 122px;
      z-index: 110;
      //left: 50%;
      .flagBgArea {
        position: absolute;
        width: 116px;
        height: 64px;
        transform: translateX(-50%);
        left: 50%;
      }
      .peopleFlag {
        position: absolute;
        width: 116px;
        height: 64px;
        text-align: center;
        line-height: 60px;
        top: 0;
        font-size: 40px;
        font-weight: 600;
        color: #090808;
        z-index: 220;
        transform: translateX(-50%);
        left: 50%;
      }
      .peopleImg {
        position: absolute;
        height: 240px;
        margin-top: 20px;
        transform: translateX(-50%);
        left: 50%;
        top: 58px;
      }
    }
    .grid_areaPeople {
      position: absolute;
      height: 620px;
      width: 2500px;
      margin-left: 10px;
      top: 460px;
      transform: translateX(-50%);
      left: 50%;
      z-index: 110;
    }
    .grid_area {
      position: absolute;
      // 等比例扩大场景，保持扇形圆心对齐设备底部及原有投影比例。
      height: 3200px;
      width: 3200px;
      margin-left: -20px;
      // mounted 后会根据设备图实际底边重算，保留设计稿坐标作为首屏兜底值。
      top: 620px;
      transform: translateX(-50%);
      left: 50%;
      z-index: 100;
      .gridImg {
        height: 490px;
        width: 100%;
      }
      .radar_skeleton_layer {
        height: 80%;
        width: 100%;
        transform: translate(-50%, -50%);
        position: absolute;
        top: 0%;
        left: 50.5%;
        z-index: 105;
      }

      .grid-item {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;

        &.grid-item1 {
          background: url(@img/ic_card1.png);
        }

        &.grid-item2 {
          background: url(@img/ic_card2.png);
        }

        &.grid-item3 {
          background: url(@img/ic_card3.png);
        }

        &.grid-item4 {
          background: url(@img/ic_card4.png);
        }

        &.grid-item5 {
          background: url(@img/ic_card5.png);
        }

        &.grid-item6 {
          background: url(@img/ic_card6.png);
        }
      }
    }

    .body_area {
      width: 646px;
      height: 646px;
    }
  }

  .wind_mode_area {
    position: fixed;
    width: 1726px;
    height: 374px;
    bottom: 4.4%;
    background-image: linear-gradient(90deg, rgba(1, 255, 255, 0) 26%, rgba(1, 255, 255, 0.31) 48%, rgba(1, 255, 255, 0) 71%);
    text-align: center;

    .wind_mode_str {
      margin-top: 80px;
      font-family: PingFang-SC-Heavy;
      font-size: 96px;
      color: #01ffff;
      font-weight: 400;
    }

    .wind_mode_hint {
      margin-top: 50px;
      opacity: 0.6;
      font-family: PingFangSC-Medium;
      font-size: 72px;
      color: #01ffff;
      font-weight: 500;
    }
  }

  /* 雷达点云小窗：视觉稿位于左侧扇形场景右下角，贴底边并压住模式标签条
     右边界与右侧 heat_list 左边线对齐：2640 - 2740 = -100px；左边界仍是 1866 → width = 2740 - 1866 = 874px */
  .radar_point_cloud_panel {
    position: absolute;
    right: -50px;
    bottom: 80px;
    width: 874px;
    height: 774px;
    z-index: 200;
    overflow: hidden;
    // border-radius: 12px;
    // border: 1px solid rgba(154, 224, 238, 0.35);
    // background: rgba(6, 25, 34, 0.72);
    border: 1px solid #02E3E4;
    background: #000000;

    .dev {
      display: none;
    }
  }
}

.page_right {
  width: 1200px;
  height: inherit;
  position: relative;

  .img_title {
    position: fixed;
    width: 1026px;
    top: 6.5%;
  }

  .heat_num_area {
    position: fixed;
    width: 924px;
    height: 672px;
    top: 15%;

    /* 转圈动画*/
    @keyframes rotate_clockwise {
      0% {
        -webkit-transform: translate(-50%, -50%) rotate(0deg);
      }

      25% {
        -webkit-transform: translate(-50%, -50%) rotate(-90deg);
      }

      50% {
        -webkit-transform: translate(-50%, -50%) rotate(-180deg);
      }

      75% {
        -webkit-transform: translate(-50%, -50%) rotate(-270deg);
      }

      100% {
        -webkit-transform: translate(-50%, -50%) rotate(-360deg);
      }
    }

    /* 
      rotate : 定义的动画名称
      1s : 动画时间
      linear : 动画以何种运行轨迹完成一个周期
      infinite :规定动画应该无限次播放
      */
    .running_clockwise {
      width: 924px;
      height: 672px;
      position: fixed;
      //animation: rotate_clockwise 3s linear infinite;
    }
    .singleScan {
      width: 330px;
      height: 330px;
      position: absolute;
      left: 50%;
      transform: translate(-50%, -50%);
      top: 50%;
      animation: rotate_clockwise 3s linear infinite;
    }

    .heat_num_str {
      margin-top: 280px;
      text-align: center;
      font-family: YouSheBiaoTiHei;
      font-size: 92px;
      color: #01e7ff;
      font-weight: 400;
    }
    .powerOffState {
      color: #ffffff;
    }

    .heat_num_hint {
      margin-top: 30px;
      text-align: center;
      font-family: YouSheBiaoTiHei;
      font-size: 28px;
      color: #01e7ff;
      font-weight: 400;
    }
  }

  .no_body {
    position: fixed;
    bottom: 29.7%;
    opacity: 0.8;
    font-family: PingFangSC-Light;
    font-size: 64px;
    color: #c2f9ff;
    font-weight: 300;
  }
  //让雷达点云数据显示靠下一点
  .heat_list {
    position: fixed;
    top: 45%;

    .heat_item {
      width: 1000px;
      height: 128px;
      margin-bottom: 32px;
      border-radius: 16px;
      border: 3px solid rgba(24, 254, 249, 0.4);
      font-family: PingFang-SC-Heavy;
      color: #c2f9ff;
      text-align: center;
      .itemLeft {
        width: 100px;
        margin-left: 48px;
        font-size: 72px;
        font-weight: 600;
      }
      .itemAngel {
        width: 120px;
        text-align: left;
        margin-left: 52px;
        font-size: 60px;
        font-weight: 500;
      }
      .itemDistance {
        position: absolute;
        right: 16px;
        // margin-left: 40px;
        font-size: 60px;
        font-weight: 500;
      }
      img {
        width: 38px;
        margin-left: 256px;
      }

      .item_line {
        // margin-left: 50px;
        width: 2px;
        height: 48px;
        background: #17f4f2;
        opacity: 0.4;
      }
    }
  }

  .tips {
    position: fixed;
    bottom: 3.9%;
    font-family: PingFangSC-Light;
    font-size: 48px;
    color: #c2f9ff;
    font-weight: 300;
  }
}
.noScan {
  animation: none !important;
}

/* 测试面板 */
.simulation_badge { position: fixed; top: 18px; left: 18px; z-index: 999; background: #12343f; color: #ffd940; padding: 16px; font-size: 26px; border-radius: 10px; }
.simulation_badge button, .simulation_controls button, .simulation_controls select, .simulation_controls input { font-size: 24px; padding: 8px; }
.simulation_controls { color: #d9fdff; font-size: 25px; margin-bottom: 24px; }
.simulation_controls label { display: block; margin: 12px 0; }
.simulation_controls input[type=range] { width: 100%; }
.simulation_controls input[type=number] { width: 130px; }
.simulation_person { padding: 16px; margin: 12px 0; border: 1px solid #48717c; border-radius: 8px; }
.simulation_distances { display: flex; gap: 12px; }

.radar_test_btn {
  position: fixed;
  left: 2.2%;
  bottom: calc(2.2% + 78px);
  z-index: 999;
  width: 160px;
  height: 68px;
  border-radius: 10px;
  border: 1px solid rgba(255, 200, 50, 0.5);
  background: rgba(42, 31, 6, 0.75);
  color: #ffd940;
  font-size: 30px;
  cursor: pointer;
}

.test_panel {
  width: 1120px;
  max-height: 90vh;
  overflow-y: auto;
}

.test_status {
  font-size: 28px;
  color: #ff6b6b;
  text-align: center;
  margin-bottom: 30px;
}
.test_status.connected {
  color: #6bff9e;
}

.test_buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test_row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid rgba(1, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.test_label {
  width: 150px;
  font-size: 32px;
  color: #c2f9ff;
  font-weight: 600;
  flex-shrink: 0;
}

.test_hint {
  flex: 1;
  font-size: 24px;
  color: rgba(194, 249, 255, 0.65);
}

.test_send_btn {
  width: 230px;
  height: 60px;
  border-radius: 8px;
  border: 1px solid rgba(1, 255, 255, 0.5);
  background: rgba(1, 255, 255, 0.15);
  color: #01ffff;
  font-size: 28px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}
.test_send_btn:hover {
  background: rgba(1, 255, 255, 0.3);
}
.test_send_btn:active {
  background: rgba(1, 255, 255, 0.5);
}
</style>
