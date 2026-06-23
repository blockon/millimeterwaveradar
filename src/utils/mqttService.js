/**
 * MQTT 连接服务（从 wechatapp 移植，适配 H5 环境）
 *
 * 主要变化：
 * - wxs:// → wss://（浏览器标准 WebSocket）
 * - uni.* API → 标准浏览器 API
 * - 去除小程序特有的 __wxConfig 判断
 */
import * as mqtt from 'mqtt/dist/mqtt.js'
import CryptoJS from 'crypto-js'
import { P_8009369 } from '@/utils/analysis.js'

// 协议解析器实例
let protocolParser = null
function getProtocolParser() {
  if (!protocolParser) protocolParser = new P_8009369({})
  return protocolParser
}

// ===================== 命令构建 =====================

/** 数字转两位大写十六进制 */
const toHex = (num = 0, length = 2) =>
  Number(num).toString(16).toUpperCase().padStart(length, '0')

/**
 * 封装 55AA 帧头 + 校验和
 * @param {number[]} OrderAry 十进制数组
 * @returns {string} 十六进制字符串
 */
function generatOrder(OrderAry) {
  const orderLen = 5 + OrderAry.length
  let orderContent = [0x55, 0xaa, orderLen, ...OrderAry]
  let checkSum = orderContent.reduce((acc, cur) => acc + +cur, 0)
  checkSum = checkSum & 0xffff
  orderContent = [...orderContent, checkSum & 0x00ff, checkSum >> 8]
  return orderContent.map((item) => toHex(item)).join('')
}

/**
 * V3 协议查询命令
 * @param {Object} obj { 组号: 最大属性号 } 例如 { 1: 6, 3: 33 }
 * @returns {string} 十六进制查询命令
 */
function getOrderByObj(obj) {
  const attrAry = [23]
  for (const groupNo in obj) {
    const attrNums = obj[groupNo]
    for (let i = 0; i <= attrNums; i++) {
      attrAry.push(i, groupNo)
    }
  }
  return generatOrder(attrAry)
}

/** 构建 V3 全状态查询命令（第一批：核心状态） */
function buildStatusQueryV3() {
  return getOrderByObj({
    1: 6,   // 空调控制
    3: 33,  // 出风控制
    2: 10,  // 运行状态
  })
}

/** 构建 V3 全状态查询命令（第二批：扩展功能） */
function buildStatusQueryV3Part2() {
  return getOrderByObj({
    4: 14,  // 增加功能
    5: 19,  // 维护管理
    6: 3,   // 环境参数
    7: 5,   // 高级配置
    8: 3,   // 新风功能
    11: 1,  // AI功能
  })
}

// ===================== 工具函数 =====================

/** 数字转两位大写十六进制 */
const toHexStr = (num = 0, length = 2) =>
  Number(num).toString(16).toUpperCase().padStart(length, '0')

/** 字符串转 Uint8Array（可选 C 结束符） */
const stringToBytesEnd = (str, addZero = false) => {
  let len = str.length
  if (addZero) len += 1
  const array = new Uint8Array(len)
  for (let i = 0; i < str.length; i++) {
    array[i] = str.charCodeAt(i)
  }
  if (addZero) array[str.length] = 0
  return array.buffer
}

/** ArrayBuffer → 字符串 */
const bytesToString = (buffer) => {
  const uint8 = new Uint8Array(buffer)
  return String.fromCharCode.apply(null, uint8)
}

/** Uint8Array → 16 进制字符串 */
const uint8ArrayToHex = (uint8Array) =>
  Array.prototype.map
    .call(uint8Array, (x) => ('00' + x.toString(16)).slice(-2))
    .join('')
    .toUpperCase()

