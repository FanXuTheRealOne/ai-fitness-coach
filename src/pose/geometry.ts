import { Landmark, Pose, KP } from "./keypoints";

/**
 * 在 b 处的夹角（a-b-c），度数 [0,180]。3D-aware：若关键点带 z 则按 3D 计算
 * （用于 BlazePose 的 world landmarks，透视无关），否则退化为 2D。
 */
export function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const abz = (a.z ?? 0) - (b.z ?? 0);
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const cbz = (c.z ?? 0) - (b.z ?? 0);
  const dot = abx * cbx + aby * cby + abz * cbz;
  const magAb = Math.hypot(abx, aby, abz);
  const magCb = Math.hypot(cbx, cby, cbz);
  if (magAb === 0 || magCb === 0) return 180;
  return (Math.acos(clamp(dot / (magAb * magCb), -1, 1)) * 180) / Math.PI;
}

export function midpoint(a: Landmark, b: Landmark): Landmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z ?? 0) + (b.z ?? 0)) / 2 };
}

export function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

/**
 * 躯干相对重力轴(+y)的倾角：0=竖直站立，90=水平（俯卧撑/平板）。
 * 用 3D 向量（肩中点→髋中点）与 y 轴夹角，透视无关。
 */
export function torsoInclination(p: Pose): number {
  const sh = midpoint(p[KP.LeftShoulder], p[KP.RightShoulder]);
  const hip = midpoint(p[KP.LeftHip], p[KP.RightHip]);
  const vx = hip.x - sh.x;
  const vy = hip.y - sh.y;
  const vz = (hip.z ?? 0) - (sh.z ?? 0);
  const mag = Math.hypot(vx, vy, vz) || 1e-4;
  return (Math.acos(clamp(vy / mag, -1, 1)) * 180) / Math.PI;
}

/** 指数平滑器（EMA），逐点平滑 x/y/z，降低抖动。alpha 越大越跟手。 */
export function makeSmoother(alpha = 0.5) {
  let prev: Pose | null = null;
  return (p: Pose): Pose => {
    if (!prev || prev.length !== p.length) {
      prev = p;
      return p;
    }
    const out = p.map((lm, i) => ({
      x: alpha * lm.x + (1 - alpha) * prev![i].x,
      y: alpha * lm.y + (1 - alpha) * prev![i].y,
      z: alpha * (lm.z ?? 0) + (1 - alpha) * (prev![i].z ?? 0),
      visibility: lm.visibility,
    }));
    prev = out;
    return out;
  };
}

/** 一阶标量低通滤波器（平滑置信度等单值）。 */
export function makeScalarSmoother(alpha = 0.5) {
  let prev: number | null = null;
  return (v: number): number => {
    if (prev === null) {
      prev = v;
      return v;
    }
    prev = alpha * v + (1 - alpha) * prev;
    return prev;
  };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** 把数值从 [inLo,inHi] 线性映射到 [0,1] 并裁剪。 */
export function norm01(v: number, inLo: number, inHi: number): number {
  if (inHi === inLo) return 0;
  return clamp((v - inLo) / (inHi - inLo), 0, 1);
}
