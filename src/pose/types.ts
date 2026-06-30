// 从一副姿态中提取的、与动作判定相关的特征。
export interface PoseFeatures {
  kneeAngle: number; // 两膝均值（髋-膝-踝）
  kneeAngleL: number;
  kneeAngleR: number;
  kneeAsymmetry: number; // |L-R|，弓步时很大
  elbowAngle: number; // 两肘均值（肩-肘-腕）
  hipAngle: number; // 肩-髋-膝 均值（躯干与大腿夹角）
  torsoInclination: number; // 0=竖直站立，90=水平
  bodyStraightness: number; // 肩-髋-踝 角度，接近180=身体成直线
  wristsAboveShoulders: number; // 0..1，手腕高于肩的程度
  ankleSpread: number; // 双踝水平距 / 肩宽
  visibility: number; // 关键点平均可见度 0..1
  // —— 专业姿态细节（基于 3D world 坐标） ——
  kneeValgus: number; // 0..1，膝盖内扣程度（取双膝较大者），knee valgus
  hipBelowKnee: number; // 髋相对膝的垂直差（world，米），>0 = 深蹲破平行
  footSplay: number; // 度，双脚尖水平张角（正=外八 / 负=内八）
  footVisible: boolean; // 脚部关键点是否足够可见（不可见则跳过脚相关检查）
}

export interface FormIssue {
  code: string; // 去重键
  message: string; // 屏幕显示
  speak: string; // 语音播报
}

export type ExerciseType = "rep" | "hold";

export interface ExerciseDef {
  id: string;
  displayName: string;
  type: ExerciseType;
  met: number; // 代谢当量，用于卡路里估算

  /** 当前姿态与该动作的匹配分 0..1（相对大小决定分类，不要求绝对精确）。 */
  classify(f: PoseFeatures): number;

  // —— rep 型 ——
  /** 随动作起伏的标量：底部值小、顶部值大。 */
  repSignal?(f: PoseFeatures): number;
  downEnter?: number; // signal < downEnter → 进入“底部”
  upExit?: number; // signal > upExit → 回到“顶部”，完成 1 次（带回差防抖）

  // —— hold 型 ——
  /** 当前是否处于有效保持姿态。 */
  holdValid?(f: PoseFeatures): boolean;

  /** 姿态检查，返回问题列表（空数组=标准）。 */
  formChecks(f: PoseFeatures): FormIssue[];

  /** rep 底部时刻的质量评分 0..1（动作是否到位），用于聚合 Correct Form%。 */
  repQuality?(bottom: PoseFeatures): number;
}

// 分类器输出
export interface DetectionResult {
  exerciseId: string;
  exerciseName: string;
  confidence: number; // 0..1
}