/** CryptoJS WordArray → Uint8Array */
const convertWordArrayToUint8Array = (wordArray, skipZero) => {
  const len = wordArray.words.length
  const sig = wordArray.sigBytes
  const u8 = new Uint8Array(sig)
  let offset = 0
  for (let i = 0; i < len; i++) {
    const word = wordArray.words[i]
    if (!skipZero || word !== 0) {
      u8[offset++] = (word >> 24) & 0xff
      u8[offset++] = (word >> 16) & 0xff
      u8[offset++] = (word >> 8) & 0xff
      u8[offset++] = word & 0xff
    }
  }
  return u8
}

// ===================== 加解密 =====================

/**
 * 加密指令（MQTT 通道）
 * @param {string} order - 十六进制命令字符串
 * @param {string} secretKey - AES 密钥（十六进制）
 * @returns {string} Base64 编码的密文
 */
export function encryptMqttOrder(order, secretKey) {
  // MQTT 需要计算校验和
  let checkSum = order.split('').reduce((acc, cur) => acc + cur.charCodeAt(), 0)
  checkSum = checkSum & 0xff
  checkSum = toHexStr(checkSum)

  const buffer = stringToBytesEnd(order, false)
  const uint8 = new Uint8Array(buffer)
  const hexStr = Array.prototype.map.call(uint8, (i) => toHexStr(i)).join('')

  const finalOrder = hexStr + checkSum

  const key = CryptoJS.enc.Hex.parse(secretKey)
  const rawdata = CryptoJS.enc.Hex.parse(finalOrder)
  const encrypted = CryptoJS.AES.encrypt(rawdata, key, {
    iv: key,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
}

/**
 * 加密广播消息（语音播报等），与 encryptMqttOrder 完全一致的流程
 * JSON → hex 字节 → 校验和 → AES-CBC 加密 → Base64
 * @param {string|Object} json - JSON 字符串或对象
 * @param {string} secretKey - AES 密钥（十六进制）
 * @returns {string} Base64 编码的密文
 */
export function encryptBroadcast(json, secretKey) {
  const jsonStr = typeof json === 'string' ? json : JSON.stringify(json)
  console.log('[MQTT] encryptBroadcast 密钥长度:', secretKey?.length, '前10字符:', secretKey?.slice(0, 10), '是否全hex:', /^[0-9a-fA-F]+$/.test(secretKey || ''))

  // 和 encryptMqttOrder 完全一致：JSON → hex → 加校验和 → AES 加密
  let checkSum = jsonStr.split('').reduce((acc, cur) => acc + cur.charCodeAt(), 0)
  checkSum = checkSum & 0xff
  checkSum = toHexStr(checkSum)

  const buffer = stringToBytesEnd(jsonStr, false)
  const uint8 = new Uint8Array(buffer)
  const hexStr = Array.prototype.map.call(uint8, (i) => toHexStr(i)).join('')

  const finalOrder = hexStr + checkSum

  const key = CryptoJS.enc.Hex.parse(secretKey)
  const rawdata = CryptoJS.enc.Hex.parse(finalOrder)
  const encrypted = CryptoJS.AES.encrypt(rawdata, key, {
    iv: key,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
}

/**
 * 解密 MQTT 消息
 * @param {string} str - Base64 编码的密文
 * @param {string} secretKey - AES 密钥（十六进制）
 * @returns {Promise<Uint8Array>} 解密后的字节数组
 */
export function decryptMqttMessage(str, secretKey) {
  return new Promise((resolve, reject) => {
    // Base64 → 16 进制字符串
    const hexStr = uint8ArrayToHex(
      convertWordArrayToUint8Array(CryptoJS.enc.Base64.parse(str), false)
    )

    const key = CryptoJS.enc.Hex.parse(secretKey)
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(hexStr),
      key,
      iv: key,
      algorithm: CryptoJS.algo.AES,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      blockSize: 4,
    })

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: key,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })

    if (decrypted.sigBytes < 0) return reject(new Error('解密失败'))
    resolve(convertWordArrayToUint8Array(decrypted, true))
  })
}

// ===================== MQTT 服务 =====================

