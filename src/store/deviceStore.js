
export const deviceStore = defineStore('deviceStore', {
  state: () => ({
    deviceInfo: {},
    deviceState: {},
    deviceList: [], // 设备列表
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
    sendComand(command) {
      // 控制消息主体
      const json = {
        version: 1,
        commandId: 256,
        timestamp: new Date().getTime(),
        ...command
      }
      const order = JsFunction.toDevice(json)
      const action = {
        "action": "INVOKE_SDK_FUNCTION",
        "functions": [{
          "ParameterList": [{ "type": "STRING", "value": order }, { "type": "STRING", "value": this.deviceInfo.sn }],
          "name": 'sendAsyncRawCommand'
        }]
      }
      console.log('控制指令：', action)
      ToNativeBridge.sendDataToNative(action);
    }
  },
})()
