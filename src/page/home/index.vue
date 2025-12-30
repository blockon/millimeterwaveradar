<!--
 * @Author: chuan.wang chuan.wang@changhong.com
 * @Date: 2022-12-20 10:42:19
 * @LastEditors: chuan.wang chuan.wang@changhong.com
 * @LastEditTime: 2024-03-21 17:32:43
 * @FilePath: \MeilingSmartHome-NewOperationd:\虹美公司\project\2023\MillimeterWaveRadar\src\page\home\index.vue
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
-->
<template>
  <!-- 左边-空调摆风区域 -->
  <div class="home_page mid">
    <div class="page_left center">
      <!-- 风速 -->
      <div class="wind_speed_num">
        <img class="running_anticlockwise" :style="`animation-duration:${Math.abs(6 - devData.speed)}s`" :src="powerState" :class="{'noScan':devData.power == 0}" />
        <div class="powertext center">
          <div class="wind_speed_str">{{ devData.power ? '开机' : '关机' }}</div>
          <div class="wind_speed_hint" v-if="devData.power">{{devData.set_temper/10}}℃ | {{windSpeedArr[devData.speed]}}</div>
        </div>
      </div>

      <!-- 摆风区域 -->
      <div class="wind_area">
        <img class="img_pro" :src="devImg" />
        <div v-if="devData.power">
          <img :src="windModeImgLeft" class="windAreaQuanYuBottom" />
          <img :src="windModeImgRight" class="windAreaQuanYuBottom" />
          <div class="windModeText">{{devData.swing_mode > 0 ? windModeArr[devData.swing_mode-1]:''}}</div>
          <img src="@img/windModeBg.png" class="windModeBgImg"/>
        </div>
        <!-- 网格区域 -->
        <div class="grid_area">
          <img :src="gridImgSrc" class="gridImg"/>
        </div>
        <div class="grid_areaPeople">
          <div class="people_grid_area" v-if="devData.power" v-for="item in devData.data_array" :key="item.id"
               :style="`left:${getPeopleLeft(item)};top:${getPeopleTop(item)};z-index:${110 + item.distance}`">
            <img :src="getHeadImg(item)" class="flagBgArea">
            <div class="peopleFlag">{{item.distance/100}}m</div>
            <img src="@img/people.png" class="peopleImg"/>
          </div>
        </div>
      </div>

      <!-- 扫风动画 -->
<!--      <div class="wind_svga">-->
<!--        <div id="svgaUp" class="w-full h-full"></div>-->
<!--        <div id="svgaDown" class="w-full h-50"></div>-->
<!--      </div>-->

      <!-- 摆风模式 -->
<!--      <div class="wind_mode_area">-->
<!--        <div class="wind_mode_str">「 {{ WindlessFeeling ? '无风感' : '普通' }} 」</div>-->
<!--        <div class="wind_mode_hint">模式</div>-->
<!--      </div>-->

    </div>
    <!-- 右边-人体状态感知参数区域 -->
    <div class="page_right center">
      <img class="img_title" src="@img/ic_title.png" />
      <!-- 热源数量 -->
      <div class="heat_num_area">
        <img class="running_clockwise" :src="peopleBg" />
        <img class="singleScan" :class="{'noScan':!devData.power}" :src="peopleScan" />
        <div class="heat_num_str" :class="{'powerOffState':!devData.power}">
          {{!devData.power ? '无人' : devData.data_array.length > 0 ? devData.data_array.length == 1 ? '单人' : '双人' : '无人' }}</div>
