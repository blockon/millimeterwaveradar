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
    <button class="power_test_btn" @click="togglePower">{{ devData.power ? '关机' : '开机' }}</button>

    <div v-if="showLoginPanel" class="radar_control_mask">
      <div class="radar_control_panel">
        <button class="control_close_btn" @click="showLoginPanel = false">×</button>
        <div class="control_title">雷达连接设置</div>
        <input v-model.trim="radarLoginForm.username" class="control_input" placeholder="用户名/手机号" />
        <input v-model="radarLoginForm.password" class="control_input" type="password" placeholder="密码" />
        <input v-model.trim="radarLoginForm.sn" class="control_input" placeholder="设备SN" />
        <div class="control_actions">
          <button class="control_btn" :disabled="loginLoading || radarConnecting" @click="handleLoginAndConnect">
            {{ loginLoading ? '登录中...' : radarConnecting ? '连接中...' : '登录并展示' }}
          </button>
        </div>
        <div class="control_status" :class="{ error: radarError }">
          {{ radarError || (radarConnected ? '已连接，数据实时展示中' : '未连接') }}
        </div>
      </div>
    </div>

    <div class="page_left center">
      <!-- 风速 -->
      <div class="wind_speed_num">
        <img
          class="running_anticlockwise"
          :style="`animation-duration:${Math.abs(6 - devData.speed)}s`"
          :src="powerState"
          :class="{ noScan: devData.power == 0 }" />
        <div class="powertext center">
          <div class="wind_speed_str">{{ devData.power ? '开机' : '关机' }}</div>
          <div class="wind_speed_hint" v-if="devData.power">{{ devData.set_temper / 10 }}℃ | {{ windSpeedArr[devData.speed] }}</div>
        </div>
      </div>

      <!-- 摆风区域 -->
      <div class="wind_area">
        <img class="img_pro" :src="devImg" />
        <div v-if="devData.power">
          <img :src="windModeImgLeft" class="windAreaQuanYuBottom" />
          <img :src="windModeImgRight" class="windAreaQuanYuBottom" />
          <div class="windModeText">{{ devData.swing_mode > 0 ? windModeArr[devData.swing_mode - 1] : '' }}</div>
          <img src="@img/windModeBg.png" class="windModeBgImg" />
        </div>
        <!-- 网格区域 -->
        <div class="grid_area">
          <div class="radar_skeleton_layer">
            <ThreeStickmanView
              :kpts-data="displayKptsData"
              :track-ids="displayTrackIds"
              :point-cloud-data="latestPointCloud"
              :room-config="roomConfig"
              :radar-params="radarParams"
              :show-skeleton="true"
              :show-point-cloud="false"
              :show-sector-floor="true"
              :sector-floor-idle="radarNoPerson"
              skeleton-mode="stickman" />
          </div>
        </div>
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
      <div class="radar_point_cloud_panel" v-show="!radarNoPerson">
        <div class="dev"></div>
        <ThreeStickmanView
          :kpts-data="displayKptsData"
          :track-ids="displayTrackIds"
          :point-cloud-data="latestPointCloud"
          :room-config="roomConfig"
          :radar-params="radarParams"
          :show-skeleton="false"
          :show-point-cloud="true"
          skeleton-mode="stickman" />
      </div>
      <!-- 未检测到人体 -->
      <div v-if="!hasRightPanelPeople" class="no_body">区域内暂未检测到人体</div>
      <!-- 雷达优先：有雷达人数时展示最近 3 人 -->
      <div v-else-if="radarConnected && radarPersonCount > 0" class="heat_list">
        <div class="heat_item mid" v-for="(item, index) in nearestRadarTargets" :key="`${item.trackId}-${index}`">
          <div class="itemLeft">{{ formatRadarRankByIndex(index) }}</div>
          <img src="@img/ic_map.png" class="itemMap" />
          <div class="itemAngel">{{ item.angel }}°</div>
          <div class="item_line"></div>
          <div style="margin-left: 50px" class="itemDistance">{{ formatRadarRowDistance(item) }}</div>
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
          <div style="margin-left: 50px" class="itemDistance">{{ item.distance / 100 }}m</div>
        </div>
      </div>
      <div class="tips">温馨提示：最多显示3个人</div>
    </div>
  </div>
