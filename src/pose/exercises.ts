import { ExerciseDef, FormIssue, PoseFeatures } from "./types";
import { clamp, norm01 } from "./geometry";
import { squatFormIssues } from "./squat-rules.mjs";

// classify 返回 0..1，分类器取相对最大者。竖直类（squat/lunge/jumping jack）与水平类
// （push-up/plank）先按 torsoInclination 分流，再用排他特征细分。阈值为经验值，可调。
//
// formChecks 按“优先级”排序：FormFeedback 只播报第一条，所以把伤害风险最高、最该先纠正
// 的检查放前面（如膝内扣 > 深度 > 细节）。每条检查都做相位 gating（只在动作进行中触发），
// 避免站立/静止时乱报。专业标准参考：膝盖对准脚尖不内扣、深蹲破平行、脊柱中立不弓腰、
// 脚尖朝向、俯卧撑/平板身体成直线、弓步前膝不内扣且下沉到位。

const squat: ExerciseDef = {
  id: "squat",
  displayName: "Squat",
  type: "rep",
  met: 5.0,
  classify(f) {
    if (f.torsoInclination > 55) return 0.05;
    let s = 0.5;
    s += (1 - f.wristsAboveShoulders) * 0.3;
    s -= norm01(f.kneeAsymmetry, 28, 65) * 0.35;
    s -= norm01(f.ankleSpread, 1.7, 2.4) * 0.25;
    return clamp(s, 0, 1);
  },
  repSignal: (f) => f.kneeAngle,
  downEnter: 100,
  upExit: 155,
  formChecks(f) {
    return squatFormIssues(f) as FormIssue[];
  },
  repQuality: (b) => {
    const depth = norm01(105 - b.kneeAngle, 0, 35);
    return clamp(depth * (1 - 0.5 * b.kneeValgus), 0, 1);
  },
};

const lunge: ExerciseDef = {
  id: "lunge",
  displayName: "Lunge",
  type: "rep",
  met: 4.0,
  classify(f) {
    if (f.torsoInclination > 55) return 0.05;
    let s = 0.3;
    s += norm01(f.kneeAsymmetry, 28, 70) * 0.6;
    s += (1 - f.wristsAboveShoulders) * 0.1;
    return clamp(s, 0, 1);
  },
  repSignal: (f) => Math.min(f.kneeAngleL, f.kneeAngleR),
  downEnter: 115,
  upExit: 155,
  formChecks(f) {
    const out: FormIssue[] = [];
    const front = Math.min(f.kneeAngleL, f.kneeAngleR);
    const lunging = front < 150 && f.kneeAsymmetry > 20;
    if (lunging && f.kneeValgus > 0.4) {
      out.push({ code: "valgus", message: "前膝对准脚尖", speak: "前膝对准脚尖，别内扣" });
    }
    if (f.torsoInclination > 28) {
      out.push({ code: "torso", message: "上身挺直", speak: "上身挺直，别前倾" });
    }
    if (lunging && front > 120 && front < 160) {
      out.push({ code: "depth", message: "前腿下沉到90度", speak: "前腿再下沉，弯到九十度" });
    }
    return out;
  },
  repQuality: (b) => clamp(norm01(120 - Math.min(b.kneeAngleL, b.kneeAngleR), 0, 40) * (1 - 0.5 * b.kneeValgus), 0, 1),
};

function jjOpenness(f: PoseFeatures): number {
  return clamp((f.wristsAboveShoulders + norm01(f.ankleSpread, 1.1, 2.3)) / 2, 0, 1);
}

const jumpingJack: ExerciseDef = {
  id: "jumpingjack",
  displayName: "Jumping Jack",
  type: "rep",
  met: 8.0,
  classify(f) {
    if (f.torsoInclination > 55) return 0.05;
    let s = 0.15;
    s += f.wristsAboveShoulders * 0.5;
    s += norm01(f.ankleSpread, 1.6, 2.6) * 0.4;
    return clamp(s, 0, 1);
  },
  repSignal: (f) => 1 - jjOpenness(f),
  downEnter: 0.45,
  upExit: 0.7,
  formChecks(f) {
    const out: FormIssue[] = [];
    if (f.wristsAboveShoulders < 0.5) {
      out.push({ code: "arms", message: "手臂举过头顶", speak: "手臂举过头顶，伸直击掌" });
    } else if (f.ankleSpread < 1.4) {
      out.push({ code: "legs", message: "双腿再张开", speak: "双腿再张开一些" });
    }
    return out;
  },
  repQuality: (b) => jjOpenness(b),
};

const pushup: ExerciseDef = {
  id: "pushup",
  displayName: "Push-up",
  type: "rep",
  met: 3.8,
  classify(f) {
    if (f.torsoInclination < 45) return 0.05;
    let s = 0.4;
    s += norm01(f.bodyStraightness, 150, 176) * 0.4;
    s += norm01(f.torsoInclination, 45, 75) * 0.2;
    return clamp(s, 0, 1);
  },
  repSignal: (f) => f.elbowAngle,
  downEnter: 100,
  upExit: 150,
  formChecks(f) {
    const out: FormIssue[] = [];
    if (f.bodyStraightness < 150) {
      out.push({ code: "line", message: "收紧核心，身体成直线", speak: "收紧核心，别塌腰也别撅臀" });
    }
    if (f.elbowAngle > 105 && f.elbowAngle < 150) {
      out.push({ code: "depth", message: "再下低，胸贴近地面", speak: "再下低一点，胸贴近地面" });
    }
    return out;
  },
  repQuality: (b) => clamp(norm01(110 - b.elbowAngle, 0, 45) * clamp(norm01(b.bodyStraightness, 150, 175), 0.4, 1), 0, 1),
};

const plank: ExerciseDef = {
  id: "plank",
  displayName: "Plank",
  type: "hold",
  met: 3.0,
  classify(f) {
    if (f.torsoInclination < 45) return 0.05;
    let s = 0.35;
    s += norm01(f.bodyStraightness, 155, 178) * 0.45;
    s += norm01(20 - Math.abs(f.elbowAngle - 90), 0, 20) * 0.2;
    return clamp(s, 0, 1);
  },
  holdValid: (f) => f.torsoInclination > 45 && f.bodyStraightness > 150,
  formChecks(f) {
    const out: FormIssue[] = [];
    if (f.bodyStraightness < 160) {
      out.push({ code: "line", message: "身体绷成一条直线", speak: "收紧核心，从头到脚一条直线" });
    }
    return out;
  },
};

export const EXERCISES: ExerciseDef[] = [squat, pushup, plank, jumpingJack, lunge];

export const EXERCISE_BY_ID: Record<string, ExerciseDef> = EXERCISES.reduce(
  (m, e) => {
    m[e.id] = e;
    return m;
  },
  {} as Record<string, ExerciseDef>
);
