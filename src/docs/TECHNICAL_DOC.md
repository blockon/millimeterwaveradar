# 毫米波雷达控制端 — 技术文档

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [系统架构](#系统架构)
- [双通道通信模型](#双通道通信模型)
- [设备控制流程](#设备控制流程)
- [通信协议详解](#通信协议详解)
- [雷达数据处理](#雷达数据处理)
- [三维可视化渲染](#三维可视化渲染)
- [状态管理](#状态管理)
- [环境配置](#环境配置)
- [构建与运行](#构建与运行)
- [Electron 桌面端](#electron-桌面端)
- [关键设计决策](#关键设计决策)
- [已知限制与改进方向](#已知限制与改进方向)

---

## 项目概述

本项目是一个基于 60GHz 毫米波雷达的智能空调控制端应用，用于展厅场景演示。应用通过局域网 HTTP 通信控制空调本体，同时通过云端 WebSocket 接收毫米波雷达的实时人体检测数据（骨架关节点、点云），实现"风随人动""风避人吹""人近风柔"三种智能出风模式的可视化展示。

**核心能力：**

- 空调设备状态轮询与控制指令下发（局域网 HTTP）
- 毫米波雷达实时数据接收与解析（云端 WebSocket）
- 人体骨架与点云的 Three.js 三维渲染
- 雷达联动出风模式控制（风随人动、风避人吹、人近风柔）
- Electron 桌面端打包（Windows 安装包 / 便携版）

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3（Composition API） | 3.2.37 |
| 构建工具 | Vite | 3.2.5 |
| UI 组件库 | Vant 4 | 4.0.1 |
| 状态管理 | Pinia + pinia-plugin-persistedstate | 2.0.22 |
| 路由 | Vue Router 4（Hash 模式） | 4.0.13 |
| HTTP 客户端 | axios | 0.27.2 |
| 三维渲染 | Three.js | ^0.181.0 |
| 图表 | ECharts | 5.4.0 |
| 动画 | SVGAPlayer Web | 2.3.2 |
| 桌面端 | Electron + electron-builder | ^33.2.1 |
| CSS 预处理 | Sass | 1.55.0 |
| 适配方案 | postcss-px-to-viewport（设计宽度 3840px） | 1.1.1 |
| 自动导入 | unplugin-auto-import + unplugin-vue-components | — |
| 调试工具 | vConsole | 3.14.7 |

---

## 目录结构

```
millimeterwaveradar/
├── electron/                    # Electron 桌面端
│   ├── main.cjs                 # 主进程（窗口管理、IPC）
│   └── preload.cjs              # 预加载脚本（contextBridge 桥接）
├── public/
│   ├── lib/                     # Cordova 兼容脚本
│   └── svga/                    # SVGA 动画资源（出风动画）
├── src/
│   ├── api/                     # 网络请求层
│   │   ├── request.js           # axios 实例与拦截器
│   │   └── commonApi.js         # 云端业务 API（设备管理、协议 JS 下载）
│   ├── assets/imgs/             # 图片资源（80 张 PNG）
│   ├── components/              # 通用组件
│   │   ├── ThreeStickmanView.vue    # Three.js 3D 渲染组件
│   │   ├── AppPage.vue              # 页面布局容器（BetterScroll）
│   │   ├── AppTitleBar.vue          # 标题栏
│   │   ├── AppBottomPopup.vue       # 底部弹窗
│   │   ├── CommonSeting.vue         # 设备设置面板
│   │   ├── AppSvgaPlayer.vue        # SVGA 动画播放器
│   │   ├── AppNumTransition.vue     # 数字过渡动画
│   │   └── AppEmpty.vue             # 空状态占位
│   ├── config/                  # 配置
│   │   ├── deviceApi.js         # 局域网设备 HTTP 地址解析
│   │   └── radarApi.js          # 雷达云端 HTTP/WebSocket 地址
│   ├── constants/
│   │   └── cocoKpts.js          # COCO 17 关键点定义（骨架边、颜色映射）
│   ├── page/
│   │   ├── home/index.vue       # 主页面（雷达连接、数据展示、控制入口）
│   │   └── setting/index.vue    # 设置页面
│   ├── rendering/
│   │   └── StickmanScene.js     # Three.js 场景管理（897 行）
│   ├── store/                   # Pinia 状态管理
│   │   ├── deviceStore.js       # 设备状态与控制指令发送
│   │   └── networkStore.js      # 网络状态
│   ├── style/                   # 全局样式
│   │   ├── index.scss           # 样式入口
│   │   ├── reset.scss           # CSS 重置
│   │   ├── _variables.scss      # SCSS 变量与 Mixin
│   │   └── vantTheme.scss       # Vant 主题覆盖
│   ├── useHooks/
│   │   └── usePopupBack.js      # 浏览器返回关闭弹窗
│   └── utils/                   # 工具函数
│       ├── analysis.js          # 核心协议编解码（3467 行，V3.27）
│       ├── binaryToString.js    # WebSocket 二进制转字符串
│       ├── BoneController.js    # Three.js 骨骼控制器
│       ├── nativeActions.js     # Cordova 原生桥接
│       ├── parse_compressed_pcloud.js  # 压缩点云解码
│       ├── radarPersonMetrics.js      # 人体距离/角度计算
│       ├── eventBus.js          # mitt 事件总线
│       ├── tools.js             # 通用工具
│       └── login/sessionManager.js    # 会话管理（24 小时过期）
├── .env.dev                     # 开发环境变量
├── .env.test                    # 测试环境变量
├── .env.pro                     # 生产环境变量
├── vite.config.js               # Vite 构建配置
├── package.json                 # 项目依赖与脚本
└── index.html                   # HTML 入口
```

---

## 系统架构

系统采用 **双通道并行** 架构，两条数据通道独立运行，在 UI 层合并展示：

```
┌─────────────────────────────────────────────────────────────┐
│                        前端应用（Vue 3）                      │
│                                                             │
│  ┌──────────────────┐          ┌──────────────────────────┐ │
│  │   主页面 home/     │          │  ThreeStickmanView 组件  │ │
│  │  · 空调状态展示    │          │  · 骨架渲染              │ │
│  │  · 控制面板       │          │  · 点云渲染              │ │
│  │  · 出风模式切换    │          │  · 扇形地面              │ │
│  └────────┬─────────┘          └────────────┬─────────────┘ │
│           │                                 │               │
│  ┌────────▼─────────┐          ┌────────────▼─────────────┐ │
│  │  deviceStore      │          │  StickmanScene.js        │ │
│  │  · sendComand()   │          │  · Three.js 场景管理     │ │
│  │  · 状态管理       │          │  · 骨骼/点云/标签渲染    │ │
│  └────────┬─────────┘          └────────────▲─────────────┘ │
│           │                                 │               │
│  ┌────────▼─────────────────────────────────┴─────────────┐ │
│  │              analysis.js（协议编解码引擎）               │ │
│  │  · fromDevice(): 设备数据 → JSON                        │ │
│  │  · toDevice():   JSON → 控制指令                        │ │
│  │  · commandTypeSet: 100+ 属性编码映射                     │ │
│  └────────┬─────────────────────────────────▲─────────────┘ │
└───────────┼─────────────────────────────────┼───────────────┘
            │                                 │
   ┌────────▼──────────┐          ┌───────────┴──────────┐
   │  通道 A：局域网 HTTP │          │ 通道 B：云端 WebSocket │
   │  POST /api/getData  │          │ wss://mmradar.../ws/ │
   │  每 500ms 轮询       │          │ 实时推送              │
   └────────┬──────────┘          └───────────┬──────────┘
            │                                 │
   ┌────────▼──────────┐          ┌───────────▼──────────┐
   │   空调设备（WiFi）   │          │  60GHz 毫米波雷达      │
   │  192.168.1.1:8089   │          │  （云端转发）          │
   └───────────────────┘          └──────────────────────┘
```

---

## 双通道通信模型

### 通道 A：局域网 HTTP — 空调本体控制

| 项目 | 说明 |
|------|------|
| 协议 | HTTP POST |
| 地址 | `http://192.168.1.1:8089/api/getData` |
| 频率 | 每 500ms 轮询一次 |
| 数据格式 | 十六进制字符串（55AA 帧头二进制协议） |
| 开发代理 | Vite dev server `/api` → `http://192.168.1.1:8089` |
| 配置来源 | `.env.*` 文件中 `VITE_LOCAL_DEVICE_HOST` / `VITE_LOCAL_DEVICE_PORT` |

### 通道 B：云端 WebSocket — 雷达数据流

| 项目 | 说明 |
|------|------|
| 协议 | WebSocket (WSS) |
| 地址 | `wss://mmradar.inchitech.com/v2/ws/` |
| 认证 | JSON 消息发送 `deviceID` + `token` |
| 数据格式 | 二进制 Blob → 文本 → JSON |
| 开发代理 | Vite dev server `/radar-ws` → `wss://mmradar.inchitech.com` |
| 配置来源 | `.env.*` 文件中 `VITE_RADAR_HTTP_BASE` |

---

## 设备控制流程

### 数据上报（设备 → 前端展示）

```
空调设备
  │
  ▼
① 每 500ms 发起 POST /api/getData（局域网 HTTP）
  │
  ▼
② 返回十六进制字符串数据
  │
  ▼
③ dealData(data) 调用 P_8009369.fromDevice(data)
  │  内部调用链: fromDevice → protocolToCommon → pri2chs
  │
  ▼
④ pri2chs() 解析 55AA 帧头协议
  │  · 检查帧头 0x55 0xAA
  │  · 解析长度、命令号（23=全状态上报, 25/27=故障, 26=保护）
  │  · ParserMessage() 按组号+属性号逐个解析属性值
  │    - 组号 1: 空调控制（开关机/模式/温度/风速）
  │    - 组号 2: 运行状态
  │    - 组号 3: 出风控制（防直吹/扫风/雷达模式）
  │    - 组号 5: 维护管理
  │    - 组号 6: 环境参数（室温/湿度）
  │  · 返回 JSON: { method:"update", state: { reported: {...} } }
  │
  ▼
⑤ dealData() 解析 reported 对象，更新 devData 响应式状态
  │  power, speed, swing_mode, set_temper
  │  radarWindFollowPeople, radarWindAvoidPeople, radarPeopleNearSoftWind
  │  radarTargetCount, radarTarget1Angle/Speed/Distance
  │
  ▼
⑥ Vue 模板响应式渲染：空调状态、摆风动画、人体位置
```

### 控制指令下发（前端 → 设备）

```
用户操作 / 前端逻辑
  │
  ▼
① deviceStore.sendComand(command)
  │  command 示例: { power: 1, mode: 2, settemp: 260, mark: 3 }
  │
  ▼
② 构造控制消息体
  │  { version: 1, commandId: 256, timestamp: Date.now(), ...command }
  │
  ▼
③ JsFunction.toDevice(json)  →  调用 analysis.js 中的 toDevice()
  │
  ▼
④ toDevice() → commonToProtocol(cid, sn, payload)
  │
  ▼
⑤ commonToProtocol()
  │  · 判断 method: "control" 或直接属性
  │  · 调用 chs2biz(payload) → buildCommands(json)
  │
  ▼
⑥ buildCommands() 构造二进制协议帧
  │  · 帧头: 0x55 0xAA
  │  · 帧长度 (1 byte)
  │  · 命令号: 0x18（属性设置）
  │  · 遍历 JSON 键值:
  │    - 查 commandTypeSet 映射表得到属性编码（如 power=0x0100）
  │    - 按属性类型编码值（1byte / 2byte / 4byte / 特殊格式）
  │  · 计算校验和 (2 bytes)
  │  · 转为 hex 字符串返回
  │
  ▼
⑦ 构造 SDK 调用 action
  │  {
  │    action: "INVOKE_SDK_FUNCTION",
  │    functions: [{
  │      ParameterList: [
  │        { type: "STRING", value: <hex指令> },
  │        { type: "STRING", value: <设备SN> }
  │      ],
  │      name: "sendAsyncRawCommand"
  │    }]
  │  }
  │
  ▼
⑧ ToNativeBridge.sendDataToNative(action)
  → 原生桥接层 → WiFi 模块透传 → 空调电控解析执行
```

---

## 通信协议详解

### 协议帧格式

协议基于二进制帧，帧头 `0x55 0xAA`，定义在 `src/utils/analysis.js` 中（V3.27 版本）。

**帧结构：**

```
┌──────┬──────┬──────┬──────────┬──────────────┬──────────┬──────────┐
│ 0x55 │ 0xAA │ 长度  │ 命令号     │   数据域       │ 校验和高位 │ 校验和低位 │
│ 1B   │ 1B   │ 1B   │ 1B       │   N bytes     │ 1B       │ 1B       │
└──────┴──────┴──────┴──────────┴──────────────┴──────────┴──────────┘
```

**命令号定义：**

| 命令号 | 含义 | 方向 |
|--------|------|------|
| 0x17 (23) | 全状态上报 | 设备 → 前端 |
| 0x18 (24) | 属性设置 | 前端 → 设备 |
| 0x19 (25) | 故障信息 | 设备 → 前端 |
| 0x1A (26) | 保护信息 | 设备 → 前端 |
| 0x1B (27) | 故障信息（扩展） | 设备 → 前端 |
| 0x1E (30) | 硬件信息 | 设备 → 前端 |
| 0x20 (32) | 设备 SN | 设备 → 前端 |
| 0x21 (33) | 型号信息 | 设备 → 前端 |
| 0x15 (21) | WiFi 信息 | 设备 → 前端 |

### 属性编码格式

属性采用 **组号 + 属性号** 的二维编码，存储为 `0xGGNN`（高字节=组号，低字节=属性号）。

**属性分组：**

| 组号 | 功能域 | 示例属性 |
|------|--------|----------|
| 0 | 设备信息 | 物料号、版本号 |
| 1 | 空调控制 | 开关机(0x0100)、模式(0x0102)、温度(0x0103)、风速(0x0104) |
| 2 | 运行状态 | 运行模式、当前温度 |
| 3 | 出风控制 | 防直吹(0x0305)、上下扫风(0x0306)、左右扫风(0x0307)、风避人(0x0317)、风随人(0x0318)、人近风柔(0x0319)、雷达传感器(0x031A) |
| 4 | 增强功能 | — |
| 5 | 维护管理 | 滤网寿命、用电量 |
| 6 | 环境参数 | 室内温度、湿度 |
| 7 | 高级配置 | — |
| 8 | 新风功能 | — |
| 9 | 诊断信息 | — |
| 10 | 调试信息 | — |
| 11 | AI 功能 | — |

### 核心编解码函数

| 函数 | 位置 | 功能 |
|------|------|------|
| `pri2chs()` | analysis.js:3271 | 设备数据入口：解析 hex 帧，按命令号分发处理 |
| `ParserMessage()` | analysis.js:1471 | 全状态上报解析：按组号+属性号遍历提取属性值 |
| `buildCommands()` | analysis.js:2919 | 控制指令构造：JSON 属性 → 55AA 协议帧 hex 字符串 |
| `chs2biz()` | analysis.js:3379 | 云端到设备转换：JSON payload → hex 指令 |
| `commonToProtocol()` | analysis.js:3404 | 通用协议转换：处理 "control" 和 "command" 两种方法 |
| `fromDevice()` | analysis.js:240 | 设备到通用格式入口 |
| `toDevice()` | analysis.js:246 | 通用格式到设备入口 |

### 故障与保护解析

协议定义了完整的故障码表（`faultsKeyTable`，128 个故障索引）和保护码表（`protectKetTable`，64 个保护索引），每个索引映射到一个错误代码字符串（如 `E1`、`E2`、`F1`），再映射到中文故障描述（如"室温传感器故障""高压保护"）。

---

## 雷达数据处理

### 数据流

```
毫米波雷达云端 (wss://mmradar.inchitech.com/v2/ws/)
  │
  ▼
WebSocket 连接建立后发送初始化消息:
  { deviceID, type: "1", token, content: "start" }
  │
  ▼
接收二进制 Blob 消息
  │
  ▼
binaryToString(): Blob → FileReader → 文本字符串
  │
  ▼
JSON.parse 解析，提取以下字段:
  · track_id[]     — 目标跟踪 ID 数组
  · kpts[]         — 骨架关节点数据（COCO 17 关键点，每点 [x, y] 坐标）
  · rawpc          — 压缩点云数据（十六进制编码）
  · RadarParams    — 雷达参数（安装位置 radarX_room, radarY_room）
  │
  ├──────────────────────┐
  ▼                      ▼
骨架数据处理              点云数据处理
  │                      │
  ▼                      ▼
kpts → StickmanScene    parseCompressedPcloud(rawpc)
· 渲染线条骨架           · hex → 字节数组 → Int16Array
· 渲染 GLTF 模型        · 每值除以 1000.0 得到米制坐标
· CSS2D 距离标签         · 返回 [[x, y, z, v, p], ...]
                         │
                         ▼
                      StickmanScene 渲染 InstancedMesh 点云
```

### 人体目标指标计算

`radarPersonMetrics.js` 提供以下核心函数：

| 函数 | 功能 |
|------|------|
| `kptJointToSceneXZ()` | 将关节点数据转换为场景水平坐标 (x, z) |
| `horizontalDistanceFromOriginXZ()` | 计算水平距离（欧几里得距离） |
| `getFloorOriginXZFromRadarParams()` | 从雷达参数计算扇形地面圆心坐标 |
| `horizontalAngleDegFromXZ()` | 计算水平角度（0-360 度） |
| `buildNearestRadarPersonRows()` | 构建最近 N 人的距离/角度排序列表 |

---

## 三维可视化渲染

### StickmanScene.js（897 行）

基于 Three.js 的 3D 场景管理器，负责渲染雷达检测到的人体骨架和点云数据。

**场景组成：**

| 元素 | 实现方式 | 说明 |
|------|----------|------|
| 扇形地面 | `RingGeometry` + `LineSegments` | 120 度检测范围可视化，含虚线弧线、射线、渐变、距离标签 |
| 雷达指示器 | `CylinderGeometry` + `ConeGeometry` | 雷达安装位置标记 |
| 人体骨架（线条） | `LineSegments` + `CircleGeometry` | 线段骨架 + 彩色关节（胸/臂/腿不同颜色）+ 头部圆圈 |
| 人体骨架（模型） | GLTF 模型 + `BoneController` | 驱动骨骼旋转，支持身体朝向、比例调整、帧间平滑 |
| 点云 | `InstancedMesh`（最多 10 万个球体） | 时间队列平滑，避免点云闪烁 |
| 距离标签 | `CSS2DRenderer` | 每个人体目标的距离标签 |

**关键配置参数：**

- `roomDepth`: 房间深度（米），影响坐标系映射
- `showSkeleton`: 是否显示骨架
- `showPointCloud`: 是否显示点云
- `skeletonMode`: 骨架模式（`"line"` 线条 / `"model"` GLTF 模型）
- `showSectorFloor`: 是否显示扇形地面
- `sectorFloorIdle`: 扇形地面空闲状态

### COCO 17 关键点定义

`constants/cocoKpts.js` 定义了标准 COCO 人体姿态估计的 17 个关键点：

```
鼻子(0) → 左眼(1) → 右眼(2) → 左耳(3) → 右耳(4)
左肩(5) → 右肩(6)
左肘(7) → 右肘(8) → 左腕(9) → 右腕(10)
左髋(11) → 右髋(12)
左膝(13) → 右膝(14) → 左踝(15) → 右踝(16)
```

身体部位颜色映射：头部（红）、胸部（蓝）、手臂（绿）、腿部（黄）。

---

## 状态管理

### deviceStore（Pinia）

```javascript
state: {
  deviceInfo: {},     // 设备信息（SN、分类等）
  deviceState: {},    // 设备状态（空调参数）
  deviceList: [],     // 设备列表
}

actions: {
  getOne()            // 从云端下载协议解析 JS，eval 挂载到 window.JsFunction
  sendComand(command) // 发送控制指令（构造消息体 → 编码 → 原生桥接发送）
}
```

### 网络状态

`networkStore` 跟踪网络错误状态（`'200'` 正常 / `'404'` 网络错误），由 axios 响应拦截器自动更新。

### 会话管理

`sessionManager.js` 使用 `sessionStorage` + `localStorage` 管理登录会话，24 小时自动过期。

---

## 环境配置

项目支持三种环境模式，通过 `.env.*` 文件配置：

| 变量 | 说明 | dev | test | pro |
|------|------|-----|------|-----|
| `NODE_ENV` | 环境标识 | `dev` | `test` | `pro` |
| `VITE_BASE_URL` | 云端业务 API 基础地址 | `https://test-envsplit.mymlsoft.com/` | 同 dev | `.../saserver/` |
| `VITE_LOCAL_DEVICE_HOST` | 局域网设备 IP | `192.168.1.1` | 同 dev | 同 dev |
| `VITE_LOCAL_DEVICE_PORT` | 局域网设备端口 | `8089` | 同 dev | 同 dev |
| `VITE_LOCAL_DEVICE_API_BASE` | 局域网设备完整地址 | `http://192.168.1.1:8089` | 同 dev | 同 dev |
| `VITE_RADAR_HTTP_BASE` | 雷达云端基础地址 | `https://mmradar.inchitech.com` | 同 dev | 同 dev |

### Vite 开发代理

开发模式下，Vite dev server 提供三个代理规则：

| 前缀 | 目标 | 用途 |
|------|------|------|
| `/api` | `http://192.168.1.1:8089` | 局域网设备 HTTP 通信 |
| `/radar-api` | `https://mmradar.inchitech.com` | 雷达云端 HTTP API |
| `/radar-ws` | `wss://mmradar.inchitech.com` | 雷达云端 WebSocket |

---

## 构建与运行

### 开发模式

```bash
# 仅 Web 开发（Vite dev server，端口 1573）
npm run dev

# Electron + Web 联调
npm run electron:dev

# 测试环境
npm run test
```

### 生产构建

```bash
# Web 构建（输出到 www/controllPage/html/）
npm run build

# Electron 打包（输出到 build-electron/）
npm run electron:build

# 构建测试环境版本
npm run build:test
```

### 设计适配

- 设计稿宽度：**3840px**
- 适配方案：`postcss-px-to-viewport` 自动将 px 转换为 vw 单位
- 目标浏览器：Chrome 52+（通过 `@vitejs/plugin-legacy` 提供 polyfill）

---

## Electron 桌面端

### 主进程（electron/main.cjs）

- 创建无边框窗口（1280×800，`frame: false`）
- 启用 `contextIsolation`，禁用 `nodeIntegration`
- 开发模式加载 `http://localhost:1573`，生产模式加载构建产物
- 单实例锁定（`app.requestSingleInstanceLock()`）
- 快捷键：F11 全屏切换，F12 / Ctrl+Shift+I 打开开发者工具

### IPC 通信

| 渲染进程调用 | 主进程处理 |
|-------------|-----------|
| `window:toggleFullscreen` | 切换全屏 |
| `window:setFullScreen` | 设置全屏状态 |
| `window:minimize` | 最小化窗口 |
| `window:maximizeToggle` | 切换最大化 |
| `window:close` | 关闭窗口 |
| `window:getState` | 获取窗口状态 |
| `window:state`（推送） | 主进程主动推送窗口状态变化 |

### 预加载脚本（electron/preload.cjs）

通过 `contextBridge.exposeInMainWorld` 暴露 `window.electronAPI`，提供以下方法：

- `platform` — 平台标识
- `toggleFullscreen()` — 切换全屏
- `setFullScreen(enabled)` — 设置全屏
- `minimizeWindow()` — 最小化
- `maximizeToggle()` — 切换最大化
- `closeWindow()` — 关闭
- `getWindowState()` — 获取状态
- `onWindowState(callback)` — 订阅状态变化

---

## 关键设计决策

### 1. 协议解析器动态加载

`deviceStore.getOne()` 通过 `commonApi.getJs(materialCode)` 从云端下载设备特定的协议解析 JS 文件，使用 `eval` 挂载到 `window.JsFunction`。这使得同一应用可以支持不同型号的空调设备。

> **注意：** 当前 `home/index.vue` 直接 import 了 `P_8009369`（物料号 8009369 的解析器），绕过了动态加载机制。

### 2. 双通道独立运行

局域网 HTTP 轮询和云端 WebSocket 各自独立，互不依赖。HTTP 通道负责空调状态和控制，WebSocket 通道负责雷达实时数据。两者在 UI 层合并展示，任一通道故障不影响另一通道。

### 3. 无串口通信

项目不涉及任何串口通信。设备通信完全通过局域网 HTTP（空调本体）和云端 WebSocket（雷达数据）完成。控制指令通过原生桥接层（`ToNativeBridge`）发送到 WiFi 模块，再由 WiFi 模块透传给空调电控。

### 4. Electron 仅做窗口管理

Electron 主进程不参与任何设备通信逻辑，仅负责窗口创建、全屏管理、IPC 事件转发。设备通信全部在渲染进程（Vue 应用）中完成。

### 5. 大视口适配

设计稿宽度为 3840px，通过 `postcss-px-to-viewport` 自动转换为 vw 单位，适配大尺寸展厅屏幕。

---

## 已知限制与改进方向

| 类别 | 现状 | 改进建议 |
|------|------|----------|
| 协议解析 | 使用 `eval` 动态执行远程 JS | 改用 JSON Schema 定义协议映射，消除 `eval` 安全风险 |
| 协议硬编码 | `home/index.vue` 直接 import `P_8009369` | 恢复通过 `deviceStore.getOne()` 动态加载 |
| 错误处理 | 网络错误仅显示 toast | 增加重连机制、断线重试、状态降级 |
| 数据同步 | 两条通道独立推送，无同步机制 | 增加时间戳对齐，确保 UI 展示一致性 |
| 路由路径 | `/seting` 拼写错误 | 修正为 `/setting` 并做兼容跳转 |
| 类型安全 | 纯 JavaScript，无 TypeScript | 关键模块（协议编解码、状态管理）增加类型定义 |
| 测试覆盖 | 无单元测试 | 对 `analysis.js` 协议编解码增加边界测试 |