/**
 * 创建 MQTT 连接
 * @param {Object} options
 * @param {string} options.cid - 用户 CID（用于构造 clientId 和订阅主题）
 * @param {string} options.secretKey - 设备加密密钥（十六进制）
 * @param {string} [options.deviceId] - 当前连接的设备 ID（sn）
 * @param {Function} [options.onMessage] - 收到设备上报数据的回调 (parsedData) => void
 * @param {Function} [options.onConnect] - 连接成功回调
 * @param {Function} [options.onClose] - 连接断开回调
 * @param {Function} [options.onReconnect] - 重连中回调
 * @param {Function} [options.onError] - 错误回调
 * @returns {{ client, disconnect, sendCommand, updateDeviceId, updateSecretKey }}
 */
export function createMqttConnection({
  cid,
  secretKey,
  deviceId,
  onMessage,
  onConnect,
  onClose,
  onReconnect,
  onError,
}) {
  let _cid = cid
  let _secretKey = secretKey
  let _deviceId = deviceId
  let _isReconnecting = false
  let client = null
  const _keyCache = {} // 按 SN 缓存密钥

  // 动态获取设备密钥
  async function fetchSecretKey(sn) {
    if (_keyCache[sn]) return _keyCache[sn]
    try {
      const res = await fetch(
        'https://test-envsplit.mymlsoft.com/gateway/acmini/api/acDevice/safeSecret',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skey: sn }) }
      )
      const json = await res.json()
      const key = json.data?.svalue
      if (key) {
        _keyCache[sn] = key
        console.log(`[MQTT] 获取密钥: ${sn}`, '长度:', key.length, '前10字符:', key.slice(0, 10))
        // 如果是目标设备，同步到 _secretKey 供查询命令加密用
        if (sn === _deviceId) _secretKey = key
      }
      return key || null
    } catch { return null }
  }

  const mqttUrl = import.meta.env.VITE_MQTT_URL || 'wss://newmqtt-wxs.mymlsoft.com:1443/mqtt'
  const username = import.meta.env.VITE_MQTT_USERNAME || 'testWeixin'

  // MQTT 密码：优先使用环境变量，否则使用硬编码 JWT（与小程序一致）
  const password = import.meta.env.VITE_MQTT_PASSWORD && import.meta.env.VITE_MQTT_PASSWORD !== '***' && import.meta.env.VITE_MQTT_PASSWORD.length > 10
    ? import.meta.env.VITE_MQTT_PASSWORD
    : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0YW8xLmppYW5nIiwidXNlciI6ImQ4Y2E3MGIyOTIyOTQ4YzYifQ.CUQp-EziJMFvPickVZkmCP-zdZTLbyBrHpF6U7m3DiQ'

  const options = {
    keepalive: 10,
    clientId: `a1:${_cid}weixn`,
    username,
    password,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 15 * 1000,
  }
  console.log(`[MQTT] 连接 MQTT 服务器: ${mqttUrl}`)
  console.log('MQTT 连接选项:', options)
  client = mqtt.connect(mqttUrl, options)

  client.on('connect', async () => {
    console.log('[MQTT] 连接成功')

    if (_isReconnecting) {
      _isReconnecting = false
      console.log('[MQTT] 重连成功')
      onConnect?.({ isReconnect: true })
      return
    }

    // 订阅用户级消息
    // client.subscribe(`a/${_cid}/i`)
    // console.log(`[MQTT] 已订阅 a/${_cid}/i`)

    // 同时订阅设备专属 topic（参考 runningState.vue 的 d/{sn}/m 模式）
    if (_deviceId) {
      client.subscribe(`d/${_deviceId}/m`)
      console.log(`[MQTT] 已订阅 d/${_deviceId}/m`)
    }

    onConnect?.({ isReconnect: false })

    // 主动获取目标设备密钥并查询状态
    if (_deviceId) {
      const key = await fetchSecretKey(_deviceId)
      if (key) {
        _secretKey = key
        setTimeout(() => queryDeviceStatus(), 300)
      }
    }
  })

  client.on('message', async (topic, payload) => {
    // 设备专属 topic (d/{sn}/m)
    if (topic === `d/${_deviceId}/m`) {
      try {
        const b64Str = bytesToString(payload)
        console.log(`[MQTT] 设备专属消息 base64(前100): ${b64Str.slice(0, 100)}`)

        // base64 解码
        const decodedBytes = Uint8Array.from(atob(b64Str), c => c.charCodeAt(0))
        const decodedHex = uint8ArrayToHex(decodedBytes)
        console.log(`[MQTT] base64解码后hex(前100): ${decodedHex.slice(0, 100)}`)

        // 尝试协议解析
        try {
          const parsed = JSON.parse(getProtocolParser().fromDevice(decodedHex))
          const reported = parsed?.state?.reported
          console.log(`[MQTT] 解析成功:`, reported)
          onMessage?.(parsed, reported)
          return
        } catch (e2) {
          console.warn(`[MQTT] 解析失败: ${e2.message}`)
        }

        // 如果直接解析失败，尝试解密后再解析
        const key = _secretKey || await fetchSecretKey(_deviceId)
        if (key) {
          const decData = await decryptMqttMessage(b64Str, key)
          let strData = bytesToString(decData)
          if (strData.length % 2) strData = strData.slice(0, strData.length - 1)
          if (strData) {
            console.log(`[MQTT] 解密后hex: ${strData.slice(0, 100)}`)
            try {
              const parsed = JSON.parse(getProtocolParser().fromDevice(strData))
              const reported = parsed?.state?.reported
              console.log(`[MQTT] 解密解析成功:`, reported)
              onMessage?.(parsed, reported)
            } catch (e3) {
              console.warn('[MQTT] 解密后解析失败:', e3.message)
            }
          }
        }
      } catch (e) {
        console.warn('[MQTT] 设备消息解析失败:', e)
      }
      return
    }

    // 用户级 topic (a/{cid}/i) — 原有解析逻辑
    try {
      const resStr = bytesToString(payload)
      const len = payload[0]

      // 调试：打印原始 payload 十六进制和字符串，排查 sn 提取问题
      const hex = uint8ArrayToHex(new Uint8Array(payload))
      console.log(`[MQTT] 原始payload(hex): ${hex}`)
      console.log(`[MQTT] 原始payload(str): ${resStr}`)
      console.log(`[MQTT] payload[0]长度字节=${len}, 提取sn="${resStr.slice(1, len + 1)}"`)

      // 提取 sn
      const sn = resStr.slice(1, len + 1)

      // 调试：打印所有收到的消息的设备 sn
      console.log(`[MQTT] 收到消息 sn="${sn}"，当前目标设备="${_deviceId}"，匹配=${sn === _deviceId}`)

      // 临时：不过滤，打印所有设备消息的原始数据（前100字符）
      const rawData = resStr.slice(len + 1)
      console.log(`[MQTT] 原始数据(hex): ${uint8ArrayToHex(new Uint8Array(payload.slice(len + 1))).slice(0, 200)}`)

      // 只处理目标设备的消息
      if (_deviceId && sn !== _deviceId) return

      // 获取密钥
      const key = _secretKey || await fetchSecretKey(sn)
      if (!key) { console.warn(`[MQTT] 无法获取设备 ${sn} 的密钥`); return }

      // 解密
      const decData = await decryptMqttMessage(resStr.slice(len + 1), key)

      // 解析成字符串
      let strData = bytesToString(decData)
      if (strData.length % 2) strData = strData.slice(0, strData.length - 1) // 去除末尾乱码结束符
      if (!strData) return

      console.log(`[MQTT] 收到 ${sn}: ${strData}`)

      // 通过协议解析器将十六进制数据转为通用 JSON 格式
      try {
        const parsed = JSON.parse(getProtocolParser().fromDevice(strData))
        const reported = parsed?.state?.reported
        onMessage?.(parsed, reported)
      } catch (parseErr) {
        console.warn('[MQTT] 协议解析失败，返回原始数据:', parseErr.message)
        onMessage?.(strData, null)
      }
    } catch (error) {
      console.error('[MQTT] 消息解析失败:', error)
    }
  })

  client.on('close', () => {
    console.log('[MQTT] 连接关闭')
    onClose?.()
  })

  client.on('offline', () => {
    console.log('[MQTT] 离线')
  })

  client.on('reconnect', () => {
    console.log('[MQTT] 重连中...')
    _isReconnecting = true
    onReconnect?.()
  })

  client.on('error', (error) => {
    console.error('[MQTT] 错误:', error)
    onError?.(error)
  })

  /**
   * 发送控制指令到设备
   * @param {string} order - 加密后的 Base64 指令（由 encryptMqttOrder 生成）
   */
  function sendCommand(order) {
    if (!client || !client.connected) {
      console.warn('[MQTT] 未连接，无法发送指令')
      return
    }
    const payload = `${String.fromCharCode(_cid.length)}${_cid}${order}`
    client.publish(`d/${_deviceId}/i`, payload)
    console.log(`[MQTT] 已发送指令到 d/${_deviceId}/i`)
  }

  /**
   * 发送广播消息（语音播报等），JSON 加密后通过 MQTT 发送
   * @param {Object} json - 广播内容，如 { broadcastid: "xx" }
   */
  function sendBroadcast(json) {
    if (!client || !client.connected) {
      console.warn('[MQTT] 未连接，无法发送广播')
      return
    }
    if (!_secretKey) {
      console.warn('[MQTT] 无密钥，无法加密广播')
      return
    }
    const encrypted = encryptBroadcast(json, _secretKey)
    const payload = `${String.fromCharCode(_cid.length)}${_cid}${encrypted}`
    client.publish(`d/${_deviceId}/i`, payload)
    console.log(`[MQTT] 已发送广播:`, json, `→ 密文(前40): ${encrypted.slice(0, 40)}... → d/${_deviceId}/i`)
  }

  /** 发送查询命令，触发设备上报状态 */
  function queryDeviceStatus() {
    if (!client || !client.connected) {
      console.warn('[MQTT] 未连接，无法查询')
      return
    }
    if (!_secretKey) {
      console.warn('[MQTT] 无密钥，无法加密查询命令')
      return
    }
    // 第一批：核心状态
    const cmd1 = buildStatusQueryV3()
    const enc1 = encryptMqttOrder(cmd1, _secretKey)
    const payload1 = `${String.fromCharCode(_cid.length)}${_cid}${enc1}`
    client.publish(`d/${_deviceId}/i`, payload1)
    console.log('[MQTT] 已发送状态查询(1/2)')

    // 第二批：扩展功能（延迟 500ms 避免拥堵）
    setTimeout(() => {
      if (!client || !client.connected) return
      const cmd2 = buildStatusQueryV3Part2()
      const enc2 = encryptMqttOrder(cmd2, _secretKey)
      const payload2 = `${String.fromCharCode(_cid.length)}${_cid}${enc2}`
      client.publish(`d/${_deviceId}/i`, payload2)
      console.log('[MQTT] 已发送状态查询(2/2)')
    }, 500)
  }

  /** 断开连接 */
  function disconnect() {
    if (client) {
      client.end(true)
      client = null
    }
  }

  /** 更新当前设备 ID */
  function updateDeviceId(newDeviceId) {
    _deviceId = newDeviceId
  }

  /** 更新加密密钥 */
  function updateSecretKey(newKey) {
    _secretKey = newKey
  }

  return {
    get client() { return client },
    disconnect,
    sendCommand,
    sendBroadcast,
    queryDeviceStatus,
    updateDeviceId,
    updateSecretKey,
    fetchSecretKey,
  }
}
