<template>
  <van-cell-group class="mt-12" inset>
    <van-cell title="设备昵称" :value="deviceInfo.name" is-link @click="showRename" />
    <van-cell title="设备位置" :value="deviceInfo.roomName" is-link @click="showRoomSet" />
    <van-cell title="设备型号" :value="realType || deviceInfo.acmodel" />
    <van-cell title="设备序列号" v-if="!props.deviceInfo.id" :value="props.deviceInfo.deviceID" />
    <van-cell v-show="hardwareVersion" title="固件版本" :value="hardwareVersion" />
    <van-cell center @click="delDialogShow">
      <div class="mid-center color-FF5454 fs-14">删除设备</div>
    </van-cell>
  </van-cell-group>

  <!-- 修改昵称 -->
  <AppBottomPopup class="h-550" v-model:show="renameDrawerShow" @confirm="doRename" @close="renameDrawerShow = false"
    title="修改昵称">
    <input v-model="devNewName" ref="renameDomRef" class="input" type="text" />
  </AppBottomPopup>

  <!-- 添加房间 -->
  <AppBottomPopup class="h-550" v-model:show="addNameRoom" :closeOnConfirm="false" @confirm="addNewRoom" @close="addNameRoom = false"
    title="新建房间">
    <input v-model="newRoomName" ref="addDomRef" class="input" type="text" />
  </AppBottomPopup>

  <!-- 修改位置 -->
  <AppBottomPopup class="bg-fff-important" v-model:show="roomSetShow" @confirm="changeRoom" @close="roomSetShow = false"
    title="修改位置">
    <van-radio-group class="pb-100" v-model="roomPosition" direction="horizontal">
      <van-cell-group :border="false" class="w-full room-list">
        <van-cell v-for="(item) in roomList" :key="item.roomId">
          <van-radio :name="item.roomId">{{ item.roomName }}</van-radio>
        </van-cell>
      </van-cell-group>
      <div @click="showAddNameRoom">
        <van-cell-group class="w-full" :border="false" title="+新建房间"></van-cell-group>
      </div>
    </van-radio-group>
  </AppBottomPopup>
</template>

<script setup>
import { showConfirmDialog, showToast } from 'vant'
const props = defineProps({
  // 固件版本号
  hardwareVersion: {
    type: String,
    default: '',
  },
  // 设备信息
  deviceInfo: {
    type: Object,
    default: {},
  },
})
const roomListDom = ref();
const realType = ref("");//真实设备型号
onActivated(async () => {
  if (props.deviceInfo?.type) {
    const param = { typeId: props.deviceInfo?.type };
    commonApi.btDevType(param).then(res => {
      realType.value = res?.realType
    })
  }
  const roomData = await commonApi.getFamilyInfo(props.deviceInfo.familyId)
  roomList.value = roomData.data.roomList.filter(item => item.roomType != -1);
})
/**
 * 点击时清空上一次名称
 */
const showAddNameRoom = () => {
  if (roomList.value.length >= 21) {
    showToast({ message: "当前家庭房间数量已达到最大", position: 'bottom', className: 'toast_z_index' })
    return
  }
  newRoomName.value = ""
  addNameRoom.value = true
}
/**
 * 删除
 */
const dialogShow = ref(false)
usePopupBack(dialogShow)
const delDialogShow = () => {
  if (props.deviceInfo.isMaster != 1) {
    showToast("您不是房主，无法修改")
    return;
  }
  dialogShow.value = true
  showConfirmDialog({
    message: '确认删除吗？',
    theme: 'round-button',
  }).then(() => {
    const params = {
      cid: props.deviceInfo.cid,
      familyId: props.deviceInfo.familyId,
      devIds: [
        {
          devId: props.deviceInfo.id || props.deviceInfo.deviceID,
          devType: props.deviceInfo.typeId,
        },
      ],
      roomId: props.deviceInfo.roomId,
    }
    commonApi.deleteDevice(params).then(() => {
      showToast('已删除')
      setTimeout(() => {
        if (!props.deviceInfo.id) {
          deviceStore.sendComand({ "method": "command", "payload": { "delete_device": [{ "id": props.deviceInfo.devId }] } })
        }
        NativeActions.exit()
      }, 2000)
    }).finally(() => {
      dialogShow.value = false
    })
  })
}
/**
   * 校验设备重命名
   * 校验规则：设备名称最多12个字符
   * 命名规则：设备名称只支持中、英文 和 数字
   * @param {String} newName
   * @param {String} oldName
   * @returns String 或 true
   */
