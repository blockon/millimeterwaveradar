<!-- 空数据页面 水平垂直居中 自行设置高度css-->
<!-- slot 描述信息 -->
<template>
  <div class="mid-center flex-col">
    <img class="w-72 h-85" src="../assets/imgs/ic_empty.png" alt="" srcset="" />
    <div class="fs-14 color-999999 fw-400 mt-16"><slot>暂无记录</slot></div>
  </div>
</template>
