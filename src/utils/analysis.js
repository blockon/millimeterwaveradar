/**
 *@Author: jie.wang
 *@since:2025/12/26
 */
/**
 * 2025.10.14:
 *  1、根据协议V3.27，新增以下属性：
 * 1、属性3.10负责左右同控，
 * 2、属性3.11（左上羽根）、3.14（左下羽根）、新增3.28（右上羽根）、3.31（右下羽根），负责羽根的上下左右分控，3.17（左区大摆叶）、3.20（右区大摆叶）负责左右摆叶的的分控。
 * 3、摆叶可视化走3.13属性（左区左上和左下羽根联动），3.16属性（右区右上和右下羽根联动）、3.19属性（左区大摆叶），3.16属性（右区大摆叶）
 *
 */
/*eslint-disable*/
var attributeDefine = [
    ['productID', 'softVersion', 'attributeVersion', 'xxxInfo', 'yyyInfo', 'zzzInfo'],
    ['power', 'mode', 'settemp', 'mark', 'continueslyWind', 'ptcheat', 'sleepmode', 'reverse17', 'reverse18'],
    [
        'actualMode',
        'actualMark',
        'defrostStatus',
        'antiWasteHeat',
        'antiWasteCold',
        'againstColdWind',
        'ptcheatStatus',
        'inversionDustStatus',
        'sleepTime',
        'remainTimeOfDefrost',
        'remainTimeOfSelfclean',
    ],
    [
        'antiDirectBlow',
        'softwind',
        'awningWind',
        'carpetWind',
        'noWindFeeling',
        'reverse35',
        'reverse36',
        'reverse37',
        'reverse38',
        'embraceWind',
        'syncSweep',
        'verdir',
        'verdirAngle',
        'verdirFixPos',
        'verdirV2',
        'verdirAngleV2',
        'verdirFixPosV2',
        'hordir',
        'hordirAngle',
        'hordirFixPos',
        'hordirH2',
        'hordirAngleH2',
        'hordirFixPosH2',
        'radarWindAvoidPeople',
        'radarWindFollowPeople',
        'radarPeopleNearSoftWind',
        'radarSensorInfo',
        'radarSensorRawData',
        'verdirV3',
        'reverse329',
        'verdirFixPosV3',
        'verdirV4',
        'reverse332',
        'verdirFixPosV4',
    ],
    [
        'thirdOrderWind',
        'reverse41',
        'brightness',
        'buzzer',
        'airclean',
        'uvInactive',
        'userFeedback',
        'ASR',
        'voiceBroadcast',
        'humidityControl',
        'setHumidity',
        'dehumidifyAutoEnable',
        'reverse412',
        'reverse413',
        'light',
    ],
    [
        'selfclean',
        'dryMidewProof',
        'shutdownDefrost',
        'setMinutesForPowerOn',
        'setMinutesForPowerOff',
        'timePeriod',
        'offScreenTime',
        'timeSleep',
        'electricityInfo',
        'totalWorkTime',
        'filterStatus',
        'totalECOTime',
        'screenDisplay',
        'inversionDust',
        'bladesEasyClean',
        'gridPowerLimit',
        'timePeriodVoiceBroadcast',
        'timePeriodBuzzer',
        'timePeriodEnableFlag',
        'timePeriodRadar',
    ],
    [
        'indoorTemperature',
        'indoorHumidity',
        'outdoorTemperature',
        'outdoorHumidity',
        'lumen',
        'CO2',
        'PM25',
        'TVOC',
        'HCHO',
        'reverse69',
        'extBLETemperature',
        'extBLEHumidity',
    ],
    [
        'settingForDisplay',
        'roles',
        'usingField',
        'windOutletPosition',
        'paramForPowerOn',
        'source',
        'locked',
        'disPtcheat',
        'limitSetTemp',
        'currentStatus',
        'cat1ModuleStatus',
        'horseChange',
        'coolOrHeat',
    ],
    ['freshswitch', 'remainTimeForFreshFilter', 'resetFreshFilter', 'freshAutoEnable', 'reverse84', 'reverse85'],
    [
        'frequency',
        'overallPower',
        'fluorine',
        'temperatureForCompressor',
        'indoorTVOC',
        'resvers95',
        'innerDiskTemperature',
        'internalFanSpeed',
        'internalFanTemperature',
        'externalFanTemperature',
        'compressorTemperature',
        'externalMachineTemperature',
        'externalExhaust',
        'externalOperatFreq',
        'externalFanSpeed',
        'expansionValveSteps',
        'ExtMachineRunningCurrent',
        'extMachineRunningVol',
        'externalPower',
        'freshFanSpeed',
        'overallPowerNew',
        'frequencyNew',
        'dewPointTemperature',
        'moistureContent',
        'inAirEnthalpyValue',
        'outAirEnthalpyValue',
        'PMVCorrectionValue',
        'PMVActualValue',
        'PPDActualValue',
        'T-PMV',
        'indoorLargeRadiatorTemperature',
        'externalMachineFreq',
    ],
    [
        'modelSettings',
        'forcedOperation',
        'fastRun',
        'selfTest',
        'resvers104',
        'wholeMachineTest',
        'freshAirTest',
        'freshAirSpeedSetting',
        'innerFanSpeedSetting',
        'externalFanSpeedSetting',
        'compressorFrequencySetting',
        'sensorRoomHumiditySetting',
        'sensorRoomMoistureContentSetting',
        'sensorRoomTempreturenSetting',
        'resvers1014',
        'resvers1015',
        'resvers1016',
        'resvers1017',
        'resvers1018',
        'resvers1019',
        'clearTotalBattery',
        'forcedCalibrationOfFluorine',
        'systemRefrigerant',
        'detectionFilter',
        'resetForPowerOn',
        'measureTempretureForTransformer',
        'exhaustSensorDectect',
        'measureTempretureForTransformer2',
        'quickLeakageDetectionOfRefrigerant',
        'externalFanMotorTypeIdentify',
        'filterPowerCompensation',
        'filterPowerBaseInit',
        'powerFrequencyProtect',
        'superECO',
        'faultShielding',
        'forcedDefrosting',
        'fluorideManage',
        'unlockOutboardLockFault',
        'fluorideManageExecutable',
    ],
    ['aiModeSwitch', 'aiEnable', 'aiTargetFrequency'],
]
export function P_8009369(json) {
    this.status = json
}

P_8009369.prototype.fromDevice = function (json) {
    return fromDevice(json)
}

P_8009369.prototype.toDevice = function (json) {
    if (typeof json == 'string') {
        json = JSON.parse(json)
    }
    return toDevice(json)
}

function fromDevice(json) {
    return protocolToCommon(json, getCurrentTime())
}

/**
 * 将通用格式转换为设备识别的协议
 */
function toDevice(json) {
    if (typeof json == 'string') {
        json = JSON.parse(json)
    }
    var sn = 'sn'
    var cid = 1
    
    var result
    var payload
    var method = json.method || ''
    if (method == 'control') {
        payload = json.payload
    } else {
        payload = json
    }
    
    result = commonToProtocol(cid, sn, payload)
    
    return result
}

function queryDevStatus(cid, sn) {
    return '55AA1000400000310280F000400000000'
}

var chupdate = {
    method: 'update',
    state: {
        reported: '',
    },
    timestamp: 0,
    version: 1,
}

var faultsKeyTable = [
    'ERR-U-00000',
    'ERR-N-01002',
    'ERR-N-01003',
    'ERR-N-N0003',
    'ERR-N-N0004',
    'ERR-N-N0005',
    '',
    '',
    '',
    '',
    '',
    'ERR-N-01001',
    'ERR-N-N0012',
    'ERR-N-N0013',
    'ERR-N-N0014',
    'ERR-N-N0015',
    'ERR-N-N0016',
    'ERR-N-N0017',
    'ERR-N-N0018',
    'ERR-N-N0019',
    'ERR-N-N0020',
    'ERR-N-N0021',
    'ERR-N-N0022',
    'ERR-N-N0023',
    'ERR-N-N0024',
    'ERR-N-N0025',
    'ERR-N-N0026',
    'ERR-N-N0027',
    'ERR-N-N0028',
    '',
    'ERR-X-N0030',
    'ERR-X-N0031',
    'ERR-X-N0032',
    'ERR-X-N0033',
    'ERR-X-N0034',
    'ERR-X-N0035',
    'ERR-X-N0036',
    'ERR-X-N0037',
    '',
    '',
    'ERR-N-01009',
    'ERR-N-01008',
    'ERR-N-N0042',
    'ERR-N-N0043',
    'ERR-N-N0044',
    '',
    'ERR-N-N0046',
    'ERR-N-N0047',
    'ERR-N-N0048',
    '',
    'ERR-W-00006',
    'ERR-Y-N0051',
    'ERR-Y-N0052',
    'ERR-Y-N0053',
    'ERR-Y-N0054',
    '',
    '',
    '',
    '',
    '',
    'ERR-W-00001',
    'ERR-W-00002',
    'ERR-W-00003',
    'ERR-N-N0063',
    'ERR-N-N0064',
    'ERR-N-N0065',
    'ERR-N-N0066',
    '',
    'ERR-N-N0068',
    'ERR-N-N0069',
    'ERR-W-00007',
    'ERR-W-N0071',
    'ERR-W-N0072',
    'ERR-W-N0073',
    'ERR-W-N0074',
    'ERR-W-N0075',
    'ERR-W-N0076',
    'ERR-W-N0077',
    'ERR-W-N0078',
    'ERR-W-N0079',
    'ERR-W-N0080',
    '',
    'ERR-E-N0122',
    'ERR-N-N0083',
    'ERR-N-N0084',
    'ERR-N-N0085',
    'ERR-N-N0086',
    'ERR-Q-N0087',
    '',
    '',
    'ERR-Q-01016',
    'ERR-Q-01014',
    'ERR-Q-01003',
    'ERR-Q-01007',
    'ERR-Q-01004',
    'ERR-Q-01005',
    'ERR-Q-01028',
    'ERR-Q-01030',
    'ERR-Q-01019',
    '',
    'ERR-Q-01018',
    'ERR-J-N0101',
    'ERR-Q-01011',
    'ERR-Q-01010',
    'ERR-Q-01013',
    'ERR-Q-01001',
    'ERR-Q-01002',
    'ERR-J-N0107',
    '',
    '',
    'ERR-Q-01024',
    'ERR-Q-01025',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'ERR-Y-N0120',
    'ERR-N-01004',
    '',
    'ERR-E-N0123',
    'ERR-Q-N0124',
]

var protectKetTable = [
    'ERR-P-N0001',
    'ERR-P-N0002',
    'ERR-P-N0003',
    'ERR-P-N0004',
    'ERR-P-N0005',
    'ERR-P-N0006',
    'ERR-P-N0007',
    '',
    '',
    '',
    '',
    'ERR-N-00001',
    'ERR-N-00002',
    'ERR-N-00003',
    'ERR-N-00004',
    'ERR-N-00005',
    'ERR-N-00006',
    'ERR-N-00007',
    'ERR-N-00008',
    'ERR-P-N0019',
    '',
]

