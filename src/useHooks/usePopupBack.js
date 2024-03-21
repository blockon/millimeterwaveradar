/*
 * @Author: chuan.wang chuan.wang@changhong.com
 * @Date: 2023-02-15 18:14:52
 * @LastEditors: chuan.wang chuan.wang@changhong.com
 * @LastEditTime: 2023-09-25 13:54:44
 * @FilePath: \MeilingSmartHome-NewOperationd:\虹美公司\project\MeilingSmartHome-H5Page\publicUi\Vue3_Common_Frame\src\useHooks\usePopupBack.js
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
 */
import router from '../router/index'
let popupArr = []; // 记录当前点击的弹窗名称个事件
/**
 * @description: 浏览器返回时关闭弹窗
 * @param {ref} showValue 控制弹窗显示的响应式字段
 * @param {Function} closeFun 可选，关闭弹窗的方法，不传默认showValue.value = false
 */
export default (showValue, closeFun) => {
  popupArr.push({
    name: showValue,
    closeFun: closeFun
  });
  router.beforeEach((to, from, next) => {
    const _popupTrue = popupArr.filter(item => item.name.value == true);
    // 取正在显示的弹窗最后一个
    const popupObj = _popupTrue[_popupTrue.length - 1];
    if (popupObj && popupObj.name.value) {
      next(false)
      popupObj.closeFun ? popupObj.closeFun() : (popupObj.name.value = false)
    } else {
      next()
    }
  })
}