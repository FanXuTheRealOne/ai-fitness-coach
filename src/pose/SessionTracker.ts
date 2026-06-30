import { ExerciseDef } from "./types";

export interface SessionSummary {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  durationSec: number;
  calories: number;
  correctFormPct: number; // 0..100
  holdSec: number; // 保持型动作（plank）累计保持时长
  repQualities: number[]; // 每个 rep 的质量分（用于 Detail 曲线）
}

const BODY_WEIGHT_KG = 70; // 默认体重，用于卡路里估算（MET 公式）

/** 累计当次训练数据，结束时产出真实统计供 Session/Detail 展示。不跨会话持久化。 */
export class SessionTracker {
  private startMs: number;
  private reps = 0;
  private qualitySum = 0;
  private qualities: number[] = [];
  private holdSec = 0;
  private exId: string;
  private exName: string;
  private met: number;

  constructor(ex: ExerciseDef, nowMs: number) {
    this.startMs = nowMs;
    this.exId = ex.id;
    this.exName = ex.displayName;
    this.met = ex.met;
  }

  setExercise(ex: ExerciseDef): void {
    this.exId = ex.id;
    this.exName = ex.displayName;
    this.met = ex.met;
  }

  addRep(quality: number): void {
    this.reps++;
    this.qualitySum += quality;
    this.qualities.push(quality);
  }

  addHold(sec: number): void {
    this.holdSec += sec;
  }

  summary(nowMs: number): SessionSummary {
    const durationSec = Math.max(0, (nowMs - this.startMs) / 1000);
    const calories = this.met * BODY_WEIGHT_KG * (durationSec / 3600);
    const correctFormPct = this.reps ? (this.qualitySum / this.reps) * 100 : 0;
    return {
      exerciseId: this.exId,
      exerciseName: this.exName,
      reps: this.reps,
      durationSec,
      calories,
      correctFormPct,
      holdSec: this.holdSec,
      repQualities: this.qualities.slice(),
    };
  }
}