var faultsKeyCode = {
    'ERR-N-01002': 'XSGZDM',
    'ERR-N-01003': 'XSGZDM',
    'ERR-N-01006': 'XSGZDM',
    'ERR-N-01009': 'XSGZDM',
    'ERR-N-01008': 'XSGZDM',
    'ERR-W-00006': 'XSGZDM',
    'ERR-W-00001': 'XSGZDM',
    'ERR-W-00002': 'XSGZDM',
    'ERR-W-00003': 'XSGZDM',
    'ERR-W-00007': 'XSGZDM',
    'ERR-Q-01016': 'XSGZDM',
    'ERR-Q-01014': 'XSGZDM',
    'ERR-Q-01003': 'XSGZDM',
    'ERR-Q-01007': 'XSGZDM',
    'ERR-Q-01004': 'XSGZDM',
    'ERR-Q-01005': 'XSGZDM',
    'ERR-Q-01019': 'XSGZDM',
    'ERR-Q-01018': 'XSGZDM',
    'ERR-Q-01011': 'XSGZDM',
    'ERR-Q-01010': 'XSGZDM',
    'ERR-Q-01013': 'XSGZDM',
    'ERR-Q-01001': 'XSGZDM',
    'ERR-Q-01002': 'XSGZDM',
    'ERR-N-01004': 'XSGZDM',
    'ERR-Q-01024': 'XSGZDM',
    'ERR-W-00009': 'XSGZDM',
    'ERR-W-00010': 'XSGZDM',
    'ERR-W-00011': 'XSGZDM',
    'ERR-Q-01028': 'XSGZDM',
    'ERR-Q-01030': 'XSGZDM',
    'ERR-Q-01031': 'XSGZDM',
    'ERR-Q-01032': 'XSGZDM',
    'ERR-Q-01025': 'XSGZDM',
    'ERR-Q-02014': 'XSGZDM',
    'ERR-E-N0122': 'XSGZDM',
    'ERR-N-N0003': 'XSGZDM',
    'ERR-N-N0004': 'XSGZDM',
    'ERR-N-N0005': 'XSGZDM',
    'ERR-N-N0042': 'XSGZDM',
    'ERR-N-N0046': 'XSGZDM',
    'ERR-N-N0047': 'XSGZDM',
    'ERR-N-N0048': 'XSGZDM',
    'ERR-N-N0063': 'XSGZDM',
    'ERR-N-N0064': 'XSGZDM',
    'ERR-N-N0065': 'XSGZDM',
    'ERR-N-N0066': 'XSGZDM',
    'ERR-N-N0083': 'XSGZDM',
    'ERR-N-N0084': 'XSGZDM',
    'ERR-N-N0085': 'XSGZDM',
    'ERR-N-N0086': 'XSGZDM',
    'ERR-N-N0043': 'XSGZDM',
    'ERR-N-N0044': 'XSGZDM',
    'ERR-Q-N0087': 'XSGZDM',
    'ERR-Q-N0124': 'XSGZDM',
}

var faultsKeyName = {
    'ERR-N-01002': '室温传感器故障',
    'ERR-N-01003': '内盘温度传感器故障',
    'ERR-N-01006': '室内机直流风机故障',
    'ERR-N-01009': '室内机无法接收上网模块（SOC，WIFI)通讯故障',
    'ERR-N-01008': '显示面板无法接收内机通信',
    'ERR-W-00006': '压缩机顶置保护',
    'ERR-W-00001': '室外温度传感器故障',
    'ERR-W-00002': '外盘温度传感器故障',
    'ERR-W-00003': '排气温度传感器故障',
    'ERR-W-00007': '外风扇电机故障',
    'ERR-Q-01016': '逆变器PWM初始化故障',
    'ERR-Q-01014': 'AD_Offset异常检出故障',
    'ERR-Q-01003': '逆变器交流过电流故障',
    'ERR-Q-01007': '逆变器IPM故障-边沿',
    'ERR-Q-01004': '失步检出',
    'ERR-Q-01005': '欠相检出故障-速度推定脉冲检出法',
    'ERR-Q-01019': '温度异常',
    'ERR-Q-01018': 'PFC_PWM初始化故障',
    'ERR-Q-01011': 'PFC输入过电流检出故障',
    'ERR-Q-01010': 'PFC_IPM故障-电平',
    'ERR-Q-01013': 'PFC低电压（有效值）检出故障',
    'ERR-Q-01001': '逆变器直流过电压故障',
    'ERR-Q-01002': '逆变器直流低电压故障',
    'ERR-N-01004': '内机无法接收通信',
    'ERR-Q-01024': 'EEPROM数据错',
    'ERR-W-00009': '系统爆破性泄露',
    'ERR-W-00010': '缺氟故障',
    'ERR-W-00011': '绕组温度异常故障',
    'ERR-Q-01028': 'DQ轴电流控制异常',
    'ERR-Q-01030': 'DQ轴电流控制积分饱和异常',
    'ERR-Q-01031': 'PFC AD偏置故障',
    'ERR-Q-01032': '母线电压突变故障',
    'ERR-Q-01025': 'EEPROM初始化错',
    'ERR-Q-02014': '压缩机、外风机驱动类故障',
    'ERR-N-N0012': '室内风机软件过电流(E40/CF0)',
    'ERR-N-N0013': '室内风机硬件过电流(E41/CF1)',
    'ERR-N-N0014': '室内风机硬件过电流(E42/CF2)',
    'ERR-N-N0015': '室内风机速度推定故障(E43/CF3)',
    'ERR-N-N0016': '室内风机速度控制饱和故障(E44/CF4)',
    'ERR-N-N0017': '室内风机直流过电压(E45/CF5)',
    'ERR-N-N0018': '室内风机直流低电压(E46/CF6)',
    'ERR-N-N0019': '室内风机AD偏置故障(E47/CF7)',
    'ERR-N-N0020': '室内风机PWM初始化故障(E48/CF8)',
    'ERR-N-N0021': '室内风机欠相故障(E49/CF9)',
    'ERR-N-N0022': '室内风机欠相故障(E4A/CFA)',
    'ERR-N-N0023': '室内风机欠相故障(E4B/CFB)',
    'ERR-N-N0024': '室内风机驱动模块温度异常(E4C/CFC)',
    'ERR-N-N0025': '室内风机IPM模块温度异常(E4D/CFD)',
    'ERR-N-N0026': '室内风机功率过载(E4E/CFE)',
    'ERR-N-N0027': '室内风机EEPROM数据错(E4F/CFF)',
    'ERR-Y-N0051': '系统爆破性泄漏(PE/E01)',
    'ERR-Y-N0052': '缺氟故障(E02)',
    'ERR-Y-N0053': '绕组温度异常故障(E03)',
    'ERR-Y-N0054': '绕组温度过高故障(E04)',
    'ERR-W-N0071': '风机软件过电流(E20/EF0)',
    'ERR-W-N0072': '风机硬件过电流(E21/EF1)',
    'ERR-W-N0073': '风机硬件过电流(E22/EF2)',
    'ERR-W-N0074': '风机速度推定故障(E23/EF3)',
    'ERR-W-N0075': '风机速度控制饱和故障(E24/EF4)',
    'ERR-W-N0076': '风机电流控制故障(E25/EF5)',
    'ERR-W-N0077': '风机电流控制积分饱和故障(E26/EF6)',
    'ERR-W-N0078': '风机AD偏置故障(E27/EF7)',
    'ERR-W-N0079': '风机模块PWM初始化故障(E28/EF8)',
    'ERR-W-N0080': '电流不平衡故障(E29/EF9)',
    'ERR-N-N0028': '室内风机故障(E4H/CFH)',
    'ERR-J-N0101': 'PFC AD偏置故障(」10/EP1)',
    'ERR-J-N0107': '母线电压突变故障(C0/EP7)',
    'ERR-Y-N0120': '压缩机、外风机驱动类故障(E9/EUF)',
    'ERR-Y-N0122': '外机主控MCU与风机驱动MCU之间通信故障(EH0)',
    'ERR-Y-N0123': '三相电源缺相故障(E31)',
    'ERR-X-N0030': '新风交流风机故障(CEF/CE0)',
    'ERR-X-N0031': '新风机硬件过电流(CE1)',
    'ERR-X-N0032': '新风机速度推定故障(CE3)',
    'ERR-X-N0033': '新风机直流过电压(CE5)',
    'ERR-X-N0034': '新风机直流低电压(CE6)',
    'ERR-X-N0035': '新风机PWM初始化故障(CE8)',
    'ERR-X-N0036': '新风机欠相故障(CEA)',
    'ERR-X-N0037': '新风机IPM模块温度异常(CED)',
    'ERR-X-N0038': '新风机EEPROM数据错（CEF）',
    'ERR-P-N0001': '系统异常(P0/P00)',
    'ERR-P-N0002': '排气脱落(PA/P01)',
    'ERR-P-N0003': '标定氟量(PB/P02)',
    'ERR-P-N0004': '系统缺氟(PC/P03)',
    'ERR-P-N0005': '系统混入空气(P04)',
    'ERR-P-N0006': '绕组温度保护(PD/P05)',
    'ERR-P-N0007': '制冷回路堵塞(P06)',
    'ERR-P-N0008': '冷媒过充(P07)',
    'ERR-P-N0009': '系统泄漏点提醒（慢漏）(P08)',
    'ERR-P-N0010': '压机排气温度保护(P10)',
    'ERR-N-00001': '压缩机油温保护(P09)',
    'ERR-N-00002': '过电流保护(P20)',
    'ERR-N-00003': '制热除霜(P30)',
    'ERR-N-00004': '制热过载保护(P40)',
    'ERR-N-00005': '制冷防冻结(P50)',
    'ERR-N-00006': '制冷过载保护(P60)',
    'ERR-N-00007': '室外机模块过温保护(P70)',
    'ERR-N-00008': '运转频率低于最低频率(P90)',
    'ERR-P-N0019': '直流风机IPM模块过温保护(P9/P90)',
    'ERR-P-N0020': '室外环境温度过高保护(P65)',
    'ERR-P-N0021': '室外大散热器过温停机保护(PA1)',
    'ERR-E-N0122': '外机主控MCU与风机驱动MCU之间通信故障(EH0)',
    'ERR-N-N0003': '室内液管温度传感器故障(C63)',
    'ERR-N-N0004': '室内气管温度传感器故障(C64)',
    'ERR-N-N0005': '线控器温度传感器故障(C65)',
    'ERR-N-N0042': '室内机与线控器通讯故障(CH2)',
    'ERR-N-N0046': '水位开关故障/水泵异常(CC0)',
    'ERR-N-N0047': '室内机与系统模式冲突(CC1)',
    'ERR-N-N0048': '室内外机能力匹配错误(CC2)',
    'ERR-N-N0063': '外机液管温度传感器故障(E66)',
    'ERR-N-N0064': '外机气管温度传感器故障(E67)',
    'ERR-N-N0065': '室外机过冷器入口温度传感器故障(E68)',
    'ERR-N-N0066': '室外机过冷器出口温度传感器故障(EA1)',
    'ERR-N-N0067': '室外大散热器传感器故障(E69)',
    'ERR-N-N0083': '外机主机与压缩机驱动MCU之间通讯故障(EH1)',
    'ERR-N-N0084': '外机压缩机驱动MCU与风机驱动MCU之间通讯故障(EH2)',
    'ERR-N-N0085': '室外主机收不到4G-CAT1数据(EH3)',
    'ERR-N-N0086': '系统爆破性泄漏(EL0)',
    'ERR-N-N0043': '内风机驱动芯片通信故障(CH3)',
    'ERR-N-N0044': '新风机驱动芯片通信故障(CH4)',
    'ERR-Q-N0087': '回路堵塞+混空气(EL1)',
    'ERR-Q-N0124': '室外机与某一台或几台内机通信异常(FH5)',
}

