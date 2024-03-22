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
        <img class="running_anticlockwise" :style="`animation-duration:${Math.abs(5 - devData.speed)}s`"
          src="@img/ic_wind_speed.png" />
        <div class="wind_speed_str">{{ devData.sleep_mode == 1 ? '睡眠' : windSpeedArr[devData.speed] }}</div>
        <div class="wind_speed_hint">风速</div>
      </div>

      <!-- 摆风区域 -->
      <div class="wind_area">
        <img class="img_pro" src="@img/ic_pro.png" />

        <!-- 网格区域 -->
        <div class="grid_area">
          <div v-for="item in devData.data_array" :class="['grid-item', `${'grid-item' + getAreaClass(item)}`]"
            :key="item.id">
          </div>

        </div>
      </div>

      <!-- 扫风动画 -->
      <div class="wind_svga">
        <div id="svgaUp" class="w-full h-full"></div>
        <div id="svgaDown" class="w-full h-50"></div>
      </div>

      <!-- 摆风模式 -->
      <div class="wind_mode_area">
        <div class="wind_mode_str">「 {{ WindlessFeeling ? '无风感' : '普通' }} 」</div>
        <div class="wind_mode_hint">模式</div>
      </div>

    </div>

    <!-- 右边-人体状态感知参数区域 -->
    <div class="page_right center">
      <img class="img_title" src="@img/ic_title.png" />

      <!-- 热源数量 -->
      <div class="heat_num_area">
        <img class="running_clockwise" src="@img/ic_heat_num.png" />
        <div class="heat_num_str">{{ devData.data_array.length !== 0 ? devData.data_array.length == 1 ? '单人' : '多人' :
          '无人'
          }}</div>
        <div class="heat_num_hint">人员数量</div>
      </div>

      <!-- 未检测到人体 -->
      <div v-if="devData.data_array.length == 0" class="no_body">区域内暂未检测到人体</div>
      <!-- 检测到人体 -->
      <div class="heat_list" v-else>
        <div class="heat_item mid" v-for="(item, index) in devData.data_array" :key="index">
          <div style="margin-left: 48px;">0{{ item.id + 1 }}</div>
          <img src="@img/ic_map.png" />
          <div style="margin-left: 140px;">{{ item.angel }}°</div>
          <div class="item_line"></div>
          <div style="margin-left: 50px;">{{ item.distance / 100 }}米</div>
        </div>
      </div>

      <div class="tips">温馨提示：本地热源最多检测3个</div>
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


const windModeArr = ['全域扫风', '风随人动', '风逆人动', '定点出风']
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
    //   "angel": 82,   //角度，50-130°
    //   "distance": 300,   //距离，单位厘米，0-500cm
    // },
    {
      "id": 1,
      "angel": 120,   //角度，50-130°
      "distance": 100,   //距离，单位厘米，0-500cm
    },
    // {
    //   "id": 2,
    //   "angel": 80,   //角度，50-130°
    //   "distance": 200,   //距离，单位厘米，0-500cm
    // },
  ],
  "speed": 1,   //风速，0:自动风，1：微风，2：低风，3中风，4：高风，5：强劲风
  // 扫风时绘制动画 风随人动和风逆人动动画停止，只绘制角度
  "swing_mode": 0, //扫风方式，0：扫风，1：风随人动，2：风逆人动 
  "sleep_mode": 1, //睡眠模式，0：关闭，1：打开
  "up_swing_area": 1, //上摆叶摆风区域，0：0区，1：1区，2：2区，3：全域扫风
  "low_swing_area": 1, //下摆叶摆风区域，0：0区，1：1区，2：2区，3：全域扫风
});
const getAreaClass = item => {
  if (item.angel >= 50 && item.angel <= 76 && item.distance >= 0 && item.distance <= 250) {
    return '1'
  } else if (item.angel > 76 && item.angel <= 102 && item.distance >= 0 && item.distance <= 250) {
    return '2'
  } else if (item.angel > 102 && item.angel < 130 && item.distance >= 0 && item.distance <= 250) {
    return '3'
  } else if (item.angel >= 50 && item.angel <= 76 && item.distance >= 250 && item.distance <= 400) {
    return '4'
  } else if (item.angel > 76 && item.angel <= 102 && item.distance >= 250 && item.distance <= 400) {
    return '5'
  } else {
    return '6'
  }
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
    devData.value.sleep_mode = data.sleep_mode;
    devData.value.swing_mode = data.swing_mode;
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
  setTimeout(() => { startPlay() }, 500);
})