</template>

<script setup>
import SVGA from 'svgaplayerweb'
import { P_8009369 } from '@/utils/analysis.js'
import ThreeStickmanView from '@/components/ThreeStickmanView.vue'
import { AUTH_API, RADAR_WS_URL } from '@/config/radarApi'
import { getDataHttpBase } from '@/config/deviceApi'
import sessionManager from '@/utils/login/sessionManager'
import { binaryToString } from '@/utils/binaryToString'
import { parseCompressedPcloud } from '@/utils/parse_compressed_pcloud'
import { buildNearestRadarPersonRows, getFloorOriginXZFromRadarParams } from '@/utils/radarPersonMetrics'
import { showToast } from 'vant'

let isReverse = {}
let player = {}
let parser = {}
let isLoadFile = {}
let range = {}
const radarTrackIds = ref([])
const latestKpts = ref([])
const latestPointCloud = ref([])
const radarParams = ref({})
const roomConfig = ref({ width: 5, depth: 5 })
const showLoginPanel = ref(false)
const radarLoginForm = reactive({
  username: localStorage.getItem('radarLoginUsername') || '',
  password: localStorage.getItem('radarLoginPassword') || '',
  sn: localStorage.getItem('radarMqttSn') || '',
  deviceId: 'A1W2512K52T1ACKCVYTB',
})
const deviceLanHost = ref(
  (localStorage.getItem('deviceLanHost') || import.meta.env.VITE_LOCAL_DEVICE_HOST || '').trim()
)
const radarConnected = ref(false)
const radarConnecting = ref(false)
const radarError = ref('')
const loginLoading = ref(false)
let radarWs = null
let radarInitTimeoutId = null

const resetRadarState = () => {
  radarTrackIds.value = []
  latestKpts.value = []
  latestPointCloud.value = []
  radarParams.value = {}
  roomConfig.value = { width: 5, depth: 5 }
}

const connectRadarWs = (deviceId, token = '') => {
  if (!deviceId) {
    radarError.value = '请输入设备ID'
    return
  }
  radarConnecting.value = true
  radarError.value = ''
  try {
    radarWs = new WebSocket(RADAR_WS_URL)
    radarWs.onopen = () => {
      radarConnected.value = true
      radarConnecting.value = false
      const initData = {
        deviceID: deviceId,
        type: '1',
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
        if (Array.isArray(data.track_id)) radarTrackIds.value = data.track_id
        if (Array.isArray(data.kpts)) latestKpts.value = data.kpts
        if (data.rawpc != null && data.rawpc !== '') {
          latestPointCloud.value = parseCompressedPcloud(data.rawpc, 5)
        } else {
          latestPointCloud.value = []
        }
        if (data.RadarParams) {
          const r = data.RadarParams
          radarParams.value = {
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
            roomConfig.value = { width: dx, depth: dy }
          }
        }
      } catch (error) {
        console.error('radar ws parse error:', error)
      }
    }
    radarWs.onclose = () => {
      if (radarInitTimeoutId) {
        clearTimeout(radarInitTimeoutId)
        radarInitTimeoutId = null
      }
      radarWs = null
      radarConnected.value = false
      radarConnecting.value = false
      resetRadarState()
    }
    radarWs.onerror = () => {
      radarError.value = '雷达连接失败'
      radarConnected.value = false
      radarConnecting.value = false
      resetRadarState()
    }
  } catch (error) {
    console.error('radar ws connect error:', error)
    radarError.value = '雷达连接异常'
    radarConnected.value = false
    radarConnecting.value = false
  }
}