var commandTypeSet = {
    /**
     * 空调控制 组号0
     */
    /**
     * 属性号1 模组版本
     * 0 - 关机
     * 1 - 开机
     */
    softVersion: 0x0001,
    /**
     * 空调控制 组号1
     */
    /**
     * 属性号0 开关机
     */
    power: 0x0100,
    /**
     * 属性号1 设定模式
     *  0：自动
     1：制热
     2：制冷
     3：除湿
     4：送风模式
     */
    mode: 0x0101,
    /**
     * 属性号2 设定温度
     */
    settemp: 0x0102,
    /**
     * 属性号3 设定风速(档位风)
     *  0-自动，1-微风，2-低风，3-中风，4-高风，5-强力
     */
    mark: 0x0103,
    /**
     * 属性号4 设定风速(无极风)
     *  0-显示自动风，1-100：风速百分比 1%-100%
     */
    continueslyWind: 0x0104,
    /**
     * 属性号5 设定电辅热
     * 0-关，1-开，其他值无效
     */
    ptcheat: 0x0105,
    /**
     * 属性号6 手动睡眠/节能/ECO
     * 0-关，1-开，其他值无效
     */
    sleepmode: 0x0106,
    eco: 0x0106,
    
    /**
     * 运行状态 组号2
     * 都是运行状态，不能设置
     */
    
    /**
     * 出风控制 组号3
     */
    /**
     * 属性号0 防直吹
     *  0-关，1-开，其他值无效
     */
    antiDirectBlow: 0x0300,
    /**
     * 属性号1 柔风
     *  0-关闭，1-上柔风，2-下柔风，3-上下柔风
     *  其他值无效
     */
    softwind: 0x0301,
    /**
     * 属性号2 天幕风
     *  0-关，1-开，其他值无效
     */
    awningWind: 0x0302,
    /**
     * 属性号3 地毯风
     *  0-关闭，1-开启
     */
    carpetWind: 0x0303,
    /**
     * 属性号4 无风感
     *  0-关闭，1-开启
     */
    noWindFeeling: 0x0304,
    /**
     * 属性号9 柜机特殊功能
     * 定义：0-无效，1-xxx: 特殊状态、位置
     *  0-无效，1-劲爽风，2-环抱风，3-净柔风，4-健康风暂定
     */
    embraceWind: 0x0309,
    /**
     * 属性号10 同步扫风开关（预留）
     * 定义：0-解开同步，1-绑定同步扫风
     *  【Byte1】上下风向 V1+上下风向 V2 的同步
     *    对应位置：V1 上部+V2 下部，或者：V1 左部+V2 右部
     *  【Byte2】左右风向 H1+左右风向 H2 的同步
     *    对应位置：H1 上部/H2 下部，或者：H1 左部/H2 右部
     */
    syncSweep: 0x030a,
    syncHordir: 0x030a,
    syncVerdir: 0x030a,
    /**
     * 属性号11 上下风向V1 扫风开关
     * 0：关闭、1：摆动
     */
    verdir: 0x030b,
    /**
     * 属性号13 上下风向V1 扫风范围
     * Byte1：0-100，设置开始角度位置
     * Byte2：0-100，设置停止角度位置
     */
    verdirFixPos: 0x030d,
    setAnglePositionForVerdir: 0x030d,
    
    /**
     * 属性14 上下风向V2 扫风开关
     *  0：关闭、1：摆动
     */
    verdirV2: 0x030e,
    /**
     * 属性号16 上下风向V2 扫风范围
     * Byte1：0-100，设置开始角度位置
     * Byte2：0-100，设置停止角度位置
     */
    verdirFixPosV2: 0x0310,
    setAnglePositionForVerdirV2: 0x0310,
    
    /**
     * 属性17 左右风向H1 扫风开关
     *  0：关闭、1：摆动
     */
    hordir: 0x0311,
    /**
     * 属性18 左右风向H1 扫风范围（预留）
     *  Byte1：0-100，设置开始角度位置
     *  Byte2：0-100，设置停止角度位置
     */
    hordirAngle: 0x0312,
    
    /**
     * 属性19 左右风向H1 固定位置
     *  Byte1：0-100，设定角度位置
     *  Byte2：0-100，实际角度位置
     */
    hordirFixPos: 0x0313,
    setPositionForLeftRightWind: 0x0313,
    
    /**
     * 属性号20 左右风向 H2
     * 0-关闭，1-开启
     */
    hordirH2: 0x0314,
    /**
     * 属性22 左右风向H2 固定位置
     *  Byte1：0-100，设定角度位置
     *  Byte2：0-100，实际角度位置
     */
    hordirFixPosH2: 0x0316,
    setPositionForLeftRightWindH2: 0x0316,
    /**
     * 属性号23 雷达：风避人吹
     * 0-关闭，1-开启
     */
    radarWindAvoidPeople: 0x0317,
    
    /**
     * 属性号24 雷达：风随人动
     * 0-关闭，1-开启
     */
    radarWindFollowPeople: 0x0318,
    /**
     * 属性号25 雷达：人近风柔
     * 0-关闭，1-开启
     */
    radarPeopleNearSoftWind: 0x0319,
    /**
     * 属性号26 雷达：传感器信息 10byte
     */
    radarSensorInfo: 0x031a,
    /**
     * 属性号28 上下风向V3 扫风开关
     * 0：关闭、1：摆动
     */
    verdirV3: 0x031c,
    /**
     * 属性号30 上下风向V3 固定位置
     * Byte1：0-100，设定角度位置
     * Byte2：0-100，实际角度位置
     */
    verdirFixPosV3: 0x031e,
    setAnglePositionForVerdirV3: 0x031e,
    
    /**
     * 属性号31 上下风向V4 扫风开关
     * 0：关闭、1：摆动
     */
    verdirV4: 0x031f,
    /**
     * 属性号33 上下风向V4 固定位置
     * Byte1：0-100，设定角度位置
     * Byte2：0-100，实际角度位置
     */
    verdirFixPosV4: 0x0321,
    setAnglePositionForVerdirV4: 0x0321,
    
    /**
     * 增强控制 组号4
     */
    /**
     * 属性号0 三阶风/三键健康风
     * Byte1：设定状态，0-关闭/结束，1-打开/进行中
     * Byte2：实际运行的阶段，取值 0-4，根据阶段定义确定
     *  下发 0x01,0x00，表示设定开
     */
    thirdOrderWind: 0x0400,
    /**
     * 属性号1 反转除尘
     *  0-关闭，1-开启
     */
    // inversionDust:0x0401,
    /**
     * 属性号2 亮度调节
     *  0：熄灭
     *  1-8：8 级亮度
     *  255：自动
     */
    brightness: 0x0402,
    
    /**
     * 属性号3 蜂鸣器
     * 0-关闭，1-开启
     */
    buzzer: 0x0403,
    /**
     * 属性号4 空气清新/负离子/IFD
     *  0-关闭，1-开启
     */
    airclean: 0x0404,
    /**
     * 属性号5 UV紫外杀菌
     */
    uvInactive: 0x0405,
    /**
     * 属性号6 用户反馈
     */
    userFeedback: 0x0406,
    /**
     * 属性号7 语音识别
     */
    ASR: 0x0407,
    /**
     * 属性号8 语音播报/喇叭音量
     */
    voiceBroadcast: 0x0408,
    /**
     * 属性号9 湿度控制（温湿双控）
     * 0-关，1-开
     */
    humidityControl: 0x0409,
    /**
     * 属性号10 设定湿度
     * 0-温双控关，1%-100%
     */
    setHumidity: 0x040a,
    /**
     * 属性号11 除湿功能自动投入使能
     * 0-禁止，1-允许
     */
    dehumidifyAutoEnable: 0x040b,
    /**
     * 属性号14 灯带显示
     * Byte1:灯带1设定，0-关闭，1打开Byte2:灯带2设定，0-关闭，1打开Byte3:灯带3设定，0-关闭，1打开Byte4:(灯带4预留)，0-关闭，1打开
     * 1、CHS柜机使用2个分组:
     * 分组1-开关灯带1(上左)和灯带2(上右)，
     * 分组2-开关灯带3(下部)。
     */
    light: 0x040e,
    lightV1: 0x040e,
    lightV2: 0x040e,
    lightV3: 0x040e,
    
    /**
     * 维护管理 组号5
     */
    /**
     * 属性号0 自清洁
     *  设定状态+实际阶段 例如：下发值 0x01,0x00，表示设定开
     */
    selfclean: 0x0500,
    /**
     * 属性号1 干燥防霉设定（吹余冷）
     *  0-关，1-开，其他值无效
     */
    dryMidewProof: 0x0501,
    /**
     * 属性号2 关机除霜设定
     *  0-关，1-开，其他值无效
     */
    shutdownDefrost: 0x0502,
    /**
     * 属性号3 定时开分钟
     *  设定分钟数+剩余分钟数
     */
    setMinutesForPowerOn: 0x0503,
    /**
     * 属性号4 定时关分钟
     *  设定分钟数+剩余分钟数
     */
    setMinutesForPowerOff: 0x0504,
    /**
     * 属性号5 时间段设置
     */
    timePeriod: 0x0505,
    /**
     * 属性号6 熄屏时间
     *  00：立即关屏
     15：15 秒
     30：30 秒
     60：1 分钟
     120：2 分钟
     300：5 分钟
     600：10 分钟
     0xffff：永久点亮
     */
    offScreenTime: 0x0506,
    /**
     * 属性号7 时间睡眠
     *  0-无效，1-生效
     *  与时间息屏同步
     */
    timeSleep: 0x0507,
    /**
     * 属性号12 时间段：屏显功能
     * 显示亮度调节（预留）
     */
    screenDisplay: 0x050c,
    /**
     * 属性号13 反转除尘
     *  0-关闭，1-开启
     */
    inversionDust: 0x050d,
    /**
     * 属性号14 摆叶易拆洗
     * 0-关，1-开
     */
    bladesEasyClean: 0x050e,
    /**
     * 属性号15 电网限功率运行
     * 0-关，1-开
     */
    gridPowerLimit: 0x050f,
    /**
     * 属性号16 时间段：语音播报
     * 0-关，1-开
     */
    timePeriodVoiceBroadcast: 0x0510,
    /**
     * 属性号17 时间段：蜂鸣器
     * 0-关，1-开
     */
    timePeriodBuzzer: 0x0511,
    /**
     * 属性号18 时间段：功能是否生效
     * 0-关，1-开
     */
    timePeriodEnableFlag: 0x0512,
    /**
     * 属性号19 时间段：雷达功能是否生效
     * 0-关，1-开
     */
    timePeriodRadar: 0x0513,
    
    /**
     * 高级配置 组号7
     */
    /**
     * 属性号0 显示内容设置
     *  0-显示设定，1-显示室温
     */
    settingForDisplay: 0x0700,
    /**
     * 属性号1 使用角色
     *  0-正常模式，1-老人模式，2-小孩模式
     */
    roles: 0x0701,
    /**
     * 属性号2 使用场地
     *  0：未定义（默认公用场所） 1：公用场所 2：家用用户 3：其他
     */
    usingField: 0x0702,
    /**
     * 属性号3 相对人的吹风位置
     *  0：未定义 1：人体正前 2：人体正后 3：人体正左
     *  4：人体正右 5：人体右前 6：人体左前 7：人体右后 8：人体左后 9：人体头顶
     */
    windOutletPosition: 0x0703,
    /**
     * 属性号4 开机参数设置
     */
    paramForPowerOn: 0x0704,
    /**
     * 属性号5 指令来源
     *  255：尚未定义的控制方式
     *  0：非控制类指令，可忽略
     *  1：遥控器
     *  2：机身按键
     *  3：智汇家 APP
     *  4：数字遥控器（小程序-蓝牙）
     *  5：语音（离线语音模块）
     *  6：语音（在线语音模块）
     *  7：语音（在线，其他成套设备控制）
     *  8：语音（在线，第三方语音终端）
     *  9：云端场景控制
     *  10：随意贴贴（NFC）
     *  11：手势控制
     *  12：数字遥控器（小程序-远程）
     */
    source: 0x0705,
    /**
     * 属性号6 工程集控-锁定操作
     * 0-集控解锁状态，1-集控锁定状态
     */
    locked: 0x0706,
    /**
     * 属性号7 工程集控-禁用电加热
     * 0-允许使用，1-禁用电加热
     */
    disPtcheat: 0x0707,
    /**
     * 属性号8 工程集控-限制设定温度 2byte
     * Byte1：设定温度的下限，Byte2：设定温度的上限
     */
    limitSetTemp: 0x0708,
    /**
     * 属性号9 正常用户模式选择 or 工程集控模式
     * 0-正常模式，1-工程模式-有锁定功能，2-工程模式-无锁定功能
     */
    currentStatus: 0x0709,
    /**
     * 属性号10 工程机CAT1模组状态
     */
    cat1ModuleStatus: 0x070a,
    /**
     * 属性号11 变匹数设置
     * 0-匹数不变，1-匹数变小，2-匹数变大
     */
    horseChange: 0x070b,
    /**
     * 属性号12 单冷/冷暖设置
     * 0-冷暖（默认），1-单冷机
     */
    coolOrHeat: 0x070c,
    
    /**
     * 新风功能 组号8
     */
    /**
     * 属性号0 新风开关
     */
    freshswitch: 0x0800,
    freshair: 0x0800,
    /**
     * 属性号2 重置新风滤芯
     */
    resetFreshFilter: 0x0802,
    /**
     * 属性号3 新风自动投入使能
     * 0-禁止，1-允许
     */
    freshAutoEnable: 0x0803,
    
    /**
     * AI功能 组号11
     */
    /**
     * 属性号0 AI模式开关
     */
    aiModeSwitch: 0x0b00,
    /**
     * 属性号1 AI运行使能
     */
    aiEnable: 0x0b01,
    /**
     * 属性号2 AI模式设定目标频率
     */
    aiTargetFrequency: 0x0b02,
}