<!--        <div class="heat_num_hint" v-if="devData.power && devData.data_array.length > 0">-->
<!--          当前{{devData.data_array.length}}人<em v-if="devData.data_array.length > 1">，温度降低1度</em></div>-->
      </div>
      <!-- 未检测到人体 -->
      <div v-if="devData.data_array.length == 0 || !devData.power" class="no_body">区域内暂未检测到人体</div>
      <!-- 检测到人体 -->
      <div class="heat_list" v-else>
        <div class="heat_item mid" v-for="(item, index) in devData.data_array.length > 6 ?
        devData.data_array.slice(0,6) : devData.data_array"
             :key="index">
          <div class="itemLeft">{{ item.id >= 9 ? item.id : '0'+(item.id) }}</div>
          <img src="@img/ic_map.png" class="itemMap" />
          <div class="itemAngel">{{ item.angel }}°</div>
          <div class="item_line"></div>
          <div style="margin-left: 50px;" class="itemDistance">{{ item.distance / 100 }}m</div>
        </div>
      </div>
      <div class="tips">温馨提示：本地热源最多检测2个</div>
    </div>
  </div>
</template>

<script setup>
import SVGA from 'svgaplayerweb'
import {P_8009369} from '@/utils/analysis.js'

let isReverse = {}
let player = {};
let parser = {};
let isLoadFile = {};
let range = {}
const getImageUrl =(fullName)=> {
  return new URL(`../../assets/imgs/${fullName}`, import.meta.url).href;
}
const excutePlayer = (playObj, item) => {
  // 执行动画
  if (devData.value.swing_mode != 0) {
    // 如果不为扫风，svga动画调换到指定角度
    const _a = devData.value.swing_mode == 2 ? transfromAngel(item.angel) : item.angel;
    let frameNum = Math.ceil((_a - 50) / 2) //风向（区域），0：左，1：中，2：右
    playObj.stepToFrame(frameNum, false)
  } else {
    range[item.swing_leaf].location = item.wind_area == 3 ? 0 : item.wind_area * 13
    range[item.swing_leaf].length = item.wind_area == 3 ? 49 : 14
    playObj.startAnimationWithRange(range[item.swing_leaf], isReverse[item.swing_leaf])
  }
};

const playSvga = () => {

  sgvaObj.forEach(item => {
    player[item.swing_leaf] = player[item.swing_leaf] || new SVGA.Player('#' + item.swing_leaf);
    parser[item.swing_leaf] = parser[item.swing_leaf] || new SVGA.Parser()
    range[item.swing_leaf] = { location: 0, length: 42 }
    player[item.swing_leaf].loops = 1;
    if (isLoadFile[item.swing_leaf]) {
      // 若已加载文件，则直接执行
      excutePlayer(player[item.swing_leaf], item)
    } else {
      parser[item.swing_leaf].load(item.url, (videoItem) => {
        player[item.swing_leaf].setVideoItem(videoItem)
        isLoadFile[item.swing_leaf] = true; // 是否加载svga文件
        excutePlayer(player[item.swing_leaf], item)
      })
    }

    player[item.swing_leaf].onFinished(() => { //动画停止播放时回调
      isReverse[item.swing_leaf] = !isReverse[item.swing_leaf];
      player[item.swing_leaf].clear();
      setTimeout(() => {
        player[item.swing_leaf].startAnimationWithRange(range[item.swing_leaf], isReverse[item.swing_leaf])
      }, 10);
    })
    player[item.swing_leaf].onFrame((number) => { //动画播放至某帧后回调
      // console.log('--onFrame--' + number)
    })
    player[item.swing_leaf].onPercentage((number) => { //动画播放至某进度后回调
      // console.log('--onPercentage--' + number)
    })
  })
}


const windModeArr = ['风随人动', '风避人吹', '人近风柔']
const windSpeedArr = ['自动风', '微风', '低风', '中风', '高风', '强劲风']

