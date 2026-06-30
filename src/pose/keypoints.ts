// BlazePose (MediaPipe Pose) 的 33 个关键点索引。
// 坐标归一化到 [0,1]：x 向右增大，y 向下增大。
export enum KP {
  Nose = 0,
  LeftEyeInner = 1,
  LeftEye = 2,
  LeftEyeOuter = 3,
  RightEyeInner = 4,
  RightEye = 5,
  RightEyeOuter = 6,
  LeftEar = 7,
  RightEar = 8,
  MouthLeft = 9,
  MouthRight = 10,
  LeftShoulder = 11,
  RightShoulder = 12,
  LeftElbow = 13,
  RightElbow = 14,
  LeftWrist = 15,
  RightWrist = 16,
  LeftPinky = 17,
  RightPinky = 18,
  LeftIndex = 19,
  RightIndex = 20,
  LeftThumb = 21,
  RightThumb = 22,
  LeftHip = 23,
  RightHip = 24,
  LeftKnee = 25,
  RightKnee = 26,
  LeftAnkle = 27,
  RightAnkle = 28,
  LeftHeel = 29,
  RightHeel = 30,
  LeftFootIndex = 31,
  RightFootIndex = 32,
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

// 一副姿态 = 33 个关键点
export type Pose = Landmark[];

/**
 * 一帧推理结果：
 * - landmarks：归一化图像坐标 [0,1]，用于在视频上叠加骨架。
 * - world：真实世界 3D 坐标（米，髋中点为原点），用于计算透视无关的关节角度。
 */
export interface PoseFrame {
  landmarks: Pose;
  world: Pose;
}

// 用于绘制骨架的连线（成对索引）
export const SKELETON_EDGES: [KP, KP][] = [
  [KP.LeftShoulder, KP.RightShoulder],
  [KP.LeftShoulder, KP.LeftElbow],
  [KP.LeftElbow, KP.LeftWrist],
  [KP.RightShoulder, KP.RightElbow],
  [KP.RightElbow, KP.RightWrist],
  [KP.LeftShoulder, KP.LeftHip],
  [KP.RightShoulder, KP.RightHip],
  [KP.LeftHip, KP.RightHip],
  [KP.LeftHip, KP.LeftKnee],
  [KP.LeftKnee, KP.LeftAnkle],
  [KP.RightHip, KP.RightKnee],
  [KP.RightKnee, KP.RightAnkle],
];

// 画关节点用的索引（躯干与四肢主要关节）
export const JOINT_POINTS: KP[] = [
  KP.LeftShoulder,
  KP.RightShoulder,
  KP.LeftElbow,
  KP.RightElbow,
  KP.LeftWrist,
  KP.RightWrist,
  KP.LeftHip,
  KP.RightHip,
  KP.LeftKnee,
  KP.RightKnee,
  KP.LeftAnkle,
  KP.RightAnkle,
];
