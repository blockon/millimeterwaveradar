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
          <div class="wind_speed_hint" v-if="devData.power">{{devData.set_temper/10}}℃ | {{windSpeedArr[devData
              .speed]}}</div>
        </div>
      </div>

      <!-- 摆风区域 -->
      <div class="wind_area">
        <img class="img_pro" :src="devImg" />
        <div v-if="devData.power">
          <img :src="windModeImg" class="windArea" />
          <div class="windModeText">{{windModeArr[devData.swing_mode-1]}}</div>
          <img src="@img/windModeBg.png" class="windModeBgImg"/>
        </div>
        <!-- 网格区域 -->
        <div class="grid_area">
          <img :src="gridImgSrc" class="gridImg"/>
        </div>
        <div class="grid_areaPeople">
          <div class="people_grid_area" v-if="devData.power" v-for="item in devData.data_array"
               :key="item.id" :style="`left:${getPeopleLeft(item)};top:${getPeopleTop(item)}`">
            <img :src="getheadImg(item)" class="flagBgArea">
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
          {{ devData.data_array.length > 0 ? devData.data_array.length == 1 ? '单人' : '多人' : '无人' }}</div>
        <div class="heat_num_hint" v-if="devData.power && devData.data_array.length > 0">
          当前{{devData.id_num}}人，温度降低1度</div>
      </div>
      <!-- 未检测到人体 -->
      <div v-if="devData.data_array.length == 0 || !devData.power" class="no_body">区域内暂未检测到人体</div>
      <!-- 检测到人体 -->
      <div class="heat_list" v-else>
        <div class="heat_item mid" v-for="(item, index) in devData.data_array.length > 6 ?
        devData.data_array.slice(0,5) : devData.data_array"
             :key="index">
          <div class="itemLeft">{{ item.id >= 9 ? item.id+1 : '0'+(item.id + 1) }}</div>
          <img src="@img/ic_map.png" class="itemMap" />
          <div class="itemAngel">{{ item.angel }}°</div>
          <div class="item_line"></div>
          <div style="margin-left: 50px;" class="itemDistance">{{ item.distance / 100 }}m</div>
        </div>
      </div>
      <div class="tips">温馨提示：本地热源最多检测6个</div>
    </div>
  </div>
</template>

<script setup>
import SVGA from 'svgaplayerweb'

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