</script>

<style lang="scss">
.home_page {
  width: 3840Px;
  height: 2160Px;
  background-image: url('@img/ic_home_bg.png');
  background-size: auto;
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
    width: 520px;
    height: 520px;
    top: 9.4%;
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
      position: fixed;
      animation: rotate_anticlockwise 3s linear infinite;
    }

    .wind_speed_str {
      margin-top: 150px;
      font-family: YouSheBiaoTiHei;
      font-size: 144px;
      color: #01E7FF;
      font-weight: 400;
      text-align: center;
    }

    .wind_speed_hint {
      margin-top: 30px;
      font-family: YouSheBiaoTiHei;
      font-size: 60px;
      color: #01E7FF;
      font-weight: 400;
      text-align: center;
    }
  }

  .wind_area {
    width: 2037px;
    margin-top: 6.7%;
    text-align: center;
    position: relative;
    z-index: 100;

    .img_pro {
      height: 720px;
    }

    .grid_area {
      position: relative;
      margin-top: -50px;
      margin-left: 22px;
      height: 646px;
      background-image: url('@img/ic_grid.png');
      background-size: auto;
      background-repeat: no-repeat;

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
    top: 8.5%;
  }

  .heat_num_area {
    position: fixed;
    width: 626px;
    top: 21%;

    /* 转圈动画*/
    @keyframes rotate_clockwise {
      0% {
        -webkit-transform: rotate(0deg);
      }

      25% {
        -webkit-transform: rotate(90deg);
      }

      50% {
        -webkit-transform: rotate(180deg);
      }

      75% {
        -webkit-transform: rotate(270deg);
      }

      100% {
        -webkit-transform: rotate(360deg);
      }
    }

    /* 
      rotate : 定义的动画名称
      1s : 动画时间
      linear : 动画以何种运行轨迹完成一个周期
      infinite :规定动画应该无限次播放
      */
    .running_clockwise {
      position: fixed;
      animation: rotate_clockwise 3s linear infinite;
    }

    .heat_num_str {
      margin-top: 160px;
      text-align: center;
      font-family: YouSheBiaoTiHei;
      font-size: 176px;
      color: #01E7FF;
      font-weight: 400;
    }

    .heat_num_hint {
      margin-top: 60px;
      text-align: center;
      font-family: YouSheBiaoTiHei;
      font-size: 62.2px;
      color: #01E7FF;
      font-weight: 400;
    }
  }

  .no_body {
    position: fixed;
    bottom: 29.7%;
    opacity: 0.8;
    font-family: PingFangSC-Light;
    font-size: 60px;
    color: #17FDF9;
    font-weight: 200;
  }

  .heat_list {
    position: fixed;
    top: 56%;

    .heat_item {
      width: 1040px;
      height: 128px;
      margin-bottom: 72px;
      background: rgba(23, 253, 249, 0.05);
      border-radius: 10px;

      border: 1.89px solid rgba(23, 253, 249, 1);
      font-family: PingFang-SC-Heavy;
      font-size: 56px;
      color: #17FDF9;
      text-align: center;
      font-weight: 400;

      img {
        width: 38px;
        margin-left: 370px;
      }

      .item_line {
        margin-left: 66px;
        width: 2px;
        height: 48px;
        background: #17F4F2;
      }

    }
  }

  .tips {
    position: fixed;
    bottom: 5.9%;
    font-family: PingFangSC-Light;
    font-size: 48px;
    color: #17FDF9;
    font-weight: 200;
  }
}
</style>