function HexStrToByte(str) {
    var mArray = new Array()
    var i = 0
    var highByte, lowByte
    
    for (i = 0; i < str.length; i += 2) {
        highByte = str[i].toUpperCase().charCodeAt()
        lowByte = str[i + 1].toUpperCase().charCodeAt()
        
        if (highByte > 0x39) highByte -= 0x37
        else highByte -= 0x30
        
        if (lowByte > 0x39) lowByte -= 0x37
        else lowByte -= 0x30
        
        mArray[i / 2] = (highByte << 4) | lowByte
    }
    
    return mArray
}

//字节流转换为十六进制字符串
function ByteToHexStr(arr) {
    var i = 0
    var highByte, lowByte
    var str = ''
    
    for (i = 0; i < arr.length; i++) {
        highByte = arr[i] >> 4
        lowByte = arr[i] & 0x0f
        
        highByte += 0x30
        
        if (highByte > 0x39) str += String.fromCharCode(highByte + 0x07)
        else str += String.fromCharCode(highByte)
        
        lowByte += 0x30
        if (lowByte > 0x39) str += String.fromCharCode(lowByte + 0x07)
        else str += String.fromCharCode(lowByte)
    }
    
    return str
}

function checkHead(arr) {
    if (arr[0] != 0x55 && arr[1] != 0xaa) return false
    
    return true
}

function getCheckSun(arr) {
    var sum = 0
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i]
    }
    sum = sum & 0xffff
    return sum
}

function getCheckSunOneByte(arr) {
    var sum = 0
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i]
    }
    sum = sum & 0xff
    return sum
}

function checkSun(arr) {
    var sum = 0
    for (var i = 0; i < arr.length - 2; i++) {
        sum += arr[i]
    }
    sum = sum & 0xffff
    return sum
}

function getAttributeName(data) {
    return data[1] * 256 + data[0]
}

function getResponeCode(data) {
    return data
}

function getAttributeValueOneByte(data) {
    return data
}

function getAttributeValueOneByteFromDec(data) {
    return Number(data.toString(16))
}

function getAttributeValueTwoByte(data) {
    return data[1] * 256 + data[0]
}

function getAttributeValueFourByte(data) {
    return data[0] + data[1] * 256 + data[2] * 65536 + data[3] * 16777216
}

function getTimeStampEightBytes(data) {
    var timestamp = 0
    for (var i = data.length - 1; i >= 0; i--) {
        timestamp = timestamp * 256 + data[i]
    }
    return timestamp
}

function getAttributeValueFourThirtyTwoByte(data) {
    return String.fromCharCode.apply(String, data)
}

function getAttributeValueByLen(data, pos, length) {
    var content = data.slice(pos, pos + length)
    var value
    value = ByteToHexStr(content)
    return value
}

function getAttributeValueByAttrLen(data, pos, length) {
    var content = data.slice(pos, pos + length)
    var value = ''
    var letter
    for (var i = 0; i < length; i++) {
        if (content[i] != 0) {
            letter = String.fromCharCode(content[i])
            value += letter
        }
    }
    return value
}

/**
 * 解析故障
 */
function parseFaultMessage(data) {
    /**
     * 数据长度
     */
    var length = data[2]
    var pos = 5
    var status = {}
    var faults = {}
    var faultsCodes = []
    var content
    while (pos < length - 2) {
        content = data.slice(pos, pos + 2)
        var faultNum = getAttributeName(content)
        var faultKey = faultsKeyTable[faultNum]
        if (faultKey === '' || faultKey.length == 0) {
            pos += 2
            continue
        }
        var fault = {}
        fault.code = 'XSGZDM'
        fault.name = faultsKeyName[faultKey]
        faults[faultKey] = fault
        faultsCodes.push(faultNum)
        pos += 2
    }
    
    // status.faults = JSON.stringify(faults);
    status.faults = faults
    status.faultsCode = faultsCodes
    return status
}

/**
 * 保护信息
 */
function parseProtectMessage(data) {
    /**
     * 数据长度
     */
    var length = data[2]
    var pos = 5
    var status = {}
    var protects = {}
    var protectsCodes = []
    var content
    while (pos < length - 2) {
        content = data.slice(pos, pos + 2)
        var protectNum = getAttributeName(content)
        var protectKey = protectKetTable[protectNum]
        if (protectKey === '' || protectKey.length == 0) {
            pos += 2
            continue
        }
        var protect = {}
        protect.code = 'XSGZDM'
        protect.name = faultsKeyName[protectKey]
        protects[protectKey] = protect
        protectsCodes.push(protectNum)
        pos += 2
    }
    
    status.protects = protects
    status.protectsCodes = protectsCodes
    return status
}

/**
 * wifi信息
 * 55AA0715041F01
 */
function parseWiFiMessage(data, position) {
    /**
     * 数据长度
     */
    var length = data.length
    var pos = position
    var status = {}
    var wifiMsg = data[pos]
    status.wifiStatus = wifiMsg
    return status
}

/**
 * 机型信息
 */
function parseModelMessage(data, position) {
    /**
     * 数据长度
     */
    var length = data.length
    var pos = position
    var content
    var status = {}
    /**
     * 返回码
     */
    var statusCode
    statusCode = data[pos]
    pos += 1
    if (statusCode != 0) {
        return
    }
    
    /**
     * 硬件版本
     */
    content = data.slice(pos, pos + 32)
    pos += 32
    var value = ''
    var letter
    for (var i = 0; i < 32; i++) {
        if (content[i] != 0) {
            letter = String.fromCharCode(content[i])
            value += letter
        }
    }
    status.model = value
    
    return status
}

/**
 * 固件信息
 */
function parseHardWareMessage(data, position) {
    /**
     * 数据长度
     */
    var length = data.length
    var pos = position
    var content
    var status = {}
    /**
     * 返回码
     */
    var statusCode
    statusCode = data[pos]
    pos += 1
    if (statusCode != 0) {
        return
    }
    /**
     * 芯片编号
     */
    content = data[pos]
    pos += 1
    status.socNum = content
    
    /**
     * 固件版本
     */
    content = data.slice(pos, pos + 2)
    pos += 2
    status.firmwareVersion = content[0] + content[1]
    
    /**
     * 硬件版本
     */
    content = data.slice(pos, pos + 32)
    pos += 32
    var value = ''
    var letter
    for (var i = 0; i < 32; i++) {
        if (content[i] != 0) {
            letter = String.fromCharCode(content[i])
            value += letter
        }
    }
    status.hwVersion = value
    
    /**
     * 硬件型号
     */
    content = data.slice(pos, pos + 32)
    pos += 32
    value = ''
    for (var i = 0; i < 32; i++) {
        if (content[i] != 0) {
            letter = String.fromCharCode(content[i])
            value += letter
        }
    }
    status.hwModel = value
    
    return status
}

/**
 * 物料代码SN
 */
function parseDeviceSn(data, position) {
    /**
     * 数据长度
     */
    var length = data.length
    var pos = position
    var content
    var status = {}
    /**
     * 返回码
     */
    var statusCode
    statusCode = data[pos]
    pos += 1
    if (statusCode != 0) {
        return
    }
    
    /**
     * 内机SN
     */
    content = data.slice(pos, pos + 32)
    pos += 32
    var value = ''
    var letter
    for (var i = 0; i < 32; i++) {
        if (content[i] != 0) {
            letter = String.fromCharCode(content[i])
            value += letter
        }
    }
    status.innerSN = value
    
    /**
     * 外机SN
     */
    content = data.slice(pos, pos + 32)
    pos += 32
    var value = ''
    var letter
    for (var i = 0; i < 32; i++) {
        if (content[i] != 0) {
            letter = String.fromCharCode(content[i])
            value += letter
        }
    }
    status.outterSN = value
    
    return status
}

