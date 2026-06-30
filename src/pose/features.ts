import { Pose, KP, Landmark } from "./keypoints";
import { angle, distance, midpoint, torsoInclination, clamp } from "./geometry";
import { PoseFeatures } from "./types";

function avgVisibility(p: Pose): number {
  if (!p.length) return 0;
  let s = 0;
  for (const l of p) s += l.visibility ?? 1;
  return s / p.length;
}

/**
 * 膝内扣 (knee valgus)：膝盖相对“髋→踝连线”朝身体中线方向的水平偏移，按腿长归一化。
 * 0=对齐，越大越内扣。用 3D world 坐标，透视无关。
 */
function valgus(hip: Landmark, knee: Landmark, ankle: Landmark): number {
  const dy = ankle.y - hip.y;
  if (Math.abs(dy) < 1e-3) return 0;
  const t = (knee.y - hip.y) / dy;
  const expectedX = hip.x + (ankle.x - hip.x) * t; // 膝若在髋-踝连线上时的 x
  const towardMidline = -Math.sign(hip.x || 1e-6); // 中线在 x=0，髋在哪侧则反向为“朝内”
  const offset = (knee.x - expectedX) * towardMidline; // >0 表示朝中线（内扣）
  return clamp(offset / 0.15, 0, 1); // 0.15m 偏移视为严重内扣（经验值，可调）
}

/** 单只脚在水平面 (x,z) 的朝向角：0=正前（朝相机），正=朝右，负=朝左。 */
function footAngle(heel: Landmark, toe: Landmark): number {
  const dx = toe.x - heel.x;
  const dz = (toe.z ?? 0) - (heel.z ?? 0);
  return (Math.atan2(dx, -dz) * 180) / Math.PI;
}

/** 把一副 33 关键点姿态（3D world 坐标）转换为动作判定用的特征向量。 */
export function extractFeatures(p: Pose): PoseFeatures {
  const kneeAngleL = angle(p[KP.LeftHip], p[KP.LeftKnee], p[KP.LeftAnkle]);
  const kneeAngleR = angle(p[KP.RightHip], p[KP.RightKnee], p[KP.RightAnkle]);
  const elbowL = angle(p[KP.LeftShoulder], p[KP.LeftElbow], p[KP.LeftWrist]);
  const elbowR = angle(p[KP.RightShoulder], p[KP.RightElbow], p[KP.RightWrist]);
  const hipL = angle(p[KP.LeftShoulder], p[KP.LeftHip], p[KP.LeftKnee]);
  const hipR = angle(p[KP.RightShoulder], p[KP.RightHip], p[KP.RightKnee]);
  const straightL = angle(p[KP.LeftShoulder], p[KP.LeftHip], p[KP.LeftAnkle]);
  const straightR = angle(p[KP.RightShoulder], p[KP.RightHip], p[KP.RightAnkle]);

  const shoulderWidth = Math.max(distance(p[KP.LeftShoulder], p[KP.RightShoulder]), 1e-4);
  const ankleSpread = distance(p[KP.LeftAnkle], p[KP.RightAnkle]) / shoulderWidth;

  const shY = midpoint(p[KP.LeftShoulder], p[KP.RightShoulder]).y;
  const hipMid = midpoint(p[KP.LeftHip], p[KP.RightHip]);
  const trunk = Math.max(Math.abs(hipMid.y - shY), 1e-4);
  const wristY = Math.min(p[KP.LeftWrist].y, p[KP.RightWrist].y);
  const wristsAboveShoulders = Math.max(0, Math.min(1, (shY - wristY) / trunk));

  // 膝内扣（取双膝较严重者）
  const kneeValgus = Math.max(
    valgus(p[KP.LeftHip], p[KP.LeftKnee], p[KP.LeftAnkle]),
    valgus(p[KP.RightHip], p[KP.RightKnee], p[KP.RightAnkle])
  );

  // 深蹲深度：髋中点 y 相对膝 y（world，y 向下为正）。>0 = 髋低于膝（破平行）。
  const kneeY = (p[KP.LeftKnee].y + p[KP.RightKnee].y) / 2;
  const hipBelowKnee = hipMid.y - kneeY;

  // 脚尖朝向（外八 / 内八）。仅在脚部关键点可见时有意义。
  const footPts = [KP.LeftHeel, KP.RightHeel, KP.LeftFootIndex, KP.RightFootIndex];
  const footVisible = footPts.every((i) => (p[i]?.visibility ?? 0) > 0.5);
  let footSplay = 0;
  if (footVisible) {
    const aL = footAngle(p[KP.LeftHeel], p[KP.LeftFootIndex]);
    const aR = footAngle(p[KP.RightHeel], p[KP.RightFootIndex]);
    footSplay = aR - aL; // 正=双脚尖向外张（外八），负=向内（内八）
  }

  return {
    kneeAngleL,
    kneeAngleR,
    kneeAngle: (kneeAngleL + kneeAngleR) / 2,
    kneeAsymmetry: Math.abs(kneeAngleL - kneeAngleR),
    elbowAngle: (elbowL + elbowR) / 2,
    hipAngle: (hipL + hipR) / 2,
    torsoInclination: torsoInclination(p),
    bodyStraightness: (straightL + straightR) / 2,
    wristsAboveShoulders,
    ankleSpread,
    visibility: avgVisibility(p),
    kneeValgus,
    hipBelowKnee,
    footSplay,
    footVisible,
  };
}