const transfromAngel = (angle) => {
  if (angle <= 90) {
    angle = angle + 45
  }
  else if (angle > 90 && angle <= 135) {
    angle = angle - 45;
  }
  return angle; //空调摆叶摆动位置
}
let sgvaObj = [
  {
    swing_leaf: 'svgaUp',
    url: './svga/up_single.svga'
  },
  {
    swing_leaf: 'svgaDown',
    url: './svga/down_single.svga'
  }
];
let devData = ref({
  "json_seq": 2,  //数据包编号，0~65535
  "id_num": 2,  //检测到的人数，0-3人
  "data_array": [
    // {
    //   "id": 0,
    //   "angel": 90,   //角度，30-150°
    //   "distance": 200,   //距离，单位厘米，0-500cm
    // },
    // {
    //   "id": 1,
    //   "angel": 150,   //角度，30-150°
    //   "distance": 250,   //距离，单位厘米，0-500cm
    // }
  ],
  "speed": 4,   //风速，0:自动风，1：微风，2：低风，3中风，4：高风，5：强劲风
  // 扫风时绘制动画 风随人动和风逆人动动画停止，只绘制角度
  "swing_mode":0, //扫风方式，1：风随人动，2：风避人吹，3:人近风柔
  "sleep_mode": 1, //睡眠模式，0：关闭，1：打开
  "left_swing_area": 0, //上(左)摆叶摆风区域，0--100度   0度是中间 50度斜前方 左边是100，只有这三种情况
  "right_swing_area": 0, //下（右）摆叶摆风区域，0--100度   0度是中间，50度斜前方 右边是100
  "power": 1,
  "set_temper":263
});
const windTimer = ref(null)
const startBaiFeng = () => {
  if (!windTimer.value){
    let i = 1
    let isMax = false
    windModeImg.value = getImageUrl(`fengYe1.png`)
    windTimer.value = setInterval(() => {
      if (!isMax){//左到右
        i++
        if (i >= 5)
          isMax = true
      }else {
        i--
        if (i <= 1)
          isMax = false
      }
      windModeImg.value = getImageUrl(`fengYe${i}.png`)
    },1000)
  }
}
const clearWindTimer = () => {
  if (windTimer.value){
    clearInterval(windTimer.value)
    windTimer.value = null
  }
}
const windModeImgLeft = ref("")
const windModeImgRight = ref("")
const showfengYe = () => {
  let imgNameLeft = ''
  let imgNameRight = ''
  let imgNameLeftLast = devData.value.speed > 2 ? 'Strong.png' : 'Weak.png'
  let imgNameRightLast = devData.value.speed > 2 ? 'Strong.png' : 'Weak.png'
  //left_swing_area：左边摆叶（0--100） right_swing_area：右边摆叶（0--100）
  //devData.value.swing_mode == 0说明当前没有运行风随人动那些模式，不显示摆叶
  if (devData.value.swing_mode == 0){
    imgNameLeft = ''
    imgNameRight= ''
  } else if (devData.value.right_swing_area == 100 && devData.value.left_swing_area == 100){
    imgNameLeft = 'L_L'//最大角度
    imgNameRight = 'R_R'//最大角度
  } else if (devData.value.right_swing_area <= 50 && devData.value.left_swing_area <= 50){
    imgNameLeft = 'L_M'//中间角度
    imgNameRight = 'R_M'//中间角度
  }else if (devData.value.right_swing_area < 50 && devData.value.left_swing_area > 50 ){//整体往左吹
    imgNameLeft = 'L_L'
    imgNameRight = 'R_L'
  }else if (devData.value.right_swing_area > 50 && devData.value.left_swing_area < 50){//整体往右吹
    imgNameLeft = 'L_R'
    imgNameRight = 'R_R'
  }
  // 风避人吹时
  if (devData.value.swing_mode == 2 ){
    if (devData.value.data_array.length == 2){//双人场景 1、风避人吹时都是短风+弱风
      imgNameLeftLast = 'Weak.png'
      imgNameRightLast = 'Weak.png'
      if (devData.value.right_swing_area == 100 && devData.value.left_swing_area == 100){
        imgNameLeft = 'L_LSmall'//最大角度,但是风只有一半
        imgNameRight = 'R_RSmall'//最大角度,但是风只有一半
      }
    }else if (devData.value.data_array.length == 1){
      //单人场景1、风避人吹时人在左或右，一个强风一个弱风，中间的时候两边角度最大两边都是弱风+短风
      if (devData.value.right_swing_area < 50 && devData.value.left_swing_area > 50 ){//整体往左吹
        imgNameLeftLast = 'Strong.png'
        imgNameRightLast = 'Weak.png'
      }else if (devData.value.right_swing_area > 50 && devData.value.left_swing_area < 50){//整体往右吹
        imgNameLeftLast = 'Weak.png'
        imgNameRightLast = 'Strong.png'
      }else if (devData.value.right_swing_area == 100 && devData.value.left_swing_area == 100){
        imgNameLeft = 'L_LSmall'//最大角度,但是风只有一半
        imgNameRight = 'R_RSmall'//最大角度,但是风只有一半
        imgNameLeftLast = 'Weak.png'
        imgNameRightLast = 'Weak.png'
      }
    }
  }
  windModeImgLeft.value = ''
  windModeImgRight.value = ''
  if (imgNameLeft.length > 0 && imgNameRight.length > 0){
    windModeImgLeft.value = getImageUrl(`${imgNameLeft}${imgNameLeftLast}`)
    windModeImgRight.value = getImageUrl(`${imgNameRight}${imgNameRightLast}`)
  }
}
//全域扫风，根据返回up_swing_area角度旋转出风角度
const windAreaStyle = computed(() => {
  if (devData.value.swing_mode == 0) {
    let angle = 0
    if (devData.value.left_swing_area < 90){
      angle = 30 - (devData.value.left_swing_area - 30) / 2
    }else {
      angle = -(devData.value.left_swing_area - 90) / 2
    }
    return {
      transform: `translateX(-50%) rotate(${angle}deg)`,//rotate(30deg)
      transformOrigin: 'center top', // 设置旋转原点为上边中心点
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  }
  return {
    transform: 'translateX(-50%)',
    transformOrigin: 'center center', // 保持默认中心点旋转
  }
})
const peopleBg = computed(()=>{
  return !devData.value.power ? getImageUrl('noPeople.png') : devData.value.data_array.length > 1 ?
      getImageUrl('morePeople.png') : getImageUrl('ic_singlePeople.png')
})
const peopleScan = computed(()=>{
  return !devData.value.power ? getImageUrl('noPeopleScan.png') : devData.value.data_array.length > 1 ?
      getImageUrl('morePeopleScan.png') : getImageUrl('singleScan.png')
})
const devImg = computed(()=>{
  return devData.value.power == 1 ? getImageUrl('GHS_open.png') : getImageUrl('GHS_close.png')
})
const powerState = computed(()=>{
  return devData.value.power == 1 ? getImageUrl('ic_wind_speed_open.png') : getImageUrl('ic_wind_speed_close.png')
})
const gridImgSrc = computed(()=>{
  return devData.value.power == 1 ? getImageUrl('grid_open_new120.png') : getImageUrl('grid_close_new120.png')
})
const getHeadImg = (item) => {
  return getImageUrl(`flag${item.id}.png`)
}
//矩形的高度转化到UI上的px比例  需要减去人形的高度
//height: 493;width: 1710/2;宽高按照角度30度算下来的斜边是987
const UIXieBian = 987
//实际距离的斜边转化到UI上的px比例
const uiBiLi = (UIXieBian / 500).toFixed(2)
//标准圆弧的话，高度应该是855，实际UI上是椭圆弧，高度为493，这个椭圆弧图片高度还是不够，所以写了1100来兼容
const heightUI = (493 / 1150).toFixed(2)
const getPeopleLeft = (item) => {
  //实际距离按照比例对应到UI上
  const distanceUI = item.distance * uiBiLi
//实际距离
  const left = item.angel == 90 ? distanceUI : distanceUI * Math.cos((item.angel > 90 ? 180 - item.angel :
          item.angel) * Math.PI / 180)
  // console.log('left',item.id,left)
  let leftUi = 0
  leftUi = item.angel > 90 ? 1012 + left : item.angel == 90 ? 1012 : 1012 - left
  // 将px单位转换为vw单位 (1vw = 38.4px，基于3840px的设计稿)
  const leftVw = ((leftUi - 70) / 38.4).toFixed(2)
  return leftVw + "vw" //转化UI的top距离
}
const getPeopleTop = (item) => {
  const distanceUI = item.distance * uiBiLi * heightUI
  //实际距离
  let top = item.angel == 90 ? distanceUI : distanceUI * Math.sin((item.angel > 90 ? 180 - item.angel :
      item.angel) * Math.PI / 180)
  // console.log('top',item.id,top)
  const topVw = ((top - 318) / 38.4).toFixed(2)
  return topVw + "vw" //转化UI的top距离
}
const startPlay = () => {
  sgvaObj[0].wind_area = devData.value.left_swing_area;
  sgvaObj[1].wind_area = devData.value.right_swing_area;
  playSvga()
}
// 停止播放
const clearPlay = () => {
  for (let i in player) {
    player[i].stopAnimation();
  }
};
const timer = ref(null)
onMounted(() => {
  // startPlay();
  timer.value = setInterval(() => {
    getData();
  }, 500);
  // getData();
  // showfengYe()
  // setTimeout(() => {
  //   getPeopleData( [{
  //     "id": 7,
  //     "angel": 35,
  //     "distance": 180,
  //     }
  //   ])
  // },1500)
})
onUnmounted(() => {
  clearInterval(timer.value);
  if (windTimer.value){
    clearInterval(windTimer.value);
  }
})
const WindlessFeeling = ref(false);
const getData = () => {
  // const data = "55AAAF0117001A03000A0147010600000000000000060002E50201060002000002060002E50200070001000107000100020700010006070001000707000100080700023CDC09070001000A070001000B070001000109000200000209000100030900020000060900020000070900020000080900025C030B09000200000C09000200000D090002F4010E09000200000F09000200001009000200001109000200001209000200001F09000200006208"
  // const data1 = "55AAC802170000010001010101000100020100018C03010001030401000132050100010006010001000002000104010200010302020001000302000100040200010005020001000602000100070200010008020002000009020001000A02000100010300010009030001000A03000200000B030001000D03000238380E03000100100300023838110300010013030002646414030001001603000264641703000100180300010019030001001C030001001E03000238381F030001002103000238380204000108070400010108040001010E04000401010100000500020000020500010103050004000000000405000400000000050500090016000700000000000705000100080500040000000009050004000000000A050001000B050004000000000C050001080D050001000F050001001005000100110500010012050001001305000100AE09"
  // dealData(data)
  // setTimeout(() => {
  //   dealData(data1)
  // },1000)
  // return
  http({
    method: 'POST',
    url: "/api/getData"
  }).then(data => {
    if (!data) return;
    console.log(data, '接口返回数据');
    dealData(data.data)
    return;
    devData.value.right_swing_area = data.right_swing_area;
    devData.value.left_swing_area = data.left_swing_area;
    // devData.value.data_array = data.data_array;
    devData.value.speed = data.speed;
    devData.value.swing_mode = data.swing_mode;
    devData.value.power = data.power;
    devData.value.set_temper = data.set_temper;
    devData.value.id_num = data.id_num;
    getPeopleData(data.data_array)//处理人形站位
    showfengYe()
  }).catch(e => {
    // console.log(e, '接口异常');
  })
}
const js =  new P_8009369()
const dealData = (data) => {
  let newStatusStr = js.fromDevice(data)
  try {
    let newStatus = JSON.parse(newStatusStr)
    const reported = newStatus.state.reported
    if (reported) {
      console.log('前端解析上报数据----->', reported)
      console.log('前端解析上报数据风随radarWindFollowPeople----->', reported?.radarWindFollowPeople)
      console.log('前端解析上报数据风避radarWindAvoidPeople----->', reported?.radarWindAvoidPeople)
      console.log('前端解析上报数据人近radarPeopleNearSoftWind----->', reported?.radarPeopleNearSoftWind)
      console.log('前端解析上报数据actualMark----->', reported?.actualMark)
      devData.value.right_swing_area = (reported?.actAnglePositionForHordirH2 !== undefined) ?
          reported?.actAnglePositionForHordirH2 : devData.value.right_swing_area
      devData.value.left_swing_area = (reported?.actAnglePositionForHordir !== undefined) ?
          reported?.actAnglePositionForHordir : devData.value.left_swing_area
      devData.value.speed = (reported?.actualMark !== undefined) ?  reported?.actualMark : devData.value.speed
      if (reported?.radarWindFollowPeople == 0 || reported?.radarWindAvoidPeople == 0 ||
          reported?.radarPeopleNearSoftWind == 0){
        devData.value.swing_mode = 0
      }
      if (reported?.radarWindFollowPeople == 1 || reported?.radarWindAvoidPeople == 1 ||
          reported?.radarPeopleNearSoftWind == 1){
        devData.value.swing_mode = reported?.radarWindFollowPeople == 1 ? 1 : reported?.radarWindAvoidPeople == 1 ? 2
            : reported?.radarPeopleNearSoftWind == 1 ? 3 : 0
      }
      console.log("前端解析power",reported.power)
      devData.value.power = (reported?.power !== undefined) ? reported.power : devData.value.power
      devData.value.set_temper = (reported?.settemp !== undefined) ? reported?.settemp : devData.value.set_temper
      devData.value.id_num = (reported?.radarTargetCount !== undefined) ?  reported?.radarTargetCount : devData.value.id_num
      if (reported?.radarTargetCount == 1){
        getPeopleData([
          {
            "id": reported?.radarTarget1Speed,
            "angel": reported?.radarTarget1Angle + 30,   //角度，30-150°
            "distance": reported?.radarTarget1Distance * 10,   //距离，单位厘米，0-350cm
          }
        ])
      }else if (reported?.radarTargetCount == 2){
        getPeopleData([
          {
            "id": reported?.radarTarget1Speed,
            "angel": reported?.radarTarget1Angle + 30,   //角度，30-150°
            "distance": reported?.radarTarget1Distance * 10,   //距离，单位厘米，0-350cm
          },
          {
            "id": reported?.radarTarget2Speed,
            "angel": reported?.radarTarget2Angle + 30,   //角度，30-150°
            "distance": reported?.radarTarget2Distance * 10,   //距离，单位厘米，0-350cm
          }
        ])
      }
      showfengYe()
      console.log('前端解析处理后的数据----->', devData.value)
    }
  } catch (e){
    console.error(e, 'updateCurStatus，数据解析失败')
  }
}
const getPeopleData = (arr) => {
  //角度变化1-5°，认为人不动，界面小人保持静止；距离变化0-20cm，认为人不动，界面小人保持静止
  const devArr = [...arr]
  if (devArr.length > 0 && devData.value.data_array.length > 0){
    for (const item of devArr) {
      for (const devItem of devData.value.data_array) {
        if (devItem.id == item.id && (Math.abs(item.angel - devItem.angel) <= 5 && Math.abs(item.distance -
            devItem.distance) <= 20)){
          item.angel = devItem.angel
          item.distance = devItem.distance
        }
      }
    }
  }
  devData.value.data_array = devArr;
}
// watch(() => [devData.value.up_swing_area, devData.value.low_swing_area], (newValue, oldVaule) => {
  // 重新渲染
  // console.log(newValue, oldVaule, 'chongxinxuanra');
  // setTimeout(() => { startPlay() }, 500);
// })

</script>

<style lang="scss">
.home_page {
  width: 3840px;
  height: 100vh;
  background-image: url('@img/ic_home_bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.h-50 {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.page_left {
  width: 2640px;
  height: inherit;

  .wind_speed_num {
    position: fixed;
    width: 560px;
    height: 520px;
    top: 6.4%;
    left: 4.2%;

    /* 转圈动画*/
    @keyframes rotate_anticlockwise {
      0% {
        -webkit-transform: rotate(360deg);
      }

      25% {
        -webkit-transform: rotate(270deg);
      }

      50% {
        -webkit-transform: rotate(180deg);
      }

      75% {
        -webkit-transform: rotate(90deg);
      }

      100% {
        -webkit-transform: rotate(0deg);
      }
    }

    /* 
      rotate : 定义的动画名称
      1s : 动画时间
      linear : 动画以何种运行轨迹完成一个周期
      infinite :规定动画应该无限次播放
      */
    .running_anticlockwise {
      width: 560px;
      position: fixed;
      animation: rotate_anticlockwise 3s linear infinite;
    }
    .powertext{
      height: 100%;
      flex-direction: column;
    }
    .wind_speed_str {
      //margin-top: 150px;
      height: 134px;
      line-height: 134px;
      font-family: YouSheBiaoTiHei;
      font-size: 96px;
      color: #C2F9FF;
      font-weight: 600;
      text-align: center;
    }

    .wind_speed_hint {
      margin-top: 30px;
      font-family: YouSheBiaoTiHei;
      font-size: 48px;
      color: #C2F9FF;
      font-weight: 600;
      text-align: center;
      opacity: 0.8;
    }
  }

  .wind_area {
    width: 2037px;
    margin-top: 19.7%;
    text-align: center;
    position: relative;
    z-index: 100;

    .img_pro {
      height: 636px;
      z-index: 102;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      top: 24px;
    }
    .windArea{
      height: 990px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      z-index: 103;
      top: 4%;
      margin-left: 5px;
    }
    .ml{
      margin-left: -5px !important;
    }
    .windAreaQuanYuBottom{
      height: 1428px;
      position: absolute;
      left: -268px;
      top: -330px;
      z-index: 103;
      //top: 14.5%;
      //margin-left: -5px;
    }
    .grid_wind_area{
      height: 430px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      margin-left: 16px;
      top: 37.5%;
    }
    .windModeText{
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      font-size: 72px;
      font-weight: 600;
      color: #01FFFF;
      z-index: 102;
      top: 78%;
    }
    .windModeBgImg{
      width: 966px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      top: 83%;
    }
    .people_grid_area{
      position: absolute;
      //top: 30px;
      height: 318px;
      width: 122px;
      z-index: 110;
      //left: 50%;
      .flagBgArea{
        position: absolute;
        width: 116px;
        height: 64px;
        transform: translateX(-50%);
        left: 50%;
      }
      .peopleFlag{
        position: absolute;
        width: 116px;
        height: 64px;
        text-align: center;
        line-height: 60px;
        top:0;
        font-size: 40px;
        font-weight: 600;
        color: #090808;
        z-index: 220;
        transform: translateX(-50%);
        left: 50%;
      }
      .peopleImg{
        position: absolute;
        height: 240px;
        margin-top: 20px;
        transform: translateX(-50%);
        left: 50%;
        top: 58px;
      }
    }
    .grid_areaPeople{
      position: absolute;
      height: 430px;
      width: 2024px;
      margin-left: 10px;
      top: 600px;
      transform: translateX(-50%);
      left: 50%;
      z-index: 110;
    }
    .grid_area {
      position: absolute;
      //按照宽度1710和角度30度算下来，高应该是493，但是图片高度不够，所以强行加高
      height: 490px;
      width: 1900px;
      margin-left: -20px;
      top: 600px;
      transform: translateX(-50%);
      left: 50%;
      z-index: 100;
      .gridImg{
        height: 100%;
        width: 100%;
      }

      .grid-item {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;

        &.grid-item1 {
          background: url(@img/ic_card1.png);
        }

        &.grid-item2 {
          background: url(@img/ic_card2.png);
        }

        &.grid-item3 {
          background: url(@img/ic_card3.png);
        }

        &.grid-item4 {
          background: url(@img/ic_card4.png);
        }

        &.grid-item5 {
          background: url(@img/ic_card5.png);
        }

        &.grid-item6 {
          background: url(@img/ic_card6.png);
        }
      }
    }

    .body_area {
      width: 646px;
      height: 646px;
    }

  }

  .wind_svga {
    position: fixed;
    width: 2580px;
    height: 1900px;
    top: -20px;
    left: 0px;
  }

  .wind_mode_area {
    position: fixed;
    width: 1726px;
    height: 374px;
    bottom: 4.4%;
    background-image: linear-gradient(90deg, rgba(1, 255, 255, 0.00) 26%, rgba(1, 255, 255, 0.31) 48%, rgba(1, 255, 255, 0.00) 71%);
    text-align: center;

    .wind_mode_str {
      margin-top: 80px;
      font-family: PingFang-SC-Heavy;
      font-size: 96px;
      color: #01FFFF;
      font-weight: 400;
    }

    .wind_mode_hint {
      margin-top: 50px;
      opacity: 0.6;
      font-family: PingFangSC-Medium;
      font-size: 72px;
      color: #01FFFF;
      font-weight: 500;
    }
  }
}

.page_right {
  width: 1200px;
  height: inherit;

  .img_title {
    position: fixed;
    width: 1026px;
    top: 6.5%;
  }

  .heat_num_area {
    position: fixed;
    width: 924px;
    height: 672px;
    top: 15%;

    /* 转圈动画*/
    @keyframes rotate_clockwise {
      0% {
        -webkit-transform: translate(-50%, -50%) rotate(0deg);
      }

      25% {
        -webkit-transform: translate(-50%, -50%) rotate(90deg);
      }

      50% {
        -webkit-transform: translate(-50%, -50%) rotate(180deg);
      }

      75% {
        -webkit-transform: translate(-50%, -50%) rotate(270deg);
      }

      100% {
        -webkit-transform: translate(-50%, -50%) rotate(360deg);
      }
    }

    /* 
      rotate : 定义的动画名称
      1s : 动画时间
      linear : 动画以何种运行轨迹完成一个周期
      infinite :规定动画应该无限次播放
      */
    .running_clockwise {
      width: 924px;
      height: 672px;
      position: fixed;
      //animation: rotate_clockwise 3s linear infinite;
    }
    .singleScan{
      width: 330px;
      height: 330px;
      position: absolute;
      left: 50%;
      transform: translate(-50%,-50%);
      top: 50%;
      animation: rotate_clockwise 3s linear infinite;
    }

    .heat_num_str {
      margin-top: 280px;
      text-align: center;
      font-family: YouSheBiaoTiHei;
      font-size: 92px;
      color: #01E7FF;
      font-weight: 400;
    }
    .powerOffState{
      color: #FFFFFF;
    }

    .heat_num_hint {
      margin-top: 30px;
      text-align: center;
      font-family: YouSheBiaoTiHei;
      font-size: 28px;
      color: #01E7FF;
      font-weight: 400;
    }
  }

  .no_body {
    position: fixed;
    bottom: 29.7%;
    opacity: 0.8;
    font-family: PingFangSC-Light;
    font-size: 64px;
    color: #C2F9FF;
    font-weight: 300;
  }

  .heat_list {
    position: fixed;
    top: 47%;

    .heat_item {
      width: 1000px;
      height: 128px;
      margin-bottom: 32px;
      border-radius: 16px;
      border: 3px solid rgba(24, 254, 249, 0.4);
      font-family: PingFang-SC-Heavy;
      color: #C2F9FF;
      text-align: center;
      .itemLeft{
        width: 100px;
        margin-left: 48px;
        font-size: 72px;
        font-weight: 600;
      }
      .itemAngel{
        width: 120px;
        text-align: left;
        margin-left: 52px;
        font-size: 60px;
        font-weight: 500;
      }
      .itemDistance{
        margin-left: 40px;
        font-size: 60px;
        font-weight: 500;
      }
      img {
        width: 38px;
        margin-left: 256px;
      }

      .item_line {
        margin-left: 50px;
        width: 2px;
        height: 48px;
        background: #17F4F2;
        opacity: 0.4;
      }

    }
  }

  .tips {
    position: fixed;
    bottom: 3.9%;
    font-family: PingFangSC-Light;
    font-size: 48px;
    color: #C2F9FF;
    font-weight: 300;
  }
}
.noScan{
  animation: none !important;
}
</style>