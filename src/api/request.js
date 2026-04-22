/*
 * @Author: chuan.wang chuan.wang@changhong.com
 * @Date: 2023-02-15 18:14:52
 * @LastEditors: chuan.wang chuan.wang@changhong.com
 * @LastEditTime: 2024-01-23 13:32:06
 * @FilePath: \MeilingSmartHome-NewOperationd:\虹美公司\project\2023\MillimeterWaveRadar\src\api\request.js
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
 */
/*
 * @Description: 请求拦截封装
 */
import axios from 'axios'
import { showToast, showLoadingToast } from 'vant'
export const http = axios.create({
  baseURL: ``, // api 的 base_url
  timeout: 15000, // 请求超时时间
})

let requestNum = 0
let loading = null
http.interceptors.request.use(
  (config) => {
    // 需要特殊处理的请求
    if (config.showLoading) {
      loading = showLoadingToast({ duration: 100000000 })
      requestNum++
    }
    if (!config.skipWindowBase && window.baseURL) {
      config.baseURL = window.baseURL
    }
    return config
  },
  (error) => Promise.reject(error)
)

http.interceptors.response.use(
  ({ data }) => {
    networkStore.networkError = '200'
    const res = data;
    return data
  },
  ({ message }) => {
    if (--requestNum <= 0 && !!loading) loading.close()

    if (message === 'Network Error') {
      networkStore.networkError = '404'
    } else {
      showToast({ message: message || '服务器错误', position: 'bottom', duration: 5000 })
    }

    return Promise.reject(message)
  }
)
