/** COCO 17 关节点顺序 */
export const COCO_ORDER = [
  "Nose",
  "Left_Eye",
  "Right_Eye",
  "Left_Ear",
  "Right_Ear",
  "Left_Shoulder",
  "Right_Shoulder",
  "Left_Elbow",
  "Right_Elbow",
  "Left_Wrist",
  "Right_Wrist",
  "Left_Hip",
  "Right_Hip",
  "Left_Knee",
  "Right_Knee",
  "Left_Ankle",
  "Right_Ankle",
]

export const COCO_SKELETON_EDGES = [
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  [5, 11],
  [6, 12],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
]

export const COCO_EDGE_PART = [
  "chest",
  "arms",
  "arms",
  "arms",
  "arms",
  "chest",
  "chest",
  "chest",
  "legs",
  "legs",
  "legs",
  "legs",
]

export const STICKMAN_PART_COLORS = {
  head: [0.93, 0.36, 0.6],
  chest: [0.55, 0.36, 0.96],
  arms: [0.72, 0.53, 0.04],
  legs: [0.98, 0.45, 0.09],
}

export const JOINT_PART = {
  5: "chest",
  6: "chest",
  7: "arms",
  8: "arms",
  9: "arms",
  10: "arms",
  11: "chest",
  12: "chest",
  13: "legs",
  14: "legs",
  15: "legs",
  16: "legs",
}
