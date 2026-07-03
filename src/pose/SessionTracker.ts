import { ExerciseDef } from "./types";
import { createSessionStatsTracker } from "./session-stats.mjs";

export interface ExerciseSessionStats {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  durationSec: number;
  calories: number;
  correctFormPct: number;
  holdSec: number;
  repQualities: number[];
}

export interface SessionSummary {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  durationSec: number;
  calories: number;
  correctFormPct: number; // 0..100
  holdSec: number; // 保持型动作（plank）累计保持时长
  repQualities: number[]; // 每个 rep 的质量分（用于 Detail 曲线）
  exercises: ExerciseSessionStats[]; // 本次 session 里真实计入统计的运动
}

/** 累计当次训练数据，结束时产出真实统计供 Session/Detail 展示。不跨会话持久化。 */
export class SessionTracker {
  private startMs: number;
  private exId: string;
  private exName: string;
  private stats: ReturnType<typeof createSessionStatsTracker>;

  constructor(ex: ExerciseDef, nowMs: number) {
    this.startMs = nowMs;
    this.exId = ex.id;
    this.exName = ex.displayName;
    this.stats = createSessionStatsTracker(ex, nowMs);
  }

  setExercise(ex: ExerciseDef, nowMs: number): void {
    this.exId = ex.id;
    this.exName = ex.displayName;
    this.stats.setExercise(ex, nowMs);
  }

  addRep(quality: number): void {
    this.stats.addRep(quality);
  }

  addHold(sec: number): void {
    this.stats.addHold(sec);
  }

  summary(nowMs: number): SessionSummary {
    const durationSec = Math.max(0, (nowMs - this.startMs) / 1000);
    const exercises = this.stats.summary(nowMs) as ExerciseSessionStats[];
    const primary = exercises[0] ?? null;
    const reps = exercises.reduce((sum, ex) => sum + ex.reps, 0);
    const holdSec = exercises.reduce((sum, ex) => sum + ex.holdSec, 0);
    const calories = exercises.reduce((sum, ex) => sum + ex.calories, 0);
    const qualityCount = exercises.reduce((sum, ex) => sum + ex.repQualities.length, 0);
    const qualitySum = exercises.reduce((sum, ex) => sum + ex.repQualities.reduce((s, q) => s + q, 0), 0);
    const repQualities = exercises.flatMap((ex) => ex.repQualities);
    const correctFormPct = qualityCount ? (qualitySum / qualityCount) * 100 : 0;
    return {
      exerciseId: primary?.exerciseId ?? this.exId,
      exerciseName: primary?.exerciseName ?? this.exName,
      reps,
      durationSec,
      calories,
      correctFormPct,
      holdSec,
      repQualities,
      exercises,
    };
  }
}
