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
import { CoachFeedback, CoachStatus, CoachWindow } from "./AICoach";
import { createExerciseSession } from "./exercise-session.mjs";
import { createEntryGate } from "./entry-gate.mjs";
import { isSquatCountingReady } from "./squat-readiness.mjs";

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
  entryReady: boolean;
  entryHint: string | null;
  formMessage: string | null;
  coachDetail: string | null;
  formOk: boolean;
  coachStatus: CoachStatus;
  coachError: string | null;
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
  entryReady: false,
  entryHint: "请把肩、肘、腕、髋、膝、踝完整放入画面",
  formMessage: null,
  coachDetail: null,
  formOk: true,
  coachStatus: "idle",
  coachError: null,
};

const DIRECT_SQUAT_CUE_CODES = new Set(["valgus", "footout", "footin", "buttwink", "back"]);

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
  const coach = useRef(new CoachWindow());
  const exerciseSession = useRef(createExerciseSession("squat"));
  const entryGate = useRef(createEntryGate());
  const tracker = useRef<SessionTracker | null>(null);
  const aiFeedback = useRef<CoachFeedback | null>(null);
  const aiFeedbackAt = useRef(0);
  const lastAiSpoken = useRef<string | null>(null);
  const lastLocalSpokenAt = useRef(-Infinity);
  const entrySpoken = useRef(false);
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
        coach.current.reset();
        feedback.current.reset();
        aiFeedback.current = null;
        entrySpoken.current = false;
        setUi((p) => ({
          ...p,
          pose: null,
          personVisible: false,
          entryReady: false,
          entryHint: "请把肩、肘、腕、髋、膝、踝完整放入画面",
          formMessage: null,
          coachDetail: null,
        }));
        return;
      }

      const entryReady = entryGate.current.observe(imgPose);
      if (!entryReady) {
        if (entrySpoken.current) entrySpoken.current = false;
        setUi((p) => ({
          ...p,
          pose: null,
          personVisible: false,
          entryReady: false,
          entryHint: "先把身体完整放进画面，保持几帧",
          formMessage: null,
          coachDetail: null,
          coachStatus: coach.current.status,
          coachError: coach.current.lastError,
          confidence: 0,
        }));
        return;
      }

      const squatReady = isSquatCountingReady(imgPose, f);
      if (!squatReady) {
        coach.current.reset();
        feedback.current.reset();
        repCounter.current.cancelPartial();
        aiFeedback.current = null;
        if (entrySpoken.current) entrySpoken.current = false;
        setUi((p) => ({
          ...p,
          pose: null,
          personVisible: false,
          entryReady: false,
          entryHint: "后退一点，把髋、膝、踝完整放入画面",
          formMessage: null,
          coachDetail: null,
          coachStatus: coach.current.status,
          coachError: coach.current.lastError,
          confidence: 0,
        }));
        return;
      }

      if (!entrySpoken.current) {
        entrySpoken.current = true;
        speech.current.speak("已识别到身体，开始训练", { interrupt: true });
      }

      elapsedRef.current += dt;

      const det = classifier.current.update(f);
      // 当前阶段先专门优化深蹲，避免未完成第一组前被其他动作分类干扰计数。
      const activeExId = exerciseSession.current.observe("squat", {
        confidence: det.confidence,
        repCount: repCounter.current.count,
      });
      const ex = EXERCISE_BY_ID[activeExId];
      if (ex.id !== lastExId.current && repCounter.current.count === 0) {
        repCounter.current.reset(ex);
        tracker.current?.setExercise(ex, t);
        lastExId.current = ex.id;
      } else if (ex.id !== lastExId.current && repCounter.current.count > 0) {
        lastExId.current = ex.id;
      }

      const spoken = feedback.current.update(ex, f, t, 9000, 8000);

      coach.current.addSample({
        now: t,
        elapsed: elapsedRef.current,
        exerciseId: ex.id,
        exerciseName: ex.displayName,
        confidence: det.confidence,
        issue: feedback.current.current,
        features: f,
        worldPose,
      });

      const rep = repCounter.current.update(f);
      if (rep) {
        tracker.current?.addRep(rep.quality);
        const batch = coach.current.completeRep(rep);
        if (batch) {
          void coach.current
            .requestBatch({
              now: t,
              elapsed: elapsedRef.current,
              exerciseId: ex.id,
              exerciseName: ex.displayName,
              currentIssue: feedback.current.current,
              reps: batch,
            })
            .then((next) => {
              if (!next) return;
              aiFeedback.current = next;
              aiFeedbackAt.current = performance.now();
              if (next.shortCue !== lastAiSpoken.current) {
                lastAiSpoken.current = next.shortCue;
                speech.current.speak(next.shortCue, { interrupt: true });
              }
            });
        }
      }
      if (ex.type === "hold" && ex.holdValid?.(f)) {
        tracker.current?.addHold(dt);
      }

      const holdSec = tracker.current?.summary(performance.now()).holdSec ?? 0;
      const aiCurrent = performance.now() - aiFeedbackAt.current < 7000 ? aiFeedback.current : null;
      if (!aiCurrent) aiFeedback.current = null;
      const message = aiCurrent?.shortCue ?? feedback.current.current?.message ?? null;
      const shouldSpeakDirectCue = spoken && DIRECT_SQUAT_CUE_CODES.has(spoken.code) && t - lastLocalSpokenAt.current > 6500;
      const shouldSpeakFallback = !aiCurrent && coach.current.status === "error" && spoken && t - lastLocalSpokenAt.current > 15000;
      if (shouldSpeakDirectCue || shouldSpeakFallback) {
        lastLocalSpokenAt.current = t;
        speech.current.speak(spoken.speak);
      }
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
        entryReady: true,
        entryHint: null,
        formMessage: message,
        coachDetail: aiCurrent?.detail ?? null,
        formOk: !feedback.current.current && !aiCurrent,
        coachStatus: coach.current.status,
        coachError: coach.current.lastError,
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
    coach.current.reset();
    feedback.current.reset();
    entryGate.current.reset();
    entrySpoken.current = false;
    return tracker.current ? tracker.current.summary(performance.now()) : null;
  }, []);

  return { ui, onCameraError, finish };
}
