import moment from 'moment'

export const Tools = {
  // 判断当前环境
  browserEnv() {
    const u = navigator.userAgent
    // const app = navigator.appVersion;
    return {
      trident: u.indexOf('Trident') > -1, //IE内核
      presto: u.indexOf('Presto') > -1, //opera内核
      webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
      gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') === -1, //火狐内核
      mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
      ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
      android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
      iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
      iPad: u.indexOf('iPad') > -1, //是否iPad
      webApp: u.indexOf('Safari') === -1, //是否web应该程序，没有头部与底部
      weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
      qq: u.match(/\sQQ/i) === ' qq', //是否QQ
    }
  },

  /**
   * @description: 导入图片
   * @param {*} fullName assets/imgs/图片名（子目录需要包含传目录）
   * @return {*} href
   */
  getImageUrl(fullName) {
    return new URL(`../assets/imgs/${fullName}`, import.meta.url).href
  },

  /**
   * @description: 数字转周几
   * @param {Number|String} data 单数字或数字组成的串
   * @return {*} 周几
   */
  numberToWeek(data) {
    const toWeek = (num) => `周${['', '一', '二', '三', '四', '五', '六', '日'][+num]}`

    if (typeof data === 'number') return toWeek(data) // 纯数字

    // 字符串
    if (typeof data === 'string') {
      if (data === '1234567') return '每天'

      const tmpAry = data.split('')
      return tmpAry.map((item) => toWeek(item)).join('、')
    }
  },

  /**
   * @description: dom转png图片（需安装html2canvas）
   * @param {*} dom
   * @return {Promise} Promise uri png
   */
  domToPng(dom) {
    return new Promise((resolve, reject) => {
      html2canvas(dom, {
        allowTaint: true, //允许污染
        taintTest: true, //在渲染前测试图片(没整明白有啥用)
        useCORS: true, //使用跨域(当allowTaint为true时这段代码没什么用,下面解释)
        background: '#fff',
        width: dom.scrollWidth,
        height: dom.scrollHeight,
        windowWidth: dom.scrollWidth,
        windowHeight: dom.scrollHeight,
      })
        .then((canvas) => {
          resolve(canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  /**
   * @description: moment插件汉化语言 https://blog.csdn.net/weixin_48585264/article/details/118189356
   */
  momentJsSetChinese() {
    moment.locale('zh-cn', {
      months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
      monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
      weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
      weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
      weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
      longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'YYYY-MM-DD',
        LL: 'YYYY年MM月DD日',
        LLL: 'YYYY年MM月DD日Ah点mm分',
        LLLL: 'YYYY年MM月DD日ddddAh点mm分',
        l: 'YYYY-M-D',
        ll: 'YYYY年M月D日',
        lll: 'YYYY年M月D日 HH:mm',
        llll: 'YYYY年M月D日dddd HH:mm',
      },
      meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
      meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
          hour = 0
        }
        if (meridiem === '凌晨' || meridiem === '早上' || meridiem === '上午') {
          return hour
        } else if (meridiem === '下午' || meridiem === '晚上') {
          return hour + 12
        } else {
          // '中午'
          return hour >= 11 ? hour : hour + 12
        }
      },
      meridiem: function (hour, minute, isLower) {
        const hm = hour * 100 + minute
        if (hm < 600) {
          return '凌晨'
        } else if (hm < 900) {
          return '早上'
        } else if (hm < 1130) {
          return '上午'
        } else if (hm < 1230) {
          return '中午'
        } else if (hm < 1800) {
          return '下午'
        } else {
          return '晚上'
        }
      },
      calendar: {
        sameDay: '[今天]LT',
        nextDay: '[明天]LT',
        nextWeek: '[下]ddddLT',
        lastDay: '[昨天]LT',
        lastWeek: '[上]ddddLT',
        sameElse: 'L',
      },
      dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
      ordinal: function (number, period) {
        switch (period) {
          case 'd':
          case 'D':
          case 'DDD':
            return number + '日'
          case 'M':
            return number + '月'
          case 'w':
          case 'W':
            return number + '周'
          default:
            return number
        }
      },
      relativeTime: {
        future: '%s内',
        past: '%s前',
        s: '几秒',
        ss: '%d秒',
        m: '1分钟',
        mm: '%d分钟',
        h: '1小时',
        hh: '%d小时',
        d: '1天',
        dd: '%d天',
        M: '1个月',
        MM: '%d个月',
        y: '1年',
        yy: '%d年',
      },
      week: {
        // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
        dow: 1, // Monday is the first day of the week.
        doy: 4, // The week that contains Jan 4th is the first week of the year.
      },
    })
  },

  /**
   * @description: van-date-picker 格式化为xx年xx月xx日
   * @param {*} type
   * @param {*} option
   * @return {*} xx年xx月xx日
   */
  datePickerFormatter(type, option) {
    if (type === 'year') option.text += '年'
    if (type === 'month') option.text += '月'
    if (type === 'day') option.text += '日'

    return option
  },

  /**
   * @description: 获取年月日，月份已+1
   * @param {Boolean} isStr 默认true 返回字符串类型
   * @param {Boolean} preZero 字符串是否前置0（需要isStr为true），如01，02
   * @return {Array} ['2022', '12', '08']
   */
  getDateAry(isStr = true, preZero = true) {
    let date = new Date()

    let curYear = date.getFullYear()
    let curMonth = date.getMonth() + 1
    let curDay = date.getDate()

    if (isStr) {
      curYear += ''
      curMonth += ''
      curDay += ''
    }

    if (preZero && isStr) {
      curMonth < 10 && (curMonth = '0' + curMonth)
      curDay < 10 && (curDay = '0' + curDay)
    }

    return [curYear, curMonth, curDay]
  },

  /**
   * @description: 获取数组的随机值
   * @param {Array} ary
   * @return {*} 随机的一个数组元素
   */
  getAryRadomItem(ary) {
    if (!ary) return
    return ary[parseInt(Math.random() * ary.length, 10)]
  },
}