const windModeArr = ['风随身动', '风逆身动', '人近风柔']
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
  "id_num": 5,  //检测到的人数，0-3人
  "data_array": [
    {
      "id": 0,
      "angel": 30,   //角度，50-130°
      "distance": 350,   //距离，单位厘米，0-500cm
    },
    {
      "id": 1,
      "angel": 50,   //角度，50-130°
      "distance": 350,   //距离，单位厘米，0-500cm
    },
    {
      "id": 2,
      "angel": 100,   //角度，50-130°
      "distance": 200,   //距离，单位厘米，0-500cm
    },
    {
      "id": 9,
      "angel": 110,   //角度，50-130°
      "distance": 260,   //距离，单位厘米，0-500cm
    },
    {
      "id": 8,
      "angel": 120,   //角度，50-130°
      "distance": 350,   //距离，单位厘米，0-500cm
    },
    {
      "id": 5,
      "angel": 130,   //角度，50-130°
      "distance": 350,   //距离，单位厘米，0-500cm
    },
  ],
  "speed": 3,   //风速，0:自动风，1：微风，2：低风，3中风，4：高风，5：强劲风
  // 扫风时绘制动画 风随人动和风逆人动动画停止，只绘制角度
  "swing_mode": 2, //扫风方式，1：风随身动，2：风逆身动，3:人近风柔
  "sleep_mode": 1, //睡眠模式，0：关闭，1：打开
  "up_swing_area": 70, //上摆叶摆风区域，0：0区，1：1区，2：2区，3：全域扫风
  "low_swing_area": 1, //下摆叶摆风区域，0：0区，1：1区，2：2区，3：全域扫风
  "power": 1,
  "set_temper":263
});
const windModeImg = computed(()=>{
  if (devData.value.swing_mode == 3){
    return getImageUrl('fengJinRou.png')
  }
  if (devData.value.up_swing_area >= 0 && devData.value.up_swing_area < 40){
    return getImageUrl('fengYe1.png')
  }else if (devData.value.up_swing_area >= 40 && devData.value.up_swing_area < 80){
    return getImageUrl('fengYe2.png')
  }else {
    return getImageUrl('fengYe3.png')
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
  return devData.value.power == 1 ? devData.value.swing_mode == 3 ? getImageUrl('ic_openRouFengDev.png') :
          getImageUrl('ic_openDev.png') : getImageUrl('ic_closeDev.png')
})
const powerState = computed(()=>{
  return devData.value.power == 1 ? getImageUrl('ic_wind_speed_open.png') : getImageUrl('ic_wind_speed_close.png')
})
const gridImgSrc = computed(()=>{
  return devData.value.power == 1 ? getImageUrl('ic_grid_open.png') : getImageUrl('ic_grid_close.png')
})
const getheadImg = (item) => {
  return getImageUrl(`flag${item.id <= 5 ? item.id + 1 : item.id - 5}.png`)
}
//实际矩形的高度
const heightA = ref(350 * Math.sin(30 * Math.PI / 180))
// console.log("heightA",heightA.value)
//实际矩形的宽度 / 2
const widthA = ref(350 * Math.cos(30 * Math.PI / 180))
// console.log("widthA",widthA.value)
//矩形的高度转化到UI上的px比例  需要减去人形的高度
const heightBiLi = ref((320 / heightA.value).toFixed(2))
// console.log("heightBiLi",heightBiLi.value)
//矩形的宽度转化到UI上的px比例
const widthBiLi = ref((1012 / widthA.value).toFixed(2))
// console.log("widthBiLi",widthBiLi.value)
const getPeopleLeft = (item) => {
//实际距离
  const left = item.angel == 90 ? item.distance : item.distance * Math.cos((item.angel > 90 ? 180 - item.angel :
          item.angel) * Math.PI / 180)
  // console.log('left',item.id,left)
  const leftBiLi = left * widthBiLi.value
  let leftUi = 0
  //由于网格是个椭圆弧，所以左右两边需要特殊处理，不能按照标准圆弧处理
  //距离大于180，大于90度的位置left需要短一点，不然就超出网格了，同理小于90度的位置left需要多一点
  if (item.distance > 200){
    if (item.angel > 90){
      leftUi = 960 + leftBiLi
    }else if (item.angel < 90){
      leftUi = 1220 - leftBiLi
    }else {
      leftUi = 1090
    }
  }else {
    leftUi = item.angel > 90 ? 1000 + leftBiLi : item.angel == 90 ? 1030 : 1200 - leftBiLi
  }
  // 将px单位转换为vw单位 (1vw = 38.4px，基于3840px的设计稿)
  const leftVw = ((leftUi - 100) / 38.4).toFixed(2)
  return leftVw + "vw" //转化UI的top距离
}
const getPeopleTop = (item) => {
  //实际距离
  const top = item.angel == 90 ? item.distance : item.distance * Math.sin((item.angel > 90 ? 180 - item.angel :
      item.angel) * Math.PI / 180)
  // console.log('top',top)
  let topUi = top * heightBiLi.value
  // console.log('topUi',topUi)
  // 将px单位转换为vw单位 (1vw = 38.4px，基于3840px的设计稿)
  if (item.distance > 200 && (item.angel > 130) || item.angel < 50){
      topUi = topUi + 40
  }else if (item.distance > 200 && (item.angel < 130) || item.angel > 50){
    topUi = topUi - 30
  }

  const topVw = ((topUi - 318) / 38.4).toFixed(2)
  return topVw + "vw" //转化UI的top距离
}
const startPlay = () => {
  sgvaObj[0].wind_area = devData.value.up_swing_area;
  sgvaObj[1].wind_area = devData.value.low_swing_area;
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
})
onUnmounted(() => {
  clearInterval(timer.value);
})
const WindlessFeeling = ref(false);
const getData = () => {
  http({
    method: 'POST',
    url: "/api/getData"
  }).then(data => {
    if (!data) return;
    console.log(data, '接口返回数据');
    devData.value.low_swing_area = data.low_swing_area;
    devData.value.up_swing_area = data.up_swing_area;
    devData.value.data_array = data.data_array;
    devData.value.speed = data.speed;
    // devData.value.sleep_mode = data.sleep_mode;
    devData.value.swing_mode = data.swing_mode;
    devData.value.power = data.power;
    devData.value.set_temper = data.set_temper;
    devData.value.id_num = data.id_num;
    WindlessFeeling.value = false;
    data.data_array.forEach(it => {
      if (it.distance <= 250) {
        // 只要有距离小于2.5米 都是无风感模式
        WindlessFeeling.value = true;
      }
    })
  })
}
watch(() => [devData.value.up_swing_area, devData.value.low_swing_area], (newValue, oldVaule) => {
  // 重新渲染
  console.log(newValue, oldVaule, 'chongxinxuanra');
  // setTimeout(() => { startPlay() }, 500);
})

</script>

<style lang="scss">
.home_page {
  width: 3840Px;
  height: 2160Px;
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
    margin-top: 20.7%;
    text-align: center;
    position: relative;
    z-index: 100;

    .img_pro {
      height: 636px;
      z-index: 102;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
    }
    .windArea{
      height: 990px;
      position: absolute;
      transform: translateX(-50%);
      left: 50%;
      z-index: 103;
      top: 3.5%;
      margin-left: 5px;
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
      height: 540px;
      width: 2100px;
      //margin-left: 16px;
      top: 36.5%;
      transform: translateX(-50%);
      left: 50%;
      z-index: 110;
    }
    .grid_area {
      position: absolute;
      height: 540px;
      width: 2100px;
      //background-image: url('@img/ic_grid.png');
      //background-size: 100% auto;
      //background-repeat: no-repeat;
      margin-left: 16px;
      top: 36.5%;
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
      width: 900px;
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
        margin-left: 40px;
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