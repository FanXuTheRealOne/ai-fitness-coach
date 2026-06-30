import { useCallback, useEffect, useRef, useState } from "react";
import { createPoseProvider } from "./PoseProvider.web";
import { createSpeech } from "./Speech";
import { extractFeatures } from "./features";
import { makeSmoother } from "./geometry";
import { Classifier } from "./Classifier";
import { RepCounter } from "./RepCounter";
import { FormFeedback } from "./FormFeedback";
import { SessionTracker, SessionSummary } from "./SessionTracker";
import { EXERCISE_BY_ID } from "./exercises";
import { Pose } from "./keypoints";

export type DetectionStatus = "loading" | "ready" | "denied" | "error" | "nodevice";

export interface DetectionUI {
  status: DetectionStatus;
  errorMessage: string | null;
  personVisible: boolean;
  pose: Pose | null;
  exerciseName: string;
  confidence: number; // 0..1
  count: number; // rep 型=次数，hold 型=保持秒数
  unit: "REPS" | "SEC";
  elapsed: number; // 秒
  formMessage: string | null;
  formOk: boolean;
}

const INITIAL: DetectionUI = {
  status: "loading",
  errorMessage: null,
  personVisible: false,
  pose: null,
  exerciseName: "—",
  confidence: 0,
  count: 0,
  unit: "REPS",
  elapsed: 0,
  formMessage: null,
  formOk: true,
};

/**
 * 把整条识别管线接进 React：MediaPipe 推理 → 特征 → 分类 → 计数 → 反馈 → 语音 →
 * 统计。通过 requestAnimationFrame 每帧驱动，产出 UI 状态。
 */
export function useDetection(video: HTMLVideoElement | null, paused: boolean, muted: boolean) {
  const [ui, setUi] = useState<DetectionUI>(INITIAL);

  // 引擎实例（跨帧保持）
  const provider = useRef(createPoseProvider());
  const speech = useRef(createSpeech());
  const imgSmoother = useRef(makeSmoother(0.6)); // 平滑画面骨架
  const worldSmoother = useRef(makeSmoother(0.5)); // 平滑 3D 角度
  const classifier = useRef(new Classifier("squat", 8));
  const repCounter = useRef(new RepCounter(EXERCISE_BY_ID.squat));
  const feedback = useRef(new FormFeedback());
  const tracker = useRef<SessionTracker | null>(null);
  const lastExId = useRef("squat");
  const elapsedRef = useRef(0);
  const lastT = useRef<number | null>(null);
  const readyRef = useRef(false);

  // 最新的 paused/muted 供 RAF 闭包读取
  const pausedRef = useRef(paused);
  const mutedRef = useRef(muted);
  pausedRef.current = paused;
  useEffect(() => {
    mutedRef.current = muted;
    speech.current.setMuted(muted);
  }, [muted]);

  // 初始化推理引擎（一次）
  useEffect(() => {
    let alive = true;
    provider.current
      .init()
      .then(() => {
        if (!alive) return;
        readyRef.current = true;
        tracker.current = new SessionTracker(EXERCISE_BY_ID.squat, performance.now());
        setUi((p) => ({ ...p, status: "ready" }));
      })
      .catch((e: any) => {
        if (!alive) return;
        const msg = e?.message || e?.name || (typeof e === "string" ? e : "识别模型初始化失败");
        setUi((p) => ({ ...p, status: "error", errorMessage: msg }));
      });
    return () => {
      alive = false;
      provider.current.close();
      speech.current.cancel();
    };
  }, []);

  // 主循环
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = lastT.current == null ? 0 : (t - lastT.current) / 1000;
      lastT.current = t;

      if (!video || !readyRef.current || pausedRef.current) return;

      let frame: ReturnType<typeof provider.current.detect> = null;
      try {
        frame = provider.current.detect(video, t);
      } catch {
        return;
      }
      if (!frame) {
        setUi((p) => ({ ...p, pose: null, personVisible: false }));
        return;
      }

      const imgPose = imgSmoother.current(frame.landmarks); // 图像坐标，画骨架
      const worldPose = worldSmoother.current(frame.world); // 3D 坐标，算角度
      const f = extractFeatures(worldPose);
      const visImg = imgPose.reduce((s, l) => s + (l.visibility ?? 1), 0) / imgPose.length;
      if (visImg < 0.4) {
        setUi((p) => ({ ...p, pose: imgPose, personVisible: false }));
        return;
      }

      elapsedRef.current += dt;

      const det = classifier.current.update(f);
      const ex = EXERCISE_BY_ID[classifier.current.current];
      if (ex.id !== lastExId.current) {
        repCounter.current.reset(ex);
        tracker.current?.setExercise(ex);
        lastExId.current = ex.id;
      }

      const rep = repCounter.current.update(f);
      if (rep) {
        tracker.current?.addRep(rep.quality);
        speech.current.speak(String(rep.count));
      }
      if (ex.type === "hold" && ex.holdValid?.(f)) {
        tracker.current?.addHold(dt);
      }

      const spoken = feedback.current.update(ex, f, t);
      if (spoken) speech.current.speak(spoken.speak);

      const holdSec = tracker.current?.summary(performance.now()).holdSec ?? 0;
      setUi({
        status: "ready",
        errorMessage: null,
        personVisible: true,
        pose: imgPose,
        exerciseName: ex.displayName,
        confidence: det.confidence,
        count: ex.type === "rep" ? repCounter.current.count : Math.floor(holdSec),
        unit: ex.type === "rep" ? "REPS" : "SEC",
        elapsed: elapsedRef.current,
        formMessage: feedback.current.current?.message ?? null,
        formOk: !feedback.current.current,
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [video]);

  // 摄像头取流失败回调（供 CameraView 调用）
  const onCameraError = useCallback((kind: "denied" | "error", message: string) => {
    setUi((p) => ({ ...p, status: kind === "denied" ? "denied" : "error", errorMessage: message }));
  }, []);

  // 结束并返回当次统计
  const finish = useCallback((): SessionSummary | null => {
    speech.current.cancel();
    return tracker.current ? tracker.current.summary(performance.now()) : null;
  }, []);

  return { ui, onCameraError, finish };
}