const disconnectRadarWs = () => {
  if (radarInitTimeoutId) {
    clearTimeout(radarInitTimeoutId)
    radarInitTimeoutId = null
  }
  if (radarWs) {
    radarWs.close()
    radarWs = null
  }
  radarConnected.value = false
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

const restartRadarWs = () => {
  const deviceId = radarLoginForm.deviceId.trim()
  const token = sessionManager.getToken() || ''
  disconnectRadarWs()
  connectRadarWs(deviceId, token)
}

// 用指定 SN 连接 MQTT（先断开旧连接）
const connectMqttWithSn = (sn) => {
  if (!sn) return
  const mqttCid = localStorage.getItem('mqttCid') || 'b448226a1b104435'
  deviceStore.disconnectMqtt()
  deviceStore.connectMqtt({ cid: mqttCid, deviceId: sn, secretKey: '' })
}

// 开关机测试按钮
const togglePower = () => {
  const newPower = devData.value.power ? 0 : 1
  console.log(`发送开关机指令: power=${newPower}`)
  console.log('MQTT 连接状态:', deviceStore.mqttConnected, '密钥:', !!deviceStore.secretKey, 'JsFunction:', !!window.JsFunction)
  deviceStore.sendCommand({ method: 'command', payload: { power: newPower } })
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
    const res = await fetch(AUTH_API.LOGIN_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: username,
        password: hashedPassword,
      }),
    })
    const data = await res.json()
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
const excutePlayer = (playObj, item) => {
  // 执行动画
  if (devData.value.swing_mode != 0) {
    // 如果不为扫风，svga动画调换到指定角度
    const _a = devData.value.swing_mode == 2 ? transfromAngel(item.angel) : item.angel
    let frameNum = Math.ceil((_a - 50) / 2) //风向（区域），0：左，1：中，2：右
    playObj.stepToFrame(frameNum, false)
  } else {
    range[item.swing_leaf].location = item.wind_area == 3 ? 0 : item.wind_area * 13
    range[item.swing_leaf].length = item.wind_area == 3 ? 49 : 14
    playObj.startAnimationWithRange(range[item.swing_leaf], isReverse[item.swing_leaf])
  }
}

const playSvga = () => {
  sgvaObj.forEach((item) => {
    player[item.swing_leaf] = player[item.swing_leaf] || new SVGA.Player('#' + item.swing_leaf)
    parser[item.swing_leaf] = parser[item.swing_leaf] || new SVGA.Parser()
    range[item.swing_leaf] = { location: 0, length: 42 }
    player[item.swing_leaf].loops = 1
    if (isLoadFile[item.swing_leaf]) {
      // 若已加载文件，则直接执行
      excutePlayer(player[item.swing_leaf], item)
    } else {
      parser[item.swing_leaf].load(item.url, (videoItem) => {
        player[item.swing_leaf].setVideoItem(videoItem)
        isLoadFile[item.swing_leaf] = true // 是否加载svga文件
        excutePlayer(player[item.swing_leaf], item)
      })
    }

    player[item.swing_leaf].onFinished(() => {
      //动画停止播放时回调
      isReverse[item.swing_leaf] = !isReverse[item.swing_leaf]
      player[item.swing_leaf].clear()
      setTimeout(() => {
        player[item.swing_leaf].startAnimationWithRange(range[item.swing_leaf], isReverse[item.swing_leaf])
      }, 10)
    })
    player[item.swing_leaf].onFrame((number) => {
      //动画播放至某帧后回调
      // console.log('--onFrame--' + number)
    })
    player[item.swing_leaf].onPercentage((number) => {
      //动画播放至某进度后回调
      // console.log('--onPercentage--' + number)
    })
  })
}

const windModeArr = ['风随人动', '风避人吹', '人近风柔']
const windSpeedArr = ['自动风', '微风', '低风', '中风', '高风', '强劲风']

const transfromAngel = (angle) => {
  if (angle <= 90) {
    angle = angle + 45
  } else if (angle > 90 && angle <= 135) {
    angle = angle - 45
  }
  return angle //空调摆叶摆动位置
}
let sgvaObj = [
  {
    swing_leaf: 'svgaUp',
    url: './svga/up_single.svga',
  },
  {
    swing_leaf: 'svgaDown',
    url: './svga/down_single.svga',
  },
]
let devData = ref({
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
  left_swing_area: 0, //上(左)摆叶摆风区域，0--100度   0度是中间 50度斜前方 左边是100，只有这三种情况
  right_swing_area: 0, //下（右）摆叶摆风区域，0--100度   0度是中间，50度斜前方 右边是100
  power: 1,
  set_temper: 263,
})

