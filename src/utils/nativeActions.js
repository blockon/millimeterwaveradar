export const NativeActions = {

  /**
   * @description: 退出UI包
   * @return {*}
   */
  exit() {
    ToNativeBridge.sendDataToNative({
      action: 'ACTIVITY_CONTROL_FINISH',
    })
  },

  /**
   * @description: 检查Cordova是加载成功
   */
  checkCordova() {
    return new Promise((resolve, reject) => {
      let count = 0
      const inter = setInterval(() => {
        if (typeof ToNativeBridge === 'object' && typeof DataTransport === 'object') {
          clearInterval(inter)
          console.log('加载Cordova成功')
          resolve(true)
        } else {
          count++
          if (count === 100) {
            reject(false)
            clearInterval(inter)
            console.log('加载Cordova失败')
          }
        }
      }, 100)
    })
  },

  /**
   * @description: 原生init获取数据
   */
  getDeviceInfo() {
    return new Promise((resolve, reject) => {
      ToNativeBridge.initData(
        [{ action: 'INVOKE_GET_DEVICEINFO' }],
        (result) => {
          resolve(result)
        },
        (err) => {
          reject(err)
        }
      )
    })
  },
}
