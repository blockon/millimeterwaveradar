<!--
 * @Author: chuan.wang chuan.wang@changhong.com
 * @Date: 2022-12-20 10:42:19
 * @LastEditors: chuan.wang chuan.wang@changhong.com
 * @LastEditTime: 2024-01-09 14:30:38
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
        <img class="running_anticlockwise" src="@img/ic_wind_speed.png" />
        <div class="wind_speed_str">{{ devData.speed }}</div>
        <div class="wind_speed_hint">风速</div>
      </div>

      <!-- 摆风区域 -->
      <div class="wind_area">
        <img class="img_pro" src="@img/ic_pro.png" />

        <!-- 网格区域 -->
        <div class="grid_area">
          <div style="transform: rotateX(60deg);">
            <div :style="computeXY(item)" v-for="item in devData.data_array"><img src="@img/ic_body.png" /></div>
          </div>
        </div>
      </div>

      <!-- 扫风动画 -->
      <div class="wind_svga">
        <!-- <AppSvgaPlayer url="./svga/wind_single.svga" /> -->
        <div id="svgaId" class="w-full h-full"></div>
      </div>

      <!-- 摆风模式 -->
      <div class="wind_mode_area">
        <div class="wind_mode_str">「 {{ windModeArr[devData.swing_mode] }} 」</div>
        <div class="wind_mode_hint">风向</div>
      </div>

    </div>

    <!-- 右边-人体状态感知参数区域 -->
    <div class="page_right center">
      <img class="img_title" src="@img/ic_title.png" />

      <!-- 热源数量 -->
      <div class="heat_num_area">
        <img class="running_clockwise" src="@img/ic_heat_num.png" />
        <div class="heat_num_str">0{{ devData.id_num }}</div>
        <div class="heat_num_hint">热源数量</div>
      </div>

      <!-- 未检测到人体 -->
      <div v-if="devData.id_num == 0" class="no_body">区域内暂未检测到人体</div>
      <!-- 检测到人体 -->
      <div class="heat_list" v-else>
        <div class="heat_item mid" v-for="(item, index) in devData.data_array">
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

  let isReverse = false
  const playSvga = () => {
    let player = new SVGA.Player('#svgaId')
    let parser = new SVGA.Parser()
    const url = devData.swing_mode == 3 ? './svga/wind_fixed.svga' : './svga/wind_single.svga'
    parser.load(url, (videoItem) => {
      player.loops = 1
      player.setVideoItem(videoItem)
      if (devData.swing_mode == 3) { //扫风方式，0：扫风，1：风随人动，2：风逆人动，3：定点出风
        let frameNum = devData.wind_area * 19 //风向（区域），0：左，1：中，2：右
        player.stepToFrame(frameNum, false)
      } else {
        let range = { location: 0, length: 42 }
        if (devData.swing_mode != 0) { //扫风方式，0：扫风，1：风随人动，2：风逆人动，3：定点出风
          range.location = devData.wind_area * 14
          range.length = 15
        }
        player.startAnimationWithRange(range, isReverse)
      }
    })
    /**
     * Player属性：
    loops; 动画循环次数，默认值为 0，表示无限循环。
    clearsAfterStop; 默认值为 true，表示当动画结束时，清空画布。
    fillMode; 可选值 Forward / Backward（默认），当 clearsAfterStop 为 false 时，Forward 表示动画会在结束后停留在最后一帧，Backward 则会在动画结束后停留在第一帧。
     * Player方法：
    startAnimation(reverse: boolean = false) //从第 0 帧开始播放动画
    startAnimationWithRange(range: {location: number, length: number}, reverse: boolean = false); 播放 [location, location+length] 指定区间帧动画
    pauseAnimation(); 暂停在当前帧
    stopAnimation(); 停止播放动画，如果 clearsAfterStop === true，将会清空画布
    setContentMode(mode: “Fill” | “AspectFill” | “AspectFit”); 设置动画的拉伸模式
    setClipsToBounds(clipsToBounds: boolean); 如果超出盒子边界，将会进行裁剪
    clear(); 强制清空画布
    stepToFrame(frame: int, andPlay: Boolean); 跳到指定帧，如果 andPlay === true，则在指定帧开始播放动画
    stepToPercentage(percentage: float, andPlay: Boolean); - 跳到指定百分比，如果 andPlay === true，则在指定百分比开始播放动画
    setImage(image: string, forKey: string, transform: [a, b, c, d, tx, ty]); 设定动态图像, transform 是可选的, transform 用于变换替换图片
    clearDynamicObjects(); 清空所有动态图像和文本
    */
    player.onFinished(() => { //动画停止播放时回调
      console.log('--onFinished--')
      isReverse = !isReverse
      playSvga()
    })
    player.onFrame((number) => { //动画播放至某帧后回调
      // console.log('--onFrame--' + number)
    })
    player.onPercentage((number) => { //动画播放至某进度后回调
      // console.log('--onPercentage--' + number)
    })
  }

  onMounted(() => {
    playSvga()
    setTimeout(() => {
      devData.wind_area = 3
      playSvga()
    }, 4 * 1000)

    // setTimeout(() => {
    //   devData.wind_area = 2
    //   playSvga()
    // }, 8 * 1000)

    // setTimeout(() => {
    //   devData.swing_mode = 0
    //   devData.wind_area = 2
    //   playSvga()
    // }, 12 * 1000)
  })

  onUnmounted(() => {
    ws.close();
  });

  const ws = new WebSocket("ws://localhost:8080")
  // 连接成功时触发
  ws.onopen = (event) => {
    ws.send("Hello, Server!")
  }
  // 接收到消息时触发
  ws.onmessage = (event) => {
    console.log("onmessage data: " + event.data)
  }
  // 连接关闭时触发
  ws.onclose = (event) => {
    console.log("Connection closed.")
  }

  const windModeArr = ['全域扫风', '风随人动', '风逆人动', '定点出风']

  let devData = reactive({
    "json_seq": 2,  //数据包编号，0~65535
    "id_num": 2,  //检测到的人数，0-3人
    "data_array": [
      {
        "id": 0,
        "angel": 50,   //角度，50-130°
        "distance": 400   //距离，单位厘米，0-500cm
      },
      {
        "id": 1,
        "angel": 90,   //角度，50-130°
        "distance": 450   //距离，单位厘米，0-500cm
      },
      {
        "id": 2,
        "angel": 130,   //角度，50-130°
        "distance": 490   //距离，单位厘米，0-500cm
      },
    ],
    "speed": 2,   //风速，0：微风，1：低风，2中风，3：高风，4：强劲风
    "swing_mode": 0, //扫风方式，0：扫风，1：风随人动，2：风逆人动
    "wind_area": 0,  //风向（区域），0：左，1：中，2：右
  })

  const computeXY = (item) => {
    /*
    *400~500 对应 700~950 系数 1.75~1.91
    *300~400 对应 500~700 系数*1.66~1.75
    *200~300 对应 300~500 系数*1.5~1.66
    *100~200 对应 150~300 系数*1.4~1.5
    *0~100 对应 0~150 系数*1.35~1.4
    */
    let num = 1 //Y轴形变系数
    if (item.distance >= 400) {
      num = 1.9 - (500 - item.distance) * 0.0016
    } else if (item.distance >= 300) {
      num = 1.75 - (400 - item.distance) * 0.0009
    } else if (item.distance >= 200) {
      num = 1.66 - (300 - item.distance) * 0.0011
    } else if (item.distance >= 100) {
      num = 1.5 - (200 - item.distance) * 0.0010
    } else {
      num = 1.4 - (100 - item.distance) * 0.0005
    }
    const x0 = 1007 - 92, y0 = -109
    const x1 = x0 + (item.distance * num) * Math.cos((item.angel + 180) * Math.PI / -180) //Math.PI表示π
    const y1 = y0 + (item.distance * num) * Math.sin((item.angel + 180) * Math.PI / -180)
    console.log(item.distance, item.angel)
    console.log('x: ' + x1, 'y: ' + y1)
    return {
      position: 'absolute',
      left: x1 + 'px',
      top: y1 + 'px',
    }
  }

</script>

<style lang="scss">
  .home_page {
    width: 100vw;
    height: 100vh;
    background-image: url('@img/ic_home_bg.png');
    background-size: auto;
    background-repeat: no-repeat;
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