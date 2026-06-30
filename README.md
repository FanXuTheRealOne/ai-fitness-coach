# AI Fitness Coach

カメラでエクササイズをリアルタイム認識し、レップ数のカウント・フォームのフィードバック・分析を行うフィットネスアプリ。

このリポジトリは設計 handoff（`../unpacked/design_handoff_ai_fitness_coach/`）を **Expo (React Native)** で実装したものです。**1 つのコードベースで Web / iOS / Android** を出力でき、まずローカルで Web として開発し、そのまま実機 iOS にビルドできます。

## 技術スタック

| 項目 | 採用 |
|---|---|
| フレームワーク | Expo SDK 56 / React Native 0.85 / React 19 |
| 言語 | TypeScript |
| スタイル | NativeWind (Tailwind) + デザイントークン (`src/theme/tokens.ts`) |
| グラデーション | `expo-linear-gradient` |
| ベクター/スケルトン/チャート | `react-native-svg` |
| アニメーション | RN 標準 `Animated` API（Web/native 共通・worklet 不要） |
| 状態管理 | React Context (`src/state/appState.tsx`) |

## 実行方法

```bash
cd ai-fitness-coach
npm install

# ① ローカル Web 開発（ブラウザで http://localhost:8081）
npm run web

# ② 実機 / シミュレータの iOS（要 Xcode）
npx expo run:ios
#    または開発ビルド: npx expo start  → i キー

# ③ Android
npx expo run:android
```

### Web での画面プレビュー（開発用ディープリンク）
URL ハッシュで任意の画面を直接開けます（`src/state/appState.tsx` で実装）。

```
http://localhost:8081/#home
http://localhost:8081/#camera
http://localhost:8081/#session
http://localhost:8081/#history
http://localhost:8081/#detail
http://localhost:8081/#library
```

## ディレクトリ構成

```
src/
├── Root.tsx                 アプリの組み立て（Provider / 画面切替 / ナビ）
├── data.ts                  デモデータ（recentWorkouts / history / exercises ...）
├── state/appState.tsx       状態管理（screen / reps / isPaused / elapsed / filter）+ レップ計測シミュレーション
├── theme/tokens.ts          デザイントークン（色 / 端末サイズ）
├── components/
│   ├── PhoneShell.tsx       Web では iPhone 風フレーム、native では全画面
│   ├── Chrome.tsx           ステータスバー / Dynamic Island（REC 表示）
│   ├── BottomNav.tsx        5 タブのボトムナビ（中央カメラボタン）
│   ├── WorkoutRow.tsx       Home / History 共通のワークアウト行
│   ├── Icons.tsx            SVG アイコン集
│   └── anim.tsx             アニメーション部品（ScreenFade / PulsingDot / GlowPulse）
└── screens/
    ├── HomeScreen.tsx       ダッシュボード + カメラ起動
    ├── CameraScreen.tsx     ライブ検出 / スケルトン / レップカウンター
    ├── SessionScreen.tsx    セッション中の進捗・統計
    ├── HistoryScreen.tsx    履歴（フィルタ付き）
    ├── DetailScreen.tsx     セッション分析（チャート / 内訳）
    └── LibraryScreen.tsx    エクササイズ一覧
```

## 画面遷移

```
Home   ─[Start Camera]─►  Camera
Home   ─[Recent 行]────►  Detail
Camera ─[X]───────────►  Session      Camera ─[Pause]─► isPaused トグル
Session─[Finish/Pause]─►  Home
History─[行]───────────►  Detail        Detail ─[戻る]─► History
BottomNav: Home / History / Camera / Library / Stats(→Home)
```

## 現状の実装範囲（プロトタイプ）

- 6 画面すべてとナビゲーション、全アニメーション（fadeUp / repPop / scanLine / glow / dotPulse / progressFill）を忠実に再現。
## 真实姿态识别（Web 已实现）

第二阶段已接入**真实的实时姿态识别**，核心三件事全部跑通（Web）：

1. **识别用户在做哪个动作**：MediaPipe PoseLandmarker（BlazePose，33 关键点）→ 规则分类器自动判断 squat / push-up / plank / jumping jack / lunge，带置信度与时间迟滞防抖，显示在检测徽章。
2. **实时建议**：语音播报（Web Speech API，中文）+ 骨架颜色对错（标准 lime / 不标准橙）+ 屏幕文字提示。
3. **计数 + 数据统计**：阈值穿越状态机计数（plank 计时），每个 rep 评质量分，结束后 Session/Detail 显示当次真实统计（reps / 时长 / 卡路里 / Correct Form% / 表现曲线）。当次有效，不跨会话持久化。

### 代码位置（`src/pose/`）

| 文件 | 职责 |
|---|---|
| `keypoints.ts` / `geometry.ts` / `features.ts` | 关键点定义、关节角度/平滑、特征提取（纯函数） |
| `exercises.ts` | 5 个动作的 classify / 计数信号 / formChecks（规则引擎，集中调参） |
| `Classifier.ts` | 打分取最高 + 时间迟滞 + 置信度 |
| `RepCounter.ts` | 阈值穿越状态机 + 每 rep 质量分 |
| `FormFeedback.ts` | formChecks → 屏幕/语音建议（节流去重） |
| `SessionTracker.ts` | 当次统计（MET 卡路里、Correct Form%） |
| `Speech.ts` | 跨平台语音（Web=SpeechSynthesis，native 自动降级） |
| `PoseProvider.web.ts` | MediaPipe 推理（运行时从 CDN 加载，GPU→CPU 回退） |
| `CameraView.web.tsx` | `getUserMedia` 摄像头取流（镜像 video） |
| `useDetection.web.ts` | 把整条管线接进 React（RAF 驱动） |
| `screens/CameraScreen.web.tsx` | Web 真实检测画面；`CameraScreen.tsx` 为 native 静态占位 |

### 用法

`npm run web` → 进入相机画面 → 允许摄像头权限 → 对着自己做动作。会看到实时骨架（对/错变色）、自动识别的动作名与置信度、真实计数、中文语音播报；点 X 退出后 Session/Detail 显示当次真实统计。
> 首次需联网下载识别模型（几 MB）；需 localhost 或 https 才能访问摄像头。

## 转 iOS 的衔接（待办）

识别/计数/反馈/统计逻辑（`src/pose/` 纯 TS）跨平台复用，iOS 只需新增两处 native 实现：

1. **摄像头取流**：`PoseProvider.native.ts` + `CameraView.native.tsx`，用 `react-native-vision-camera`（需 development build，非 Expo Go）。
2. **推理后端**：vision-camera frame processor + MoveNet/BlazePose（`react-native-fast-tflite`）或 Apple Vision `VNDetectHumanBodyPoseRequest`，把归一化关键点喂给同一套逻辑。
3. **语音**：`Speech.native.ts` 改用 `expo-speech`。

## デザイン忠実度に関する補足

- Web では Inter（Google Fonts）を読み込み（`global.css`）。native はシステムフォント（San Francisco 等）にフォールバック。完全一致が必要なら `@expo-google-fonts/inter` を `useFonts` で読み込み、ウェイトごとにフォントファミリを指定する。
- グロー表現は `shadow*`（iOS / Web の box-shadow）で再現。Android は `elevation` の制約により見え方が異なる場合あり。
