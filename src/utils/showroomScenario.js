/**
 * 展厅场景引擎 — 基于 60GHz 毫米波雷达的自适应空调场景
 *
 * 雷达 action 映射:
 *   4 = 静坐, 8 = 平躺, 3 = 挥手(挥拳), 6 = 下蹲, 5 = 起身
 *
 * 不做: 大屏弹窗
 * 语音: 占位 (voiceText 已存好, 后续通过 MQTT 发送语音播报指令)
 *
 * 用法:
 *   import { createShowroomScenario } from '@/utils/showroomScenario'
 *   const scenario = createShowroomScenario((cmd) => deviceStore.sendCommand(cmd))
 *   // 雷达数据到达时:
 *   scenario.handleActions(latestActions.value)
 *   // 读取当前场景/语音:
 *   scenario.currentScenario  // ref
 *   scenario.voiceText        // ref
 */

import { ref } from 'vue'

// ==================== 配置表 ====================

/** action → 场景名 */
export const ACTION_TO_SCENARIO = {
  4: 'sitting',    // 静坐
  8: 'lying',      // 平躺
  3: 'waving',     // 挥手/挥拳
  6: 'squatting',  // 下蹲
  5: 'standing',   // 起身
}

/** 场景 → AC 协议指令 (直接喂给 deviceStore.sendCommand) */
export const SCENARIO_AC_COMMANDS = {
  sitting: {
    settemp: 260,               // 26°C
    mark: 2,                    // 低风
    radarWindAvoidPeople: 0,    // 退出风避人 (从挥拳/下蹲/起身恢复)
  },
  lying: {
    settemp: 270,               // 27°C (升温)
    mark: 1,                    // 微风 (最低风速)
    radarWindAvoidPeople: 0,    // 退出风避人
  },
  waving: {
    mark: 4,                    // 高风
    radarWindAvoidPeople: 1,    // 风避人吹
  },
  squatting: {
    radarWindAvoidPeople: 1,    // 风避人吹
  },
  standing: {
    radarWindAvoidPeople: 1,    // 风避人吹
  },
}

/** 场景 → 语音播报文本 (占位, 后续通过 MQTT 发送) */
export const SCENARIO_VOICE = {
  sitting: '检测到您当前处于静坐状态，空调进入"恒温低风"模式。',
  lying: '已开启睡眠模式，我将安静地为您送风。',
  waving: '活跃满满，为您加快全屋空气循环。',
  squatting: '检测到您处于"下蹲"姿态，为您避开直吹的冷风。',
  standing: '检测到您处于"起身"姿态，为您避开直吹的冷风。',
}

/** 场景变化去抖 (ms) — 同一场景变化需间隔这个时间才重新发指令 */
const DEBOUNCE_MS = 2500

// ==================== 场景管理器 ====================

/**
 * @param {Function} sendCommand - deviceStore.sendCommand
 * @param {Object} [options]
 * @param {number} [options.debounceMs=2500]
 */
export function createShowroomScenario(sendCommand, options = {}) {
  const debounceMs = options.debounceMs ?? DEBOUNCE_MS

  const currentScenario = ref(null)  // 当前场景名
  const voiceText = ref('')          // 语音文本占位
  let lastScenario = null
  let lastScenarioTime = 0
  let lastSentCmdKey = null

  /**
   * 从雷达 action 数组中取主导动作码
   */
  function dominantAction(actions) {
    if (!actions || !actions.length) return null
    const c = new Map()
    for (const a of actions) c.set(a, (c.get(a) || 0) + 1)
    let best = null, max = 0
    for (const [a, n] of c) { if (n > max) { max = n; best = a } }
    return best
  }

  /**
   * 核心入口 — 雷达 action 数据到达时调用
   * @param {number[]} actions - latestActions.value
   */
  function handleActions(actions) {
    const action = dominantAction(actions)
    const scenario = ACTION_TO_SCENARIO[action]
    if (!scenario) return

    // 同一场景去抖
    const now = Date.now()
    if (scenario === lastScenario && now - lastScenarioTime < debounceMs) return

    lastScenario = scenario
    lastScenarioTime = now
    currentScenario.value = scenario

    // 语音文本
    voiceText.value = SCENARIO_VOICE[scenario] || ''
    console.log(`[展厅] 场景: ${scenario} | 语音: ${voiceText.value}`)

    // 空调指令
    const cmd = SCENARIO_AC_COMMANDS[scenario]
    if (!cmd || !sendCommand) return

    const cmdKey = JSON.stringify(cmd)
    if (cmdKey === lastSentCmdKey) {
      console.log('[展厅] 指令未变化，跳过')
      return
    }
    lastSentCmdKey = cmdKey
    console.log('[展厅] → AC:', cmd)
    sendCommand(cmd)
  }

  return { currentScenario, voiceText, handleActions }
}
