# 设计文档:真实姿态识别 + 实时反馈 + 计数统计

- 日期:2026-06-29
- 项目:AI Fitness Coach (Expo / React Native,Web 优先)
- 范围:第一版(MVP)真实功能,替换现有的模拟计数

## 1. 目标

把现有 6 画面原型里的「模拟计数」替换为真实能力,核心三件事:

1. **识别用户在做哪个动作**(纯自动识别 + 置信度)
2. **实时给出建议**(语音播报为主 + 骨架颜色对错视觉)
3. **计数 + 当次数据统计**(reps / 时长 / 卡路里 / Correct Form%)

## 2. 已确认的决策

| 维度 | 决策 |
|---|---|
| 平台策略 | **Web 优先**:先在浏览器用 MediaPipe Tasks Vision (JS) 跑通,识别/计数/反馈逻辑跨平台复用,iOS 后续只换摄像头取流与推理后端 |
| 推理引擎 | MediaPipe `@mediapipe/tasks-vision` 的 **PoseLandmarker**(BlazePose,33 个关键点) |
| 动作集 | **全部 5 个**:Squat / Push-up / Plank / Jumping Jack / Lunge(规则引擎) |
| 识别策略 | **纯自动识别**:规则分类器输出当前动作 + 置信度,带时间迟滞防抖 |
| 反馈形式 | **语音播报为主** + **骨架颜色对错**(标准 lime / 不标准橙红) |
| 数据 | **不跨会话持久化**;当次 session 结束后 Session/Detail 显示这次的真实统计;History 继续用示例数据 |

## 3. 架构与平台隔离

新建 `src/pose/` 目录,所有识别逻辑与平台无关;平台相关部分用 `.web.ts` / `.native.ts` 后缀隔离。

转 iOS 时只需新增两处 native 实现:
- 摄像头取流:`react-native-vision-camera`
- 推理后端:vision-camera frame processor + MoveNet/BlazePose(`react-native-fast-tflite`)或 Apple Vision

识别/计数/反馈/统计逻辑(纯 TS)原样复用。

### 数据流(每帧)

```
CameraView(<video>)
  → PoseProvider           // 输出 33 个归一化关键点 (x,y,visibility)
  → smoothing              // 指数平滑,去抖
  → Classifier             // 当前动作 id + 置信度(带迟滞)
  → RepCounter             // 计数(阈值穿越状态机)+ 每 rep 质量分
  + FormFeedback           // 生成建议消息(节流去重)
  → SpeechProvider         // 语音播报(计数 + 关键提示)
  + UI                     // 实时骨架(对错变色)/ 检测徽章 / rep 计数
  → SessionTracker         // 累计当次统计
```

## 4. 模块拆分(职责单一、可独立测试)

| 模块 | 文件 | 职责 | 依赖 |
|---|---|---|---|
| PoseProvider 接口 | `src/pose/PoseProvider.ts` | `start(video)/onResults(cb)/stop()` 抽象 | — |
| Web 实现 | `src/pose/PoseProvider.web.ts` | MediaPipe PoseLandmarker (WASM/GPU) | @mediapipe/tasks-vision |
| 关键点类型 | `src/pose/keypoints.ts` | 33 关键点枚举与类型(BlazePose 索引) | — |
| 几何工具 | `src/pose/geometry.ts` | `angle(a,b,c)`、向量、指数平滑/低通 | — (纯函数) |
| 动作定义 | `src/pose/exercises/*.ts` | 每个动作:classify 特征 / repSignal / 阈值 / formChecks | geometry |
| 注册表 | `src/pose/exercises/index.ts` | 汇总所有 ExerciseDef | — |
| 分类器 | `src/pose/Classifier.ts` | 打分取最高 + 置信度 + 时间迟滞 | exercises, geometry |
| 计数器 | `src/pose/RepCounter.ts` | 阈值穿越状态机;hold 型计时;质量分 | geometry |
| 反馈引擎 | `src/pose/FormFeedback.ts` | 跑 formChecks,节流去重生成建议 | exercises |
| 语音 | `src/pose/Speech.web.ts` / `.native.ts` | 队列 + 节流 + 静音开关 | Web Speech API / expo-speech |
| 会话统计 | `src/pose/SessionTracker.ts` | 累计 reps/时长/卡路里(MET)/Correct Form% | — |
| 检测 Hook | `src/pose/useDetection.ts` | 把以上接进 React,产出 UI 所需状态 | 上述全部 |

