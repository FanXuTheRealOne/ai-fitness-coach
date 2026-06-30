import { ExerciseDef, PoseFeatures } from "./types";
import { clamp } from "./geometry";

export interface RepEvent {
  count: number;
  quality: number; // 0..1
}

/**
 * 对单个 rep 型动作的主信号做阈值穿越计数（带回差防抖）：
 * 信号降到 downEnter 以下 = 进入底部；再升回 upExit 以上 = 完成 1 次。
 * 记录底部最深处的特征用于质量评分。hold 型不计数（update 返回 null）。
 */
export class RepCounter {
  private state: "up" | "down" = "up";
  private bottom: PoseFeatures | null = null;
  count = 0;

  constructor(private ex: ExerciseDef) {}

  reset(ex: ExerciseDef): void {
    this.ex = ex;
    this.state = "up";
    this.bottom = null;
    this.count = 0;
  }

  update(f: PoseFeatures): RepEvent | null {
    if (this.ex.type !== "rep" || !this.ex.repSignal) return null;
    const s = this.ex.repSignal(f);
    const down = this.ex.downEnter ?? 0;
    const up = this.ex.upExit ?? 0;

    if (this.state === "up") {
      if (s < down) {
        this.state = "down";
        this.bottom = f;
      }
    } else {
      // 跟踪底部最深处（repSignal 最小）
      if (this.bottom && this.ex.repSignal(this.bottom) > s) this.bottom = f;
      if (s > up) {
        this.state = "up";
        this.count++;
        const q = this.ex.repQuality && this.bottom ? this.ex.repQuality(this.bottom) : 1;
        this.bottom = null;
        return { count: this.count, quality: clamp(q, 0, 1) };
      }
    }
    return null;
  }
}
