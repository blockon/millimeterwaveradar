export default {
  /**
   * @description: 获取解析js
   * @param {Number} materialCode 设备物料号
   */
  getJs: (materialCode = '') => http({ method: 'POST', url: '/saserver/js/getOne', data: { material: materialCode } }),

  /**
  * @description: 重命名设备接口
  * @param {*} cid
  * @param {*} familyId
  * @param {*} devId 蓝牙/红外设备id,网关/萤石/涂鸦/分控/美妆防丢器sn
  * @param {*} devType WG(1,"网关"),GROUP(2,"组"),BT(3,"蓝牙"),IR(4,"红外"),CW(5,"无网关产品(美妆)"),BC(6,"分控") , THIRD(7,"第三方设备"),TY(8,"涂鸦设备")
  * @param {*} devName 设备名称
  * @param {*} roomId
  * @return {*}
  */
  renameDevice: ({ cid, familyId, devId, devType = 1, devName, roomId }) =>
    http({ method: 'POST', url: `/saserver/dev/rename`, data: { cid, familyId, devId, devType, devName, roomId }, showLoading: true }),
  /**
     * @description:  查询家庭详细信息
     * @param {*} familyId
     */
  getFamilyInfo: (familyId) => http({ method: 'POST', url: `/saserver/family/queryFamily`, data: { familyId } }),
  /**
 * @description: 新建房间
 * @return {*}
 */
  addNewRoom: (data) =>
    http({
      url: "/saserver/family/room/addroom",
      method: "post",
      data
    }),
  /**
   * @description:  移动设备房间/家庭
   * @param {*} cid
   * @param {*} familyId
   * @param {*} devIds [{ devId, devType, code }]
   * @param {*} roomId
   */
  moveDevice: ({ cid, familyId, devIds, roomId }) =>
    http({
      method: 'POST',
      url: `/saserver/dev/move`,
      data: { cid, familyId, devIds, roomId },
      showLoading: true,
    }),
  /**
     * @description:  删除设备/家庭
     * @param {*} cid
     * @param {*} familyId
     * @param {*} devIds [{ devId, devType, code }]
     * @param {*} roomId
     */
  deleteDevice: ({ cid, familyId, devIds, roomId }) =>
    http({
      method: 'POST',
      url: `/saserver/dev/delete`,
      data: { cid, familyId, devIds, roomId },
      showLoading: true,
    }),
  /**
 * 获取设备型号
 * @param {*} data
 * @returns
 */
  btDevType: (data) =>
    http({
      method: 'POST',
      url: `/saserver/ewc2/btDevType/btDevTypeDetail`,
      data: data,
    }).then(res => {
      if (res.code === "1000") {
        return Promise.resolve(res.data)
      } else {
        return Promise.reject(res)
      }
    }),
}