### ExerciseDef 形态

```ts
type ExerciseType = 'rep' | 'hold';

interface ExerciseDef {
  id: string;
  displayName: string;
  type: ExerciseType;
  // 分类:给定平滑后的特征,返回该动作的匹配分 [0..1]
  classify(features: PoseFeatures): number;
  // 计数主信号(rep 型):返回一个随动作起伏的标量(如膝角)
  repSignal?(kp: Keypoints): number;
  downThreshold?: number;   // 进入“底部”的阈值
  upThreshold?: number;     // 回到“顶部”的阈值(带回差,防抖)
  // 保持型(hold):返回当前是否处于正确保持姿态
  holdValid?(kp: Keypoints): boolean;
  // 姿态检查:返回若干建议(空数组=标准)
  formChecks(kp: Keypoints): FormIssue[];
}
```

## 5. 五个动作的判定规则

| 动作 | type | 计数/计时信号 | 反馈检查(示例) |
|---|---|---|---|
| Squat | rep | 膝角(髋-膝-踝),< ~90° 为底,> ~160° 为起 | 深度不够 / 背前倾 / 膝内扣 |
| Push-up | rep | 肘角(肩-肘-腕),< ~90° 为底;躯干需水平 | 没下到底 / 髋下沉(塌腰) |
| Plank | hold | 躯干(肩-髋-踝)接近一条直线 → 计时 | 塌腰 / 撅臀 |
| Jumping Jack | rep | 手腕高于肩 + 双踝间距张开,同步张合 = 1 | 手没抬够 / 腿没张够 |
| Lunge | rep | 前腿膝角下蹲,左右腿交替 | 膝超脚尖 / 深度不够 |

每个 rep 由 RepCounter 评一个质量分(动作幅度是否到位、速度是否过快、左右是否对称),会话结束聚合为 Correct Form%。

## 6. UI 改造(主要在 CameraScreen)

- 真实摄像头视频作为背景(Web:`getUserMedia` → `<video>`);保留扫描线/角标。
- 实时骨架替换静态骨架:按关键点绘制,**对错变色**(标准 lime,不标准橙红),保留发光动画。
- 检测徽章显示**真实**动作名 + 置信度。
- rep 计数为**真实**值,保留 repPop 动画。
- 喇叭按钮接语音静音开关。
- 摄像头权限/无设备/模型加载中的状态态(友好提示 + 重试)。
- 退出(X)→ Session;Session 与 Detail 使用 SessionTracker 的真实当次数据。

## 7. 明确不做(YAGNI)

跨会话持久化、账号登录、云同步、训练式分类模型、原生 iOS 实现(仅保留接口与迁移说明)。

## 8. 测试策略

- `geometry.ts`、各 `exercises/*` 的 classify/formChecks、`RepCounter`、`Classifier` 均为**纯函数**,用合成/录制的关键点序列做单元测试(如喂入一段“深蹲下-起”的关键点序列,断言计数 +1、质量分合理、分类为 squat)。
- `SessionTracker` 用模拟事件序列测试聚合结果。
- UI 层用 Web 手动验证(浏览器 + 摄像头)+ 截图。

## 9. 风险与缓解

- `getUserMedia` 需 localhost 或 https — 本地开发用 localhost 可满足。
- MediaPipe 首次需联网下载 wasm + 模型(数 MB)— 做加载态,模型文件可后续本地化。
- 规则分类在相似动作间可能误判 — 用置信度阈值 + 时间迟滞 + (从 Library 进入时可选锁定,后续增强)缓解。
- 不同机位/体型影响阈值 — 阈值用相对角度而非绝对像素,降低敏感度。

## 10. 转 iOS 的衔接

- 新增 `PoseProvider.native.ts`(vision-camera frame processor)与 `CameraView.native.tsx`。
- `Speech.native.ts` 用 `expo-speech`。
- 需要 Expo development build(非 Expo Go)以支持原生帧处理。
- 识别/计数/反馈/统计逻辑零改动。
