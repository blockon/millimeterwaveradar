# Vue 3 + Vite + Vant4 + Pinia(已添加本地持久化插件) + router

# vue3 用 Volar 代码提示

# Vant 已经覆盖主题直接用

# postcss-px-to-viewport 进行着自适应px自动转换vw、vh

# 格式化安装 prettier 插件，已有配置文件（.prettierrc.js）

# 样式尽量用 classtocss(vscode插件) 自动生成（全局去重生成到classtocss_global.css中，如w-100 自动生成width:100px）

## 桌面端打包

项目已接入 Electron，适合给没有 Node/npm 环境的电脑直接运行，并且可用于现场和雷达设备通信。

### macOS

在 Mac 电脑执行：

```bash
npm install
npm run electron:build:mac
```

产物在 `build-electron` 目录：

- `毫米波雷达-1.0.0-mac-arm64.zip`：Apple Silicon 芯片 Mac
- `毫米波雷达-1.0.0-mac-x64.zip`：Intel 芯片 Mac

如果需要 dmg，可以执行：

```bash
npm run electron:build:mac:dmg
```

### Windows

在 Windows 电脑执行：

```bash
npm install
npm run electron:build:win
```

产物在 `build-electron` 目录：

- `毫米波雷达-1.0.0-win-x64.exe`：Windows 安装包或绿色版
- `win-unpacked`：免安装目录版

### 注意

Mac 包和 Windows 包建议分别在对应系统上构建。当前配置使用本机 `node_modules/electron/dist` 中的 Electron 运行时，便于离线或内网环境打包；如果要在一台机器上跨平台构建，需要额外准备对应平台的 Electron 运行时或允许 Electron Builder 下载依赖。