/**
 * 解析状态
 */
function ParserMessage(sn, data, position) {
    /**
     * 数据长度
     */
    var length = data.length
    var pos = position
    var statusCode = data[pos]
    pos += 1
    var content
    var status = {}
    /**
     * 返回码
     */
    var responeCode
    /**
     * 属性值
     */
    var attributeValue
    /**
     * 属性组号
     */
    var attributeGroupNum
    /**
     * 属性号
     */
    var attributeNum
    /**
     * 属性值长度
     */
    var attributeLen
    
    while (pos < length - 2) {
        content = data.slice(pos, pos + 2)
        pos += 2
        
        /**
         * 获取属性组号
         */
        attributeNum = content[0]
        /**
         * 获取属性号
         */
        attributeGroupNum = content[1]
        
        responeCode = getResponeCode(data[pos])
        pos += 1
        /**
         * 如果状态码为0x82则后面跟的属性值固定1一个字节0x00
         */
        if (responeCode == 0x82) {
            attributeValue = -1
            /**
             * 跳过不支持属性后的一个字节
             */
            pos += 1
            continue
        } else {
            /**
             * 获取属性值长度
             */
            attributeLen = data[pos]
            pos += 1
            switch (attributeGroupNum) {
                case 0:
                    /**
                     * 组号0 设备信息
                     */
                    switch (attributeNum) {
                        /**
                         * 产品/程序ID号 32byte
                         */
                        case 0:
                        /**
                         * xxx信息 32byte
                         */
                        case 3:
                        /**
                         * yyy信息 32byte
                         */
                        case 4:
                        /**
                         * zzz信息 32byte
                         */
                        case 5:
                            attributeValue = getAttributeValueByAttrLen(data, pos, attributeLen)
                            pos += attributeLen
                            break
                        /**
                         * 程序版本号 2byte
                         */
                        case 1:
                        /**
                         * 属性集版本 2byte
                         */
                        case 2:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += attributeLen
                            break
                        
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 1:
                    /**
                     * 组号1 空调控制
                     */
                    switch (attributeNum) {
                        /**
                         * 开/关机 1byte
                         */
                        case 0:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            try {
                                if (attributeValue == 1) {
                                    iot.sendMsgToKafka('appliances-notify', sn + '/remind/power', attributeValue + '')
                                }
                            } catch (e) {
                                //TODO handle the exception
                            }
                            break
                        /**
                         * 设定模式 1byte
                         * 0-自动，1-制热，2-制冷，3-除湿，4-送风，其他值无效
                         */
                        case 1:
                        /**
                         * 设定风速（挡位风）1byte
                         * 0-自动，1-微风，2-低风，3-中风，4-高风，5-强力
                         */
                        case 3:
                        /**
                         * 设定风速（无机风）1byte
                         * 0-自动，1-微风，2-低风，3-中风，4-高风，5-强力
                         */
                        case 4:
                        /**
                         * 电机热状态设定 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 5:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 手动睡眠/节能/ECO 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 6:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            status.eco = attributeValue
                            break
                        /**
                         * 设定温度 1byte
                         * 60-16.0℃，61-16.1℃，……，220-32.0℃，其他值无效
                         */
                        case 2:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            attributeValue = (attributeValue / 10 + 10) * 10
                            pos += attributeLen
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 2:
                    /**
                     * 组号2 运行状态
                     */
                    switch (attributeNum) {
                        /**
                         * 实际运行模式 1byte
                         * 0：未知模式 1：制热 2：制冷 3：除湿 4：送风模式 其他值返错误状态码
                         */
                        case 0:
                        /**
                         * 实际运行风速 1byte
                         * 0-自动，1-微风，2-低风，3-中风，4-高风，5-强力
                         */
                        case 1:
                        /**
                         * 化霜状态 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 2:
                        /**
                         * 吹余热状态 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 3:
                        /**
                         * 吹余冷（干燥）状态 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 4:
                        /**
                         * 防冷风状态 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 5:
                        /**
                         * 电辅热实际状态 1byte
                         * 0-投入，1-未投入，其他值无效
                         */
                        case 6:
                        /**
                         * 反转除尘状态 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 7:
                        /**
                         * 化霜剩余时间
                         * 0：化霜状态=0（对应属性 0x0007） 1-x:剩余时间分钟数
                         */
                        case 9:
                        /**
                         * 自清洁剩余时间
                         * 0：自清洁结束（对应属性 0x0002） 1-x：剩余时间分钟数，按阶段上报
                         */
                        case 10:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 睡眠时间 2bytes
                         * 0-65535：开启睡眠的时间，分钟数
                         */
                        case 8:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += attributeLen
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 3:
                    /**
                     * 组号3 出风控制
                     */
                    switch (attributeNum) {
                        /**
                         * 防直吹 1byte
                         * 0：关 1：开 其他值返错误状态码
                         */
                        case 0:
                        /**
                         * 柔风 1byte
                         * 0-关闭，1-上柔风，2-下柔风，3-上下柔风
                         *
                         */
                        case 1:
                        /**
                         * 天幕风 1byte
                         * 0：关 1：开 其他值返错误状态码
                         */
                        case 2:
                        /**
                         * 地毯风 1byte
                         * 0：关闭 1：开启
                         */
                        case 3:
                        /**
                         * 无风感 1byte
                         * 0：关闭 1：开启
                         */
                        case 4:
                        /**
                         * Q7V 柜机特殊功能 1byte
                         * ：0-无效，1-xxx: 特殊状态、位置
                         */
                        case 9:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 同步扫风开关（预留） byte2
                         * byte1：上下风向 V1+上下风向 V2 的同步
                         * byte2：左右风向 H1+左右风向 H2 的同步
                         * 0：关 1：开
                         */
                        case 10:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.syncVerdir = content[0]
                            status.syncHordir = content[1]
                            continue
                        /**
                         * 上下风向 V1 扫风开关 1byte
                         * 0：关闭 1：摆动
                         */
                        case 11:
                            /**
                             * 上下风向 V2 扫风开关 1byte
                             * 0：关闭 1：摆动
                             */
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 上下风向 V1 上下扫风范围 verdirStopPos", "hordirStopPos
                         * Byte1：0-100，设置开始角度位置
                         * Byte2：0-100，设置停止角度位置
                         */
                        case 12:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setStartAngleForVerdir = content[0]
                            status.setStopAngleForVerdir = content[1]
                            continue
                        /**
                         * 上下风向 V1 固定位置
                         * Byte1：0-100，设置角度位置
                         * Byte2：0-100，实际角度位置
                         */
                        case 13:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setAnglePositionForVerdir = content[0]
                            status.actAnglePositionForVerdir = content[1]
                            continue
                        case 14:
                            /**
                             * 左右风向 H1 扫风开关 1byte
                             * 0：关闭 1：摆动
                             */
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 左右风向 V2 固定位置
                         * Byte1：0-100，设置角度位置
                         * Byte2：0-100，实际角度位置
                         */
                        case 16:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setAnglePositionForVerdirV2 = content[0]
                            status.actAnglePositionForVerdirV2 = content[1]
                            continue
                        /**
                         * 左右风向 H1 扫风开关 1byte
                         * 0：关闭 1：摆动
                         */
                        case 17:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 左右风向 H1 扫风范围 verdirStopPos", "hordirStopPos
                         * Byte1：0-100，设置开始角度位置
                         * Byte2：0-100，设置停止角度位置
                         */
                        case 18:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setStartAngleForHordir = content[0]
                            status.setStopAngleForHordir = content[1]
                            continue
                        /**
                         * 左右风向 H1 固定位置
                         * Byte1：0-100，设定角度位置
                         * Byte2：0-100，实际角度位置
                         */
                        case 19:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setPositionForLeftRightWind = content[0]
                            status.actAnglePositionForHordir = content[1]
                            continue
                        /**
                         * 左右风向 H2 扫风开关 1byte
                         * 0：关闭 1：摆动
                         */
                        case 20:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        
                        /**
                         * 左右风向 H2 扫风范围 verdirStopPos", "hordirStopPos
                         * Byte1：0-100，设置开始角度位置
                         * Byte2：0-100，设置停止角度位置
                         */
                        case 22:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setPositionForLeftRightWindH2 = content[0]
                            status.actAnglePositionForHordirH2 = content[1]
                            continue
                        /**
                         * 雷达：风避人吹 1byte
                         * 0：关闭 1：开启
                         */
                        case 23:
                        /**
                         * 雷达：风随人动 1byte
                         * 0：关闭 1：开启
                         */
                        case 24:
                        /**
                         * 雷达：人近风柔 1byte
                         * 0：关闭 1：开启
                         */
                        case 25:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 雷达：传感器信息 10byte
                         * Byte0：目标检测个数
                         * Byte1-3：目标1角度、速度、距离
                         * Byte4-6：目标2角度、速度、距离
                         * Byte7-9：目标3角度、速度、距离
                         */
                        case 26:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.radarTargetCount = content[0]
                            status.radarTarget1Angle = content[1]
                            status.radarTarget1Speed = content[2]
                            status.radarTarget1Distance = content[3]
                            status.radarTarget2Angle = content[4]
                            status.radarTarget2Speed = content[5]
                            status.radarTarget2Distance = content[6]
                            status.radarTarget3Angle = content[7]
                            status.radarTarget3Speed = content[8]
                            status.radarTarget3Distance = content[9]
                            continue
                        /**
                         * 上下风向V3
                         * 0：关闭 1：开启
                         */
                        case 28:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 上下风向 V3 固定位置
                         * Byte1：0-100，设置角度位置
                         * Byte2：0-100，实际角度位置
                         */
                        case 30:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setAnglePositionForVerdirV3 = content[0]
                            status.actAnglePositionForVerdirV3 = content[1]
                            continue
                        /**
                         * 上下风向V4
                         * 0：关闭 1：开启
                         */
                        case 31:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 上下风向 V4 固定位置
                         * Byte1：0-100，设置角度位置
                         * Byte2：0-100，实际角度位置
                         */
                        case 33:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.setAnglePositionForVerdirV4 = content[0]
                            status.actAnglePositionForVerdirV4 = content[1]
                            continue
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 4:
                    /**
                     * 组号4 增强功能
                     */
                    switch (attributeNum) {
                        /**
                         * 反转除尘
                         * 0-关，1-开
                         */
                        case 1:
                        /**
                         * 亮度调节
                         * 0：熄灭 1-8：8 级亮度 255：自动
                         */
                        case 2:
                        /**
                         * 蜂鸣器
                         * 0-关，1-开
                         */
                        case 3:
                        /**
                         * 空气清新
                         * 0-关，1-开
                         */
                        case 4:
                        /**
                         * UVC紫外杀菌
                         * 0-关，1-开
                         */
                        case 5:
                        /**
                         * 用户体感反馈
                         *    0：舒适
                         1：稍凉
                         2：有一点冷
                         3：非常冷
                         11：稍暖
                         12：有一点热
                         13：非常热
                         */
                        case 6:
                        /**
                         *  0: 语音识别关闭(由 MCU 通过遥控器设定关闭并上报 WiFi，同时记忆状态)
                         1: 语音识别开启《默认开启，记忆状态)
                         2: 语音识别中(语音模块在语音识别的过程中发 2，识别结束发 1，用于语音灯显示)
                         其他值返回错误状态码，
                         */
                        case 7:
                        /**
                         * 语音播报/喇叭音量 1byte
                         */
                        case 8:
                        /**
                         * 湿度控制（温湿双控）1byte
                         */
                        case 9:
                        /**
                         * 设定湿度
                         */
                        case 10:
                        /**
                         * 除湿功能自动投入使能
                         * 0-禁止，1-允许
                         */
                        case 11:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 灯带显示
                         * Byte1:灯带1设定，0-关闭，1打开
                         * Byte2:灯带2设定，0-关闭，1打开
                         * Byte3:灯带3设定，0-关闭，1打开
                         * Byte4:(灯带4预留)，0-关闭，1打开
                         */
                        case 14:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.lightV1 = content[0]
                            status.lightV2 = content[1]
                            status.lightV3 = content[2]
                            status.light = status.lightV1 == 1 && status.lightV2 == 1 && status.lightV3 == 1 ? 1 : 0
                            continue
                        /**
                         * 三阶风
                         * 设定状态 + 实际状态
                         * Byte1：设定状态，0-关闭/结束，1-打开/进行中：
                         * Byte2：实际运行的阶段，取值 0-4，根据阶段定义确定
                         * [0x00][0x03] 3 - 结束或关闭
                         * [0x01][0x00] 0 - 开始上报
                         * [0x01][0x02] 2 - 三阶风开，阶段2
                         */
                        case 0:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.thirdOrderWind = content[0]
                            status.thirdOrderWindStep = content[1]
                            continue
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 5:
                    /**
                     * 组号5 维护管理
                     */
                    switch (attributeNum) {
                        /**
                         * 自清洁判断
                         * selfClean:
                         * 设定状态 + 实际状态
                         *  Byte1：设定状态，0-关闭/结束，1-打开/进行中
                         *  Byte2：实际运行的阶段，取值 0-4，根据阶段定义确定
                         */
                        case 0:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.selfclean = content[0]
                            status.selfcleanStep = content[1]
                            continue
                        /**
                         * 干燥防霉设定（吹余冷）
                         * 0-关，1-开，其他值无效
                         */
                        case 1:
                        /**
                         * 关机除霜设定
                         * 0-关，1-开，其他值无效
                         */
                        case 2:
                        /**
                         * 时间睡眠 1byte
                         * 0-关，1-开，其他值无效
                         */
                        case 7:
                        /**
                         * 时间段：屏显功能
                         * 显示亮度调节
                         */
                        case 12:
                        /**
                         * 反转除尘：
                         * 0-关，1-开，其他值无效
                         */
                        case 13:
                        /**
                         * 摆叶易拆洗
                         * 0-关，1-开，其他值无效
                         */
                        case 14:
                        /**
                         * 时间段：语音播报
                         * 0-关，1-开，其他值无效
                         */
                        case 16:
                        /**
                         * 时间段：蜂鸣器
                         * 0-关，1-开，其他值无效
                         */
                        case 17:
                        /**
                         * 时间段：时间段进入使能标志位
                         * 0-未进入夜晚勿扰时间段区间，1-已进入夜晚勿扰时间段区间
                         */
                        case 18:
                        /**
                         * 时间段：雷达功能是否生效
                         * 0-关，1-开，其他值无效
                         */
                        case 19:
                        /**
                         * 电网限功率运行
                         * 0-关，1-开，其他值无效
                         */
                        case 15:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 空调滤网脏堵状态
                         * 0：清洁 1：中等脏堵 2：严重脏堵
                         */
                        case 10:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            try {
                                if (attributeValue == 2) {
                                    //iot.sendMsgToKafka('appliances-notify', sn + '/remind/filter', attributeValue + '')
                                }
                            } catch (e) {
                                //TODO handle the exception
                            }
                            break
                        /**
                         * 定时开分钟 4byte
                         */
                        case 3:
                            content = data.slice(pos, pos + 2)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += 2
                            status.setMinutesForPowerOn = attributeValue
                            
                            content = data.slice(pos, pos + 2)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += 2
                            status.remainMinutesForPowerOn = attributeValue
                            continue
                        /**
                         * 定时关分钟 4byte
                         */
                        case 4:
                            content = data.slice(pos, pos + 2)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += 2
                            status.setMinutesForPowerOff = attributeValue
                            
                            content = data.slice(pos, pos + 2)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += 2
                            status.remainMinutesForPowerOff = attributeValue
                            continue
                        /**
                         * 时间段设置
                         */
                        case 5:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            // if (content[0] != 0) {
                            attributeValue =
                                addPrefix(content[1]) +
                                ':' +
                                addPrefix(content[2]) +
                                '--' +
                                addPrefix(content[3]) +
                                ':' +
                                addPrefix(content[4])
                            status.timePeriod = attributeValue
                            // }
                            
                            status.timePeriodMode = content[0]
                            continue
                        /**
                         * 延时熄屏时间
                         */
                        case 6:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += attributeLen
                            break
                        /**
                         * 电量信息
                         */
                        case 8:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueFourByte(content)
                            attributeValue /= 10
                            pos += attributeLen
                            try {
                                iot.sendMsgToKafka(
                                    'acdevice-count',
                                    sn + '/remind/' + attributeDefine[attributeGroupNum][attributeNum],
                                    attributeValue + ''
                                )
                            } catch (e) {
                                //TODO handle the exception
                            }
                            break
                        /**
                         * 累计运行时长
                         */
                        case 9:
                        /**
                         * totalWorkTime
                         */
                        case 11:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueFourByte(content)
                            pos += attributeLen
                            try {
                                iot.sendMsgToKafka(
                                    'acdevice-count',
                                    sn + '/remind/' + attributeDefine[attributeGroupNum][attributeNum],
                                    attributeValue + ''
                                )
                            } catch (e) {
                                //TODO handle the exception
                            }
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 6:
                    /**
                     * 组号6 环境参数
                     */
                    switch (attributeNum) {
                        /**
                         * 室内温度 2byte
                         * 实际温度 x10+500
                         */
                        case 0:
                        /**
                         * 室外温度 2byte
                         * 实际温度 x10+500
                         */
                        case 2:
                        /**
                         * 外置蓝牙温度 2byte
                         * 实际温度 x10+500
                         */
                        case 10:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = (attributeValue - 500) / 10
                            pos += attributeLen
                            break
                        /**
                         * 室内湿度 2byte
                         * 实际湿度 x10
                         */
                        case 1:
                        /**
                         * 室外湿度 2byte
                         * 实际湿度 x10
                         */
                        case 3:
                        /**
                         * 外置蓝牙湿度 2byte
                         * 实际湿度 x10
                         */
                        case 11:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = attributeValue / 10
                            pos += attributeLen
                            break
                        /**
                         * 光线传感器采样值
                         */
                        case 4:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 7:
                    /**
                     * 组号7 高级配置
                     */
                    switch (attributeNum) {
                        /**
                         * 显示内容设置
                         * 0-显示设定，1-显示室温
                         */
                        case 0:
                        /**
                         * 使用角色
                         * 0-正常模式，1-老人模式，2-小孩模式
                         */
                        case 1:
                        /**
                         * 使用场地
                         * 0：未定义（默认公用场所） 1：公用场所 2：家用用户 3：其他
                         */
                        case 2:
                        /**
                         * 相对人的吹风位置
                         * 0：未定义 1：人体正前 2：人体正后 3：人体正左
                         * 4：人体正右 5：人体右前 6：人体左前 7：人体右后 8：人体左后
                         */
                        case 3:
                        /**
                         * 控制指令来源
                         * 255：尚未定义的控制方式 0：非控制类指令，可忽略 1：遥控器 2：机身按键 3：智汇家 APP
                         * 4：数字遥控器（小程序-蓝牙） 5：语音（离线语音模块） 6：语音（在线语音模块）
                         * 7：语音（在线，其他成套设备控制） 8：语音（在线，第三方语音终端） 9：云端场景控制
                         * 10：随意贴贴（NFC） 11：手势控制 12：数字遥控器（小程序-远程）
                         */
                        case 5:
                        /**
                         * 工程集控-锁定操作
                         * 0: 正常模式
                         * 1: 集控解锁模式
                         * 2: 集控锁定模式
                         */
                        case 6:
                        /**
                         * 工程集控-禁用电加热
                         * 0: 允许使用，电加热按正常逻辑控制
                         * 1: 禁用电加热，用户设置开启后，实际不投入
                         */
                        case 7:
                        /**
                         * 正常模式选择 or工程集控模式
                         */
                        case 9:
                        /**
                         * 工程机CAT1模组状态
                         */
                        case 10:
                        /**
                         * 变匹数设置 0、1、2
                         */
                        case 11:
                        /**
                         * 单冷/冷暖设置
                         * 0-冷暖（默认），1-单冷机
                         */
                        case 12:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 开机参数设置 4byte
                         */
                        case 4:
                            var paramForPowerOn = {}
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            var contentValue = content[0]
                            paramForPowerOn.on = contentValue
                            if (contentValue != 0) {
                                contentValue = content[1]
                                paramForPowerOn.mode = contentValue & 0x0f
                                paramForPowerOn.mark = (contentValue >> 4) & 0x0f
                                contentValue = content[2]
                                paramForPowerOn.settemp = contentValue / 10 + 10
                                contentValue = content[3]
                                paramForPowerOn.hordir = contentValue & 0x0f
                                paramForPowerOn.verdir = (contentValue >> 4) & 0x0f
                            }
                            status.paramForPowerOn = paramForPowerOn
                            continue
                        /**
                         * 工程集控-限制设定温度 2byte
                         * Byte1：设定温度的下限，默认 16.0℃
                         * Byte2：设定温度的上限，默认 32.0℃
                         *
                         */
                        case 8:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.upperLimitForSetTempreture = content[0]
                            status.lowerLimitForSetTempreture = content[1]
                            continue
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 8:
                    /**
                     * 组号8 新风功能
                     */
                    switch (attributeNum) {
                        /**
                         * 新风开关 2byte
                         * Byte1：新风开关 0-关，1-开 Byte2：新风挡位 0-自动，1-低，2-中，3-高
                         */
                        case 0:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            status.freshswitch = content[0]
                            status.freshair = content[1]
                            continue
                        /**
                         * 新风滤芯剩余寿命
                         * 0-100：0%-100%，记忆。 0：耗尽，100：全新状态/重置后
                         */
                        case 1:
                        /**
                         * 重置新风滤芯
                         * 0-255：下发任意值，重置一次
                         */
                        case 2:
                        /**
                         * 新风自动投入使能
                         * 0-禁止，1-允许
                         */
                        case 3:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 9:
                    /**
                     * 诊断数据
                     */
                    switch (attributeNum) {
                        /**
                         * 电源频率 frequency 1byte
                         */
                        case 0:
                        /**
                         * 氟量参考 1byte
                         */
                        case 2:
                        /**
                         * 室内TVOC值 1byte
                         * 取值0-1000，表示室温TVOC值
                         */
                        case 4:
                        /**
                         * 电源频率 frequency 1byte
                         */
                        case 21:
                        /**
                         * PPD 实际值
                         */
                        case 28:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 压缩机绕组温度 实际温度 x10+500 2byte
                         */
                        case 3:
                        /**
                         * 内盘温度 实际温度x10+500 2byte
                         */
                        case 6:
                        /**
                         * 内风机模块温度 实际温度x10+500 2byte
                         */
                        case 8:
                        /**
                         * 外风机模块温度 实际温度x10+500 2byte
                         */
                        case 9:
                        /**
                         * 压机模块温度 实际温度x10+500 2byte
                         */
                        case 10:
                        /**
                         * 外机管温 实际温度x10+500 2byte
                         */
                        case 11:
                        /**
                         * 外机排气 实际温度x10+500 2byte
                         */
                        case 12:
                        /**
                         * 露点温度 实际温度x10+500 2byte
                         */
                        case 22:
                        /**
                         * T-PMV 温度 实际温度x10+500 2byte
                         */
                        case 29:
                        /**
                         * 室外大散热器温度 实际温度 x10+500
                         */
                        case 30:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = (attributeValue - 500) / 10
                            pos += attributeLen
                            break
                        /**
                         * 整机功率值 2byte
                         */
                        case 1:
                        /**
                         * 内风机转速 实际转速：0-2000 转/分钟
                         */
                        case 7:
                        /**
                         * 外风机转速  实际转速：0-2000 转/分钟
                         */
                        case 14:
                        /**
                         * 膨胀阀步数 实际步数：0-520 步
                         */
                        case 15:
                        /**
                         * 外机运行电压 运行电压 VAC
                         */
                        case 17:
                        /**
                         * 外机功率 运行功率 W
                         */
                        case 18:
                        /**
                         * 新风机转速 实际转速：0-2000 转/分钟
                         */
                        case 19:
                        /**
                         * 整机功率值 范围[0，10000],最大 10KW 2bytes
                         */
                        case 20:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += attributeLen
                            break
                        /**
                         * 外机运行频率 实际频率 x10Hz
                         */
                        case 13:
                        /**
                         * 外机运行电流 运行电流 x10A
                         */
                        case 16:
                        /**
                         * 外机运行目标频率 外机回传的目标频率 x10Hz
                         */
                        case 31:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = attributeValue / 10
                            pos += attributeLen
                            break
                        /**
                         * 含湿量 单位：g/kg 干空气 取值：实际含湿量×100
                         */
                        case 23:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = attributeValue / 100
                            pos += attributeLen
                            break
                        /**
                         * PMV 修正值 2bytes
                         */
                        case 26:
                        /**
                         * PMV 实际值 2bytes
                         */
                        case 27:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            attributeValue = (attributeValue - 100) / 10
                            pos += attributeLen
                            break
                        /**
                         * 空气焓值（入口）
                         */
                        case 24:
                        /**
                         * 空气焓值（出口）
                         */
                        case 25:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 10:
                    /**
                     * 组号10 调试功能
                     */
                    switch (attributeNum) {
                        /**
                         * 机型设置 1byte
                         */
                        case 0:
                        /**
                         * 强制运行 1byte
                         */
                        case 1:
                        /**
                         * 快速运行
                         */
                        case 2:
                        /**
                         * 自检程序
                         */
                        case 3:
                        /**
                         * 整机测试模式
                         */
                        case 5:
                        /**
                         * 新风测试模式
                         */
                        case 6:
                        /**
                         * 清除总电量
                         */
                        case 20:
                        /**
                         * 强制标定氟量
                         */
                        case 21:
                        /**
                         * 系统冷媒充注
                         */
                        case 22:
                        /**
                         * 滤网脏堵检测功能
                         */
                        case 23:
                        /**
                         * 来电复位功能
                         */
                        case 24:
                        /**
                         * 绕组测温功能
                         */
                        case 25:
                        /**
                         * 排气传感器脱落检测
                         */
                        case 26:
                        /**
                         * 绕组测温功能
                         */
                        case 27:
                        /**
                         * 冷媒快速泄露检测功能
                         */
                        case 28:
                        /**
                         * 外风机电机型号识别功能
                         */
                        case 29:
                        /**
                         * 屏蔽滤网功率补偿控制
                         */
                        case 30:
                        /**
                         * 初始化滤网功率基准值
                         */
                        case 31:
                        /**
                         * 电压不平衡及电源频率保护
                         */
                        case 32:
                        /**
                         * ECO超级节能模式
                         */
                        case 33:
                        /**
                         * 故障屏蔽功能
                         */
                        case 34:
                        /**
                         * 强制化霜功能
                         */
                        case 35:
                        /**
                         * 氟量管理
                         */
                        case 36:
                        /**
                         * 解锁外机锁死故障
                         */
                        case 37:
                        /**
                         * 氟量管理是否可执行
                         * 0-可设置运行，1-当前环境条件不可设定运行
                         */
                        case 38:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * 设置新风机转速 2byte
                         */
                        case 7:
                        /**
                         * 设置内分机转速 2bytes
                         */
                        case 8:
                        /**
                         * 设置外风机转速 2bytes
                         */
                        case 9:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += attributeLen
                            break
                        /**
                         * 设置压缩机目标频率
                         */
                        case 10:
                        /**
                         * 设置传感器室-室内湿度
                         */
                        case 11:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = attributeValue / 10
                            pos += attributeLen
                            break
                        /**
                         * 设置传感器室-含湿量 2bytes 实际含湿量x100
                         */
                        case 12:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = attributeValue / 100
                            pos += attributeLen
                            break
                        /**
                         * 设置传感器室-室温 2bytes 设定温度x10 + 500
                         */
                        case 13:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = (attributeValue - 500) / 10
                            pos += attributeLen
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 11:
                    switch (attributeNum) {
                        /**
                         * AI模式开关
                         */
                        case 0:
                        /**
                         * AI运行使能
                         */
                        case 1:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            break
                        /**
                         * AI运行目标频率
                         */
                        case 2:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            attributeValue = attributeValue / 10
                            pos += attributeLen
                            break
                        default:
                            content = data.slice(pos, pos + attributeLen)
                            pos += attributeLen
                            continue
                    }
                    break
                case 0xff:
                    switch (attributeNum) {
                        /**
                         * 协议版本
                         */
                        case 0xd0:
                            attributeValue = getAttributeValueOneByteFromDec(data[pos])
                            pos += attributeLen
                            status.ecuVersion = attributeValue
                            continue
                        /**
                         * 大数据
                         */
                        case 0xd1:
                            attributeValue = getAttributeValueByLen(data, pos, attributeLen)
                            pos += attributeLen
                            if (status.big) {
                                status.big = status.big + attributeValue
                            } else {
                                status.big = attributeValue
                            }
                            continue
                        /**
                         * 时间戳
                         */
                        case 0xd2:
                            content = data.slice(pos, pos + attributeLen)
                            if (attributeLen == 4) {
                                attributeValue = getAttributeValueFourByte(content)
                            } else {
                                attributeValue = getTimeStampEightBytes(content)
                            }
                            
                            pos += attributeLen
                            status.timeStamp = attributeValue
                            continue
                        /**
                         * 限制信息
                         */
                        case 0xd3:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            status.LimitReport = attributeValue
                            continue
                        /**
                         * wifi强度
                         */
                        case 0xd4:
                            attributeValue = getAttributeValueOneByte(data[pos])
                            pos += attributeLen
                            status.wifiStrength = attributeValue - 256
                            continue
                        /**
                         * wifi版本信息
                         */
                        case 0xd5:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += attributeLen
                            status.wifiVersion = (attributeValue / 100).toString()
                            continue
                        /**
                         * 电控版本信息
                         */
                        case 0xd6:
                            content = data.slice(pos, pos + attributeLen)
                            attributeValue = getAttributeValueTwoByte(content)
                            pos += attributeLen
                            status.ecuHardwareVersion = attributeValue
                            continue
                        default:
                            continue
                    }
                    continue
                default:
                    content = data.slice(pos, pos + attributeLen)
                    pos += attributeLen
                    continue
            }
            
            status[attributeDefine[attributeGroupNum][attributeNum]] = attributeValue
        }
    }
    var content = new Object()
    var hasStatistical = false
    var elecInfo = status.electricityInfo || ''
    if (elecInfo) {
        content.electricityInfo = status.electricityInfo
        hasStatistical = true
    }
    elecInfo = status.totalWorkTime || ''
    if (elecInfo) {
        content.totalWorkTime = status.totalWorkTime
        hasStatistical = true
    }
    elecInfo = status.totalECOTime || ''
    if (elecInfo) {
        content.totalECOTime = status.totalECOTime
        hasStatistical = true
    }
    
    if (hasStatistical) {
        try {
            iot.sendMsgToKafka('acdevice-count', sn + '/remind/statisticalInfo', JSON.stringify(content))
        } catch (e) {
            //TODO handle the exception
        }
    }
    
    return status
}

function buildCommands(json) {
    var arr = new Array()
    var cmdLength = 0
    
    /**
     * 帧头
     */
    arr[cmdLength] = 0x55
    cmdLength += 1
    arr[cmdLength] = 0xaa
    cmdLength += 1
    
    /**
     * 帧长度
     */
    arr[cmdLength] = cmdLength
    cmdLength += 1
    
    /**
     * 命令号
     */
    arr[cmdLength] = 0x18
    cmdLength += 1
    
    /**
     * 属性及属性值遍历设置
     */
    for (var item in json) {
        var data = json[item]
        var cmd
        var command
        
        if (item == undefined || data == undefined) continue
        command = commandTypeSet[item]
        if (command == undefined) continue
        /**
         * 属性名
         */
        arr[cmdLength] = (command >> 0) & 0xff
        cmdLength += 1
        arr[cmdLength] = (command >> 8) & 0xff
        cmdLength += 1
        
        /**
         * 属性值
         */
        /**
         * 设定温度
         */
        if (command == 0x0102) {
            arr[cmdLength] = 1
            cmdLength += 1
            var value = Number(data)
            if (value < 100) {
                arr[cmdLength] = Number(data) * 10 - 100
            } else {
                arr[cmdLength] = Number(data) - 100
            }
            cmdLength += 1
        } else if (command == 0x0800) {
            /**
             * 新风功能，新风开关
             */
            arr[cmdLength] = 2
            cmdLength += 1
            if (item == 'freshswitch') {
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = 0x00
                cmdLength += 1
            } else if (item == 'freshair') {
                /**
                 * 新风功能，新风档位
                 */
                arr[cmdLength] = 0x01
                cmdLength += 1
                arr[cmdLength] = Number(data)
                cmdLength += 1
            }
        } else if (command == 0x0503) {
            /**
             * 定时开分钟 4Byte
             */
            arr[cmdLength] = 4
            cmdLength += 1
            var value = Number(data)
            arr[cmdLength] = (value >> 0) & 0xff
            cmdLength += 1
            arr[cmdLength] = (value >> 8) & 0xff
            cmdLength += 1
            arr[cmdLength] = 0
            cmdLength += 1
            arr[cmdLength] = 0
            cmdLength += 1
        } else if (command == 0x0504) {
            /**
             * 定时关分钟 4Byte
             */
            arr[cmdLength] = 4
            cmdLength += 1
            var value = Number(data)
            arr[cmdLength] = (value >> 0) & 0xff
            cmdLength += 1
            arr[cmdLength] = (value >> 8) & 0xff
            cmdLength += 1
            arr[cmdLength] = 0
            cmdLength += 1
            arr[cmdLength] = 0
            cmdLength += 1
        } else if (command == 0x0506) {
            /**
             * 延时熄屏时间
             */
            arr[cmdLength] = 2
            cmdLength += 1
            var value = 0
            if (data.toLowerCase() == 'ffff' || data.toLowerCase() == '0xffff') {
                value = 65535
            } else {
                value = Number(data)
            }
            arr[cmdLength] = (value >> 0) & 0xff
            cmdLength += 1
            arr[cmdLength] = (value >> 8) & 0xff
            cmdLength += 1
        } else if (command == 0x0505) {
            /**
             * 时间段设置
             * '001527070B00000000'
             */
            arr[cmdLength] = 9
            cmdLength += 1
            var value
            for (var i = 0; i < 18; i = i + 2) {
                value = parseInt(data.substring(i, i + 2), 16)
                arr[cmdLength] = value
                cmdLength += 1
            }
        } else if (command == 0x0307) {
            /**
             * 上下风向位置
             */
            arr[cmdLength] = 2
            cmdLength += 1
            arr[cmdLength] = Number(data)
            cmdLength += 1
            arr[cmdLength] = 0x00
            cmdLength += 1
        } else if (command == 0x0308) {
            /**
             * 左右风向位置
             */
            arr[cmdLength] = 2
            cmdLength += 1
            arr[cmdLength] = Number(data)
            cmdLength += 1
            arr[cmdLength] = 0x00
            cmdLength += 1
        } else if (command == 0x030a) {
            arr[cmdLength] = 2
            cmdLength += 1
            if (item == 'syncHordir') {
                arr[cmdLength] = 0xff
                cmdLength += 1
                arr[cmdLength] = Number(data)
                cmdLength += 1
            } else if (item == 'syncVerdir') {
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = 0xff
                cmdLength += 1
            }
        } else if (command == 0x0313) {
            /**
             * 左右风向 H1固定位置 组号3属性号19
             */
            arr[cmdLength] = 2
            cmdLength += 1
            arr[cmdLength] = Number(data)
            cmdLength += 1
            arr[cmdLength] = 0x00
            cmdLength += 1
        } else if (command == 0x0316) {
            /**
             * 左右风向 H2固定位置 组号3属性号22
             */
            arr[cmdLength] = 2
            cmdLength += 1
            arr[cmdLength] = Number(data)
            cmdLength += 1
            arr[cmdLength] = 0x00
            cmdLength += 1
        } else if (command == 0x040e) {
            /**
             * 灯带显示 属性号14
             */
            arr[cmdLength] = 4
            cmdLength += 1
            //仅开上灯光
            if (item == 'lightV1') {
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = 0x00
                cmdLength += 1
                arr[cmdLength] = 0x00
                cmdLength += 1
            }
            //仅开下灯光
            else if (item == 'lightV3') {
                arr[cmdLength] = 0x00
                cmdLength += 1
                arr[cmdLength] = 0x00
                cmdLength += 1
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = 0x00
                cmdLength += 1
            }
            //上下灯光全开
            else if (item == 'light') {
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = Number(data)
                cmdLength += 1
                arr[cmdLength] = 0x00
                cmdLength += 1
            }
        } else if (command == 0x0704) {
            /**
             * 开机参数设置
             * 参数格式“01225A01”
             */
            arr[cmdLength] = 4
            cmdLength += 1
            var value
            for (var i = 0; i < 8; i = i + 2) {
                value = parseInt(data.substring(i, i + 2), 16)
                arr[cmdLength] = value
                cmdLength += 1
            }
        } else if (command == 0x0500) {
            /**
             * 自清洁模式
             */
            arr[cmdLength] = 2
            cmdLength += 1
            arr[cmdLength] = Number(data)
            cmdLength += 1
            arr[cmdLength] = 0
            cmdLength += 1
        } else if (command == 0x0b02) {
            /**
             * AI模式设备目标频率
             */
            arr[cmdLength] = 2
            cmdLength += 1
            var value = Number(data)
            // 按照协议要求乘以10
            value = value * 10
            arr[cmdLength] = (value >> 0) & 0xff
            cmdLength += 1
            arr[cmdLength] = (value >> 8) & 0xff
            cmdLength += 1
        } else {
            /**
             * 如果是送风模式
             * data+1
             */
            arr[cmdLength] = 1
            cmdLength += 1
            arr[cmdLength] = Number(data)
            cmdLength += 1
        }
    }
    
    /**
     * 设置帧长度
     */
    arr[2] = cmdLength + 2
    /**
     * 校验和2字节
     */
    var sun = getCheckSun(arr)
    
    arr[cmdLength] = (sun >> 0) & 0xff
    cmdLength += 1
    arr[cmdLength] = (sun >> 8) & 0xff
    
    return ByteToHexStr(arr)
}

function buildCommandInt(command, cmdCode, data) {
    var arr = new Array()
    var cmdLength = 0
    /**
     * 帧头
     */
    arr[0] = 0x55
    arr[1] = 0xaa
    cmdLength += 2
    /**
     * 帧长度
     */
    arr[2] = 0x09
    cmdLength += 1
    /**
     * 命令号
     */
    arr[3] = cmdCode
    cmdLength += 1
    /**
     * 属性名
     */
    arr[4] = (command >> 0) & 0xff
    arr[5] = (command >> 8) & 0xff
    /**
     * 属性值
     */
    if (command == 0x000c) {
        var value = Number(data)
        if (value < 100) {
            arr[6] = Number(data) * 10 - 100
        } else {
            arr[6] = Number(data) - 100
        }
    } else {
        /**
         * 如果是送风模式
         * data+1
         */
        if (command == 0x000b && Number(data) == 4) {
            arr[6] = Number(data) + 1
        } else {
            arr[6] = Number(data)
        }
    }
    
    /**
     * 校验和2字节
     */
    var sun = getCheckSun(arr)
    
    arr[7] = (sun >> 0) & 0xff
    arr[8] = (sun >> 8) & 0xff
    
    return ByteToHexStr(arr)
}

function pri2chs(bizcode) {
    var sn
    var arr
    if (typeof bizcode == 'string') {
        try {
            bizcode = JSON.parse(bizcode)
        } catch (error) {}
        sn = bizcode.sn
        if (sn) {
            sn = bizcode.sn
            bizcode = bizcode.msg
        }
    }
    
    var out = ''
    var arr = HexStrToByte(bizcode)
    
    var ret = checkHead(arr)
    if (ret == false) return out
    var length
    var position = 2
    if ((arr[position] >> 7) & (0x01 == 1)) {
        /**
         * 长度位两个字节
         */
        length = arr[position + 1] * 256 + arr[position]
        position += 2
    } else {
        /**
         * 长度位一个字节
         */
        length = arr[position]
        position += 1
    }
    
    var cmdNum = arr[position]
    position += 1
    var str
    switch (cmdNum) {
        /**
         * WIFI信息；
         */
        case 21:
            str = parseWiFiMessage(arr, position)
            break
        /**
         * 23 全状态设备属性上报
         * 24 属性设置结果上报
         */
        case 23:
            str = ParserMessage(sn, arr, position)
            break
        /**
         * 故障信息上报
         */
        case 25:
        case 27:
            str = parseFaultMessage(arr)
            var len = str.faultsCode.length
            var faults = str.faults
            if (len) {
                iot.sendMsgToKafka('appliances-fault', sn + '/fault/CH_KT0010_KT', JSON.stringify(faults))
            }
            // break;
            return JSON.stringify(chupdate)
        case 26:
            str = parseProtectMessage(arr)
            var len = str.protectsCodes.length
            var protects = str.protects
            if (len) {
                iot.sendMsgToKafka('appliances-fault', sn + '/fault/CH_KT0010_KT', JSON.stringify(protects))
            }
            return JSON.stringify(chupdate)
        // break;
        case 30:
            str = parseHardWareMessage(arr, position)
            break
        case 32:
            str = parseDeviceSn(arr, position)
            break
        /**
         *  机器型号
         */
        case 33:
            str = parseModelMessage(arr, position)
            break
    }
    chupdate.state.reported = str
    chupdate.timestamp = new Date().getTime()
    var personalized = new Object()
    personalized['isride10'] = '1'
    chupdate['personalized'] = personalized
    return JSON.stringify(chupdate)
}

/**
 * {
 "method": "control",
 "payload": {
 "power": "1"
 
 },
 "version": 1,
 "timestamp": 1589186670809
 }
 ---------------------------
 { "power": "1"}
 */
function chs2biz(json) {
    if (typeof json == 'string') {
        json = JSON.parse(json)
    }
    
    return buildCommands(json)
}

/**
 通用格式的数据转换成设备能够认识的数据；
 cmd：json类型，格式如：'{ "Status":0 }'
 
 {
 "method": "control",
 "payload": {
 "power": "1",
 "makrk": "2"
 
 },
 "version": 1,
 "timestamp": 1589186670809
 }
 ---------------------------
 { "power": "1"}
 */
function commonToProtocol(cid, sn, cmd) {
    if (typeof cmd == 'string') {
        cmd = JSON.parse(cmd)
    }
    
    var method = cmd.method || ''
    if (method == 'control') {
        var cmdPayload = cmd.payload
        var key = cmdPayload.LimitReport
        if (key >= 0) {
            return JSON.stringify(cmd)
        }
        var model = []
        var data = {}
        data.data = chs2biz(cmdPayload)
        data.delay = 0
        model.push(data)
        
        return JSON.stringify(model)
    } else if (method == 'command') {
        var model = []
        
        var cmdPayload = cmd.payload
        var data = {}
        data.data = chs2biz(cmdPayload)
        data.delay = 0
        model.push(data)
        
        var delayPayload = cmd.delay || ''
        if (delayPayload) {
            var length = delayPayload.length
            for (var i = 0; i < length; i++) {
                var item = delayPayload[i]
                var itemData = {}
                itemData.data = chs2biz(item.payload)
                itemData.delay = item.delayTime * 1000
                
                model.push(itemData)
            }
        }
        
        return JSON.stringify(model)
    } else {
        return chs2biz(cmd)
    }
}

/**
 设备状态转换成通用格式的数据；
 
 */
function protocolToCommon(bizcode, ts) {
    return pri2chs(bizcode)
}

function getCurrentTime() {
    var currentTime = new Date().getTime()
    
    return currentTime
}

function addPrefix(num) {
    return num < 10 ? '0' + num : num.toString()
}