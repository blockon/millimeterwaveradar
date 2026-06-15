#!/bin/bash
# 毫米波雷达控制端 - Android TV APK 构建脚本
# 依赖：Node.js、Android Studio（或 Android SDK + Gradle）

set -e

echo "========================================="
echo "  毫米波雷达控制端 APK 构建脚本"
echo "========================================="

# 第一步：构建前端
echo ""
echo "[1/3] 构建前端（生产模式）..."
npm run build

# 第二步：同步到 Android 项目
echo ""
echo "[2/3] 同步前端资源到 Android..."
npx cap sync android

# 第三步：构建 APK
echo ""
echo "[3/3] 构建 Android APK..."
cd android

# 检查是否有 Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo ""
    echo "⚠️  未检测到 Android SDK 环境变量。"
    echo "    请先安装 Android Studio 或设置 ANDROID_HOME 环境变量。"
    echo "    也可用 Android Studio 打开 android/ 目录手动构建。"
    exit 1
fi

# Debug APK
./gradlew assembleDebug

echo ""
echo "========================================="
echo "  构建完成！"
echo "  APK 路径: android/app/build/outputs/apk/debug/app-debug.apk"
echo "========================================="
echo ""
echo "安装到电视："
echo "  1. 将 APK 文件复制到 U 盘"
echo "  2. 插入电视 USB 接口"
echo "  3. 用文件管理器打开安装"
echo ""
echo "或通过 ADB 安装："
echo "  adb install android/app/build/outputs/apk/debug/app-debug.apk"
