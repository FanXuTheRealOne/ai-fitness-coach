import { ExerciseDef, PoseFeatures } from "./types";
import { clamp } from "./geometry";
import { createThresholdRepCounter } from "./rep-counter-core.mjs";

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
  private counter: ReturnType<typeof createThresholdRepCounter> | null = null;
  count = 0;

  constructor(private ex: ExerciseDef) {
    this.counter = this.makeCounter(ex);
  }

  private makeCounter(ex: ExerciseDef) {
    if (ex.type !== "rep" || !ex.repSignal) return null;
    return createThresholdRepCounter({
      downEnter: ex.downEnter ?? 0,
      upExit: ex.upExit ?? 0,
      warmupUpFrames: 3,
    });
  }

  reset(ex: ExerciseDef): void {
    this.ex = ex;
    this.counter = this.makeCounter(ex);
    this.count = 0;
  }

  cancelPartial(): void {
    this.counter?.cancelPartial();
  }

  update(f: PoseFeatures): RepEvent | null {
    if (this.ex.type !== "rep" || !this.ex.repSignal || !this.counter) return null;
    const s = this.ex.repSignal(f);
    const quality = this.ex.repQuality ? this.ex.repQuality(f) : 1;
    const event = this.counter.update(s, { quality: clamp(quality, 0, 1) });
    if (!event) return null;
    this.count = event.count;
    return { count: event.count, quality: clamp(event.quality, 0, 1) };
  }
}