const checkDevName = (newName, oldName) => {
  if (newName == '' || newName == undefined || newName == null)
    return '请输入设备名称';
  else if (newName == oldName)
    return '请输入一个新名称';
  else if (newName.length > 12)
    return '请输入12个以内的字符';
  else if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/gi.test(newName))
    return '名称只支持中英文及数字';
  return true;
}

const checkRoomName = (newName, curRoomNum) => {
  if (newName == '' || newName == undefined || newName == null)
    return '请输入房间名称';
  else if (curRoomNum >= 21)
    return '此家庭下的房间数量已超上限';
  else if (newName.length > 12)
    return '请输入12个以内的字符';
  else if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/gi.test(newName))
    return '名称只支持中英文及数字';
  return true;
}
/**
 * 重命名
 */
const devNewName = ref(props.deviceInfo.name)
const renameDrawerShow = ref(false)
usePopupBack(renameDrawerShow)
const showRename = () => {

  if (props.deviceInfo.isMaster != 1) {
    showToast("您不是房主，无法修改")
    return;
  }

  devNewName.value = props.deviceInfo.name
  renameDrawerShow.value = true
}
const doRename = () => {
  let checkResult = checkDevName(devNewName.value, props.deviceInfo.name);
  if (checkResult != true) {
    showToast({ message: checkResult, position: 'bottom', className: 'toast_z_index' })
    return
  }

  const params = {
    cid: props.deviceInfo.cid,
    familyId: props.deviceInfo.familyId,
    devId: props.deviceInfo.id || props.deviceInfo.deviceID,
    devName: devNewName.value,
    roomId: props.deviceInfo.roomId,
    devType: props.deviceInfo.typeId,
  }
  commonApi.renameDevice(params).then(() => {
    props.deviceInfo.name = devNewName.value
    renameDrawerShow.value = false
    showToast('已修改')
  })
}

/**
 * 房间位置
 */
const roomSetShow = ref(false)
usePopupBack(roomSetShow)
const roomPosition = ref(props.deviceInfo.roomId)
const roomList = ref([])
const showRoomSet = async () => {
  if (props.deviceInfo.isMaster != 1) {
    showToast("您不是房主，无法修改")
    return;
  }

  roomSetShow.value = true;
}
const changeRoom = () => {
  const params = {
    cid: props.deviceInfo.cid,
    familyId: props.deviceInfo.familyId,
    devIds: [
      {
        devId: props.deviceInfo.id || props.deviceInfo.deviceID,
        devType: props.deviceInfo.typeId,
      },
    ],
    roomId: roomPosition.value,
  }
  commonApi.moveDevice(params).then((data) => {
    props.deviceInfo.roomName = roomList.value.find(({ roomId }) => roomId == roomPosition.value).roomName
    roomSetShow.value = false
    showToast('已修改')
  })
}

/**
 * 新建房间
 */
const addNameRoom = ref(false);
const newRoomName = ref('');
usePopupBack(addNameRoom);
const addNewRoom = () => {
  let checkResult = checkRoomName(newRoomName.value, roomList.value.length);
  if (checkResult != true) {
    showToast({ message: checkResult, position: 'bottom', className: 'toast_z_index' })
    return
  }
  const data = {
    cId: props.deviceInfo.cid,
    familyId: props.deviceInfo.familyId,
    roomName: newRoomName.value,
    roomType: 0,
    devs: [],
  };
  commonApi.addNewRoom(data).then((res) => {
    roomList.value.push(res.data);
    addNameRoom.value = false;
  });
}
</script>

<style lang="scss">
.van-cell__value {
  flex: 2;
}

.room-list {
  max-height: 300px;
  overflow: scroll;
  margin-bottom: 16px;
  border-radius: 14px;
}

.input {
  width: 343px;
  height: 56px;
  background: #ffffff;
  box-shadow: 0px 6px 12px 0px rgba(102, 102, 102, 0.06);
  border-radius: 14px;
  outline: none;
  border: none;
  padding: 0 20px;
  -webkit-user-select: auto !important;
  -khtml-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  -o-user-select: auto !important;
  user-select: auto !important;
}
</style>
