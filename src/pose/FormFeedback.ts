import { ExerciseDef, FormIssue, PoseFeatures } from "./types";

/**
 * 把动作的 formChecks 结果转成「屏幕显示的当前问题」+「需要语音播报的问题」。
 * 语音做两级节流，避免啰嗦：
 *  - 同一问题在 cooldownMs 内不重复；
 *  - 任意两条语音之间至少间隔 minGapMs（防连珠炮）。
 * 屏幕显示（current）始终实时更新，不受节流影响。
 */
export class FormFeedback {
  private lastSpoken: Record<string, number> = {};
  private lastAnyAt = -Infinity;
  current: FormIssue | null = null;

  update(ex: ExerciseDef, f: PoseFeatures, now: number, cooldownMs = 7000, minGapMs = 5000): FormIssue | null {
    const issues = ex.formChecks(f);
    this.current = issues[0] ?? null;
    if (!issues.length) return null;

    const issue = issues[0];
    if (now - this.lastAnyAt < minGapMs) return null; // 全局最小间隔
    const last = this.lastSpoken[issue.code] ?? -Infinity;
    if (now - last < cooldownMs) return null; // 同一问题冷却

    this.lastSpoken[issue.code] = now;
    this.lastAnyAt = now;
    return issue;
  }

  reset(): void {
    this.lastSpoken = {};
    this.lastAnyAt = -Infinity;
    this.current = null;
  }
}
