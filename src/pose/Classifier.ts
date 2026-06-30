import { PoseFeatures, DetectionResult } from "./types";
import { EXERCISES, EXERCISE_BY_ID } from "./exercises";
import { makeScalarSmoother, clamp } from "./geometry";

/**
 * 逐帧把姿态特征分类到某个动作。取所有动作 classify 的最高分者，但切换需要
 * 候选连续 switchFrames 帧领先（时间迟滞），避免相似动作之间抖动误判。
 * 置信度取当前显示动作的平滑后匹配分。
 */
export class Classifier {
  private currentId: string;
  private candidateId: string | null = null;
  private candidateFrames = 0;
  private confSmoother = makeScalarSmoother(0.3);

  constructor(initialId = "squat", private switchFrames = 8) {
    this.currentId = initialId;
  }

  update(f: PoseFeatures): DetectionResult {
    let bestId = this.currentId;
    let bestScore = -1;
    for (const ex of EXERCISES) {
      const sc = ex.classify(f);
      if (sc > bestScore) {
        bestScore = sc;
        bestId = ex.id;
      }
    }

    if (bestId === this.currentId) {
      this.candidateId = null;
      this.candidateFrames = 0;
    } else {
      if (bestId === this.candidateId) this.candidateFrames++;
      else {
        this.candidateId = bestId;
        this.candidateFrames = 1;
      }
      if (this.candidateFrames >= this.switchFrames) {
        this.currentId = bestId;
        this.candidateId = null;
        this.candidateFrames = 0;
      }
    }

    const cur = EXERCISE_BY_ID[this.currentId];
    const confidence = clamp(this.confSmoother(cur.classify(f)), 0, 1);
    return { exerciseId: this.currentId, exerciseName: cur.displayName, confidence };
  }

  get current(): string {
    return this.currentId;
  }
}
