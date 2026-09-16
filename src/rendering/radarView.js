// 初始相机位于 (6, 5, 6)，水平角为 45°；主场景再沿轨道旋转 45°。
// 人物渲染和风向分区共用视角，避免屏幕左右与场景坐标左右不一致。
export const RADAR_VIEW_ROTATION_DEG = 45
export const RADAR_VIEW_AZIMUTH_DEG = 45 + RADAR_VIEW_ROTATION_DEG
