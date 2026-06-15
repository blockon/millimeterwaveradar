package com.mmradar.controller;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 电视端保持屏幕常亮
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // 获取 WebView 并配置关键参数
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // 启用 JavaScript（必须）
        settings.setJavaScriptEnabled(true);
        // 启用 DOM 存储（Vue 路由 / Pinia 持久化 需要）
        settings.setDomStorageEnabled(true);
        // 允许文件访问（加载本地静态资源）
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        // 自动播放音视频（无需用户手势）
        settings.setMediaPlaybackRequiresUserGesture(false);
        // 自适应屏幕
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        // 允许混合内容（解决部分 HTTP 资源加载问题）
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        // 启用调试（生产构建时注释掉）
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