const radarPersonCount = computed(() => {
  const t = radarTrackIds.value?.length ?? 0
  if (t > 0) return t
  return latestKpts.value?.length ?? 0
})

/** 雷达已连接且 0 人：右侧隐藏扇形，左侧扇形向前 + 灰色 */
const radarNoPerson = computed(() => radarConnected.value && radarPersonCount.value === 0)

const radarFloorOriginXZ = computed(() => getFloorOriginXZFromRadarParams(radarParams.value, roomConfig.value?.depth ?? 5))

const nearestRadarTargets = computed(() => {
  const depth = roomConfig.value?.depth ?? 5
  return buildNearestRadarPersonRows(latestKpts.value, radarTrackIds.value, depth, 3, radarFloorOriginXZ.value)
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

/** 右侧雷达列表按距离升序，第 1 条为 01（最近），第 3 条为 03（最远） */
const formatRadarRankByIndex = (index) => String(index + 1).padStart(2, '0')

const windTimer = ref(null)
const windModeImgLeft = ref('')
const windModeImgRight = ref('')
const showfengYe = () => {
  let imgNameLeft = ''
  let imgNameRight = ''
  let imgNameLeftLast = devData.value.speed > 2 ? 'Strong.png' : 'Weak.png'
  let imgNameRightLast = devData.value.speed > 2 ? 'Strong.png' : 'Weak.png'
  //left_swing_area：左边摆叶（0--100） right_swing_area：右边摆叶（0--100）
  //devData.value.swing_mode == 0说明当前没有运行风随人动那些模式，不显示摆叶
  if (devData.value.swing_mode == 0) {
    imgNameLeft = ''
    imgNameRight = ''
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
    if (devData.value.data_array.length == 2) {
      //双人场景 1、风避人吹时都是短风+弱风
      imgNameLeftLast = 'Weak.png'
      imgNameRightLast = 'Weak.png'
      if (devData.value.right_swing_area == 100 && devData.value.left_swing_area == 100) {
        imgNameLeft = 'L_LSmall' //最大角度,但是风只有一半
        imgNameRight = 'R_RSmall' //最大角度,但是风只有一半
      }
    } else if (devData.value.data_array.length == 1) {
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
const startPlay = () => {
  sgvaObj[0].wind_area = devData.value.left_swing_area
  sgvaObj[1].wind_area = devData.value.right_swing_area
  playSvga()
}
// 停止播放
const clearPlay = () => {
  for (let i in player) {
    player[i].stopAnimation()
  }
}
const timer = ref(null)
onMounted(() => {
  // startPlay();
  const hasToken = !!sessionManager.getToken()
  const hasDeviceId = !!radarLoginForm.deviceId.trim()
  if (hasToken && hasDeviceId) {
    connectRadarWs(radarLoginForm.deviceId.trim(), sessionManager.getToken() || '')
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
  clearInterval(timer.value)
  if (windTimer.value) {
    clearInterval(windTimer.value)
  }
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
      console.log(data, '接口返回数据')
      dealData(data.data)
      return
      devData.value.right_swing_area = data.right_swing_area
      devData.value.left_swing_area = data.left_swing_area
      // devData.value.data_array = data.data_array;
      devData.value.speed = data.speed
      devData.value.swing_mode = data.swing_mode
      devData.value.power = data.power
      devData.value.set_temper = data.set_temper
      devData.value.id_num = data.id_num
      getPeopleData(data.data_array) //处理人形站位
      showfengYe()
    })
    .catch((e) => {
      // console.log(e, '接口异常');
    })
}
const js = new P_8009369()
// 将设备上报数据同步到 devData（HTTP 轮询和 MQTT 上报共用）
const applyDeviceReport = (reported) => {
  if (!reported) return
  console.log('设备状态上报----->', reported)
  devData.value.right_swing_area =
    reported?.actAnglePositionForHordirH2 !== undefined ? reported?.actAnglePositionForHordirH2 : devData.value.right_swing_area
  devData.value.left_swing_area =
    reported?.actAnglePositionForHordir !== undefined ? reported?.actAnglePositionForHordir : devData.value.left_swing_area
  devData.value.speed = reported?.mark !== undefined ? reported?.mark : devData.value.speed
  if (reported?.radarWindFollowPeople == 0 || reported?.radarWindAvoidPeople == 0 || reported?.radarPeopleNearSoftWind == 0) {
    devData.value.swing_mode = 0
  }
  if (reported?.radarWindFollowPeople == 1 || reported?.radarWindAvoidPeople == 1 || reported?.radarPeopleNearSoftWind == 1) {
    devData.value.swing_mode =
      reported?.radarWindFollowPeople == 1 ? 1 : reported?.radarWindAvoidPeople == 1 ? 2 : reported?.radarPeopleNearSoftWind == 1 ? 3 : 0
  }
  devData.value.power = reported?.power !== undefined ? reported.power : devData.value.power
  devData.value.set_temper = reported?.settemp !== undefined ? reported?.settemp : devData.value.set_temper
  devData.value.id_num = reported?.radarTargetCount !== undefined ? reported?.radarTargetCount : devData.value.id_num
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
    devData.value.data_array = []
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
  if (devArr.length > 0 && devData.value.data_array.length > 0) {
    for (const item of devArr) {
      for (const devItem of devData.value.data_array) {
        if (devItem.id == item.id && Math.abs(item.angel - devItem.angel) <= 5 && Math.abs(item.distance - devItem.distance) <= 20) {
          item.angel = devItem.angel
          item.distance = devItem.distance
        }
      }
    }
  }
  devData.value.data_array = devArr
}
// watch(() => [devData.value.up_swing_area, devData.value.low_swing_area], (newValue, oldVaule) => {
// 重新渲染
// console.log(newValue, oldVaule, 'chongxinxuanra');
// setTimeout(() => { startPlay() }, 500);
// })
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
.power_test_btn {
  position: fixed;
  left: 2.2%;
  bottom: 5.2%;
  z-index: 999;
  width: 160px;
  height: 68px;
  border-radius: 10px;
  border: 1px solid rgba(255, 194, 102, 0.5);
  background: rgba(42, 20, 6, 0.75);
  color: #ffd9a6;
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
    .windAreaQuanYuBottom {
      height: 1428px;
      position: absolute;
      left: -268px;
      top: -330px;
      z-index: 103;
      //top: 14.5%;
      //margin-left: -5px;
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
      z-index: 102;
      top: 78%;
    }
    .windModeBgImg {
      width: 966px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      top: 83%;
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
      //按照宽度1710和角度30度算下来，高应该是493，但是图片高度不够，所以强行加高
      height: 2500px;
      width: 2500px;
      margin-left: -20px;
      top: 600px;
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

  .wind_svga {
    position: fixed;
    width: 2580px;
    height: 1900px;
    top: -20px;
    left: 0px;
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

  .heat_list {
    position: fixed;
    top: 47%;

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
        margin-left: 40px;
        font-size: 60px;
        font-weight: 500;
      }
      img {
        width: 38px;
        margin-left: 256px;
      }

      .item_line {
        margin-left: 50px;
        width: 2px;
        height: 48px;
        background: #17f4f2;
        opacity: 0.4;
      }
    }
  }

  .radar_point_cloud_panel {
    position: absolute;
    top: 45%;
    width: 1800px;
    height: 1200px;
    border-radius: 0;
    overflow: hidden;
    border: none;
    background: transparent;
    .dev {
      position: absolute;
      left: 50%;
      width: 42px;
      height: 114px;
      border-radius: 8px;
      transform: translate(-50%, -50%);
      top: 47%;
      background: linear-gradient(180deg, rgba(92, 255, 255, 0) 0%, rgba(92, 255, 255, 0.8) 100%);
      z-index: 1000;
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
</style>
