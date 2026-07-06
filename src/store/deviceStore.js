
import {
  createMqttConnection,
  encryptMqttOrder,
} from '@/utils/mqttService'
import { debugLog, highFrequencyLog } from '@/utils/debugLog'

export const deviceStore = defineStore('deviceStore', {
  state: () => ({
    deviceInfo: {},
    deviceState: {},
    deviceList: [], // 设备列表
    mqttConnection: null, // MQTT 连接实例
    mqttConnected: false, // MQTT 是否已连接
    mqttConnecting: false, // MQTT 是否连接中
    secretKey: null, // 设备加密密钥（十六进制字符串）
    realtimeInfo: {}, // 设备实时状态（MQTT 上报解析后）
  }),

  getters: {
  },

  actions: {
    getOne() {
      const materialCode = this.deviceInfo.sn.slice(3, 10);
      const categoryid = this.deviceInfo.categoryid || 'FRIDGE';
      return commonApi.getJs(materialCode).then(res => {
        /*
        * 解析js文件，挂载到window对象上
        * 在工程其他地方通过JsFunction.fromDevice()、JsFunction.toDevice()访问
        * */
        try {
          let Func = null  // eslint-disable-line
          const _js = !!res.data.materialCodeJs ? res.data.materialCodeJs[0].js : res.data.typeJs[0].js;
          eval(`(function(){Func = ${_js.includes(materialCode) ? `P_${materialCode}` : categoryid};${_js};})()`);
          window.JsFunction = new Func()
        } catch (e) {
          console.error(e, 'js文件下载解析失败')
        }
      })
    },

    // 根据 SN 下载设备专属协议 JS（雷达测试场景用）
    async loadProtocolBySn(sn) {
      if (!sn || sn.length < 10) {
        console.warn('[deviceStore] SN 无效，无法下载协议:', sn)
        return
      }
      const materialCode = sn.slice(3, 10)
      // 云服务器地址，不走 window.baseURL（那是设备局域网 IP）
      const cloudBase = (import.meta.env.VITE_BASE_URL || import.meta.env.VITE_BASE_GATEWAYURL || 'https://superapp.mymlsoft.com').replace(/\/$/, '')
      // 兼容 VITE_BASE_URL 已包含 /saserver 路径的情况
      const url = cloudBase.endsWith('/saserver') ? `${cloudBase}/js/getOne` : `${cloudBase}/saserver/js/getOne`
      debugLog('[deviceStore] 从云服务器下载协议, materialCode:', materialCode, 'url:', url)
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ material: materialCode }),
        })
        const json = await res.json()
        if (!json.data) {
          console.warn('[deviceStore] 协议下载返回空数据，使用兜底方案')
          return
        }
        const _js = json.data.materialCodeJs ? json.data.materialCodeJs[0]?.js : json.data.typeJs?.[0]?.js
        if (!_js) {
          console.warn('[deviceStore] 协议 JS 内容为空，使用兜底方案')
          return
        }
        let Func = null  // eslint-disable-line
        eval(`(function(){Func = ${_js.includes(materialCode) ? `P_${materialCode}` : 'FRIDGE'};${_js};})()`)
        window.JsFunction = new Func()
        debugLog('[deviceStore] 设备协议下载成功，JsFunction 已更新')
      } catch (e) {
        console.error('[deviceStore] 协议下载失败，继续使用兜底 P_8009369:', e)
      }
    },

    /**
     * 连接 MQTT
     * @param {Object} params
     * @param {string} params.cid - 用户 CID
     * @param {string} params.secretKey - 设备加密密钥
     * @param {string} params.deviceId - 设备 ID（sn）
     */
    connectMqtt({ cid, secretKey, deviceId }) {
      // 已连接且同一设备，跳过
      if (this.mqttConnection && this.mqttConnected) {
        this.mqttConnection.updateDeviceId(deviceId)
        this.mqttConnection.updateSecretKey(secretKey)
        return
      }

      this.secretKey = secretKey
      this.mqttConnecting = true

      this.mqttConnection = createMqttConnection({
        cid,
        secretKey,
        deviceId,
        onConnect: async ({ isReconnect }) => {
          this.mqttConnected = true
          this.mqttConnecting = false
          if (!isReconnect) {
            debugLog('[deviceStore] MQTT 首次连接成功')
          }
          // 获取设备加密密钥，供后续发送指令使用
          if (!this.secretKey && this.mqttConnection) {
            const key = await this.mqttConnection.fetchSecretKey(deviceId)
            if (key) {
              this.secretKey = key
              debugLog('[deviceStore] 已获取设备密钥')
            }
          }
        },
        onMessage: (parsed, reported) => {
          if (reported) {
            this.realtimeInfo = { ...this.realtimeInfo, ...reported }
            // 打印关键状态摘要
            const keys = Object.keys(reported)
            const summary = keys.map(k => `${k}=${JSON.stringify(reported[k])}`).join(' | ')
            highFrequencyLog(`[MQTT] 设备状态 (${keys.length}项): ${summary}`)
          }
        },
        onClose: () => {
          this.mqttConnected = false
          this.mqttConnecting = false
        },
        onReconnect: () => {
          this.mqttConnecting = true
        },
        onError: (err) => {
          this.mqttConnected = false
          this.mqttConnecting = false
          console.error('[deviceStore] MQTT 错误:', err)
        },
      })
    },

    /** 查询设备状态（通过 MQTT 发送查询命令） */
    queryDeviceStatus() {
      if (this.mqttConnection) {
        this.mqttConnection.queryDeviceStatus()
      }
    },

    /** 断开 MQTT */
    disconnectMqtt() {
      if (this.mqttConnection) {
        this.mqttConnection.disconnect()
        this.mqttConnection = null
      }
      this.mqttConnected = false
      this.mqttConnecting = false
      this.realtimeInfo = {}
    },

    /**
     * 通过 MQTT 发送控制指令
     * @param {Object} command - 控制指令对象（会被 JSON.stringify 后加密）
     */
    sendCommand(command) {
      // 控制消息主体 (协议要求 payload + source)
      const json = {
        method: 'control',
        version: 1,
        commandId: 256,
        timestamp: new Date().getTime(),
        source: 3,
        payload: command,
      }

      if (this.mqttConnection && this.mqttConnected) {
        // MQTT 通道：需要通过 JsFunction.toDevice 转换后再加密发送
        if (!window.JsFunction) {
          console.error('[deviceStore] window.JsFunction 未初始化，请确保 getOne() 已调用')
          return
        }
        if (!this.secretKey) {
          console.error('[deviceStore] secretKey 为空，无法加密指令')
          return
        }
        const order = window.JsFunction.toDevice(json)
        if (!order) {
          console.error('[deviceStore] toDevice 转换失败，原始指令:', json)
          return
        }
        // MQTT 需要原始 hex（55AA...），toDevice 可能返回 JSON 包裹格式 [{"data":"55AA...","delay":0}]
        if (order.startsWith('[')) {
          try {
            const parsed = JSON.parse(order)
            order = parsed[0]?.data || order
          } catch {
            // 不是合法 JSON，保持原样
          }
        }
        const encrypted = encryptMqttOrder(order, this.secretKey)
        debugLog('[deviceStore] MQTT 发送指令, hex:', order.slice(0, 40) + (order.length > 40 ? '...' : ''))
        this.mqttConnection.sendCommand(encrypted)
      } else {
        // 原生桥接通道（保持原有逻辑）
        const order = JsFunction.toDevice(json)
        const action = {
          "action": "INVOKE_SDK_FUNCTION",
          "functions": [{
            "ParameterList": [{ "type": "STRING", "value": order }, { "type": "STRING", "value": this.deviceInfo.sn }],
            "name": 'sendAsyncRawCommand'
          }]
        }
        debugLog('控制指令：', action)
        ToNativeBridge.sendDataToNative(action);
      }
    },

    /**
     * 通过 MQTT 发送语音播报等广播消息
     * @param {Object} json - 广播内容，如 { broadcastid: number }
     */
    sendBroadcast(json) {
      if (this.mqttConnection && this.mqttConnected) {
        this.mqttConnection.sendBroadcast(json)
      } else {
        console.warn('[deviceStore] MQTT 未连接，无法发送广播')
      }
    },

    // 兼容旧调用（CommonSeting.vue 用的是 sendComand）
    sendComand(command) { return this.sendCommand(command) },
  },
})()
