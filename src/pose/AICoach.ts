import { KP, Pose } from "./keypoints";
import { PoseFeatures, FormIssue } from "./types";
import { createRepBatcher } from "./rep-batch.mjs";

export interface CoachFeedback {
  shortCue: string;
  detail: string;
  priority: "low" | "medium" | "high";
  issueCode: string;
}

export type CoachStatus = "idle" | "collecting" | "requesting" | "ready" | "error";

interface Sample {
  t: number;
  exerciseId: string;
  exerciseName: string;
  confidence: number;
  formIssue: string | null;
  metrics: Record<string, number>;
  dynamics: {
    velocity: Record<string, number>;
    acceleration: Record<string, number>;
  };
  landmarks: Array<{ name: string; x: number; y: number; z: number; visibility: number }>;
}

interface RepSummary {
  count: number;
  quality: number;
  durationSec: number;
  issueCodes: string[];
  metrics: Record<string, number>;
  keyFrame: {
    t: number;
    metrics: Record<string, number>;
    dynamics: {
      velocity?: Record<string, number>;
      acceleration?: Record<string, number>;
    };
    landmarks: Array<{ name: string; x: number; y: number; z: number; visibility: number }>;
  } | null;
}

const API_URL =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COACH_API_URL
    ? process.env.EXPO_PUBLIC_COACH_API_URL
    : "http://localhost:8788/api/coach-feedback";

const METRIC_KEYS: Array<keyof PoseFeatures> = [
  "kneeAngle",
  "kneeAngleL",
  "kneeAngleR",
  "kneeAsymmetry",
  "elbowAngle",
  "hipAngle",
  "torsoInclination",
  "bodyStraightness",
  "wristsAboveShoulders",
  "ankleSpread",
  "visibility",
  "kneeValgus",
  "hipBelowKnee",
  "footSplay",
];

const JOINTS: Array<[string, KP]> = [
  ["leftShoulder", KP.LeftShoulder],
  ["rightShoulder", KP.RightShoulder],
  ["leftElbow", KP.LeftElbow],
  ["rightElbow", KP.RightElbow],
  ["leftWrist", KP.LeftWrist],
  ["rightWrist", KP.RightWrist],
  ["leftHip", KP.LeftHip],
  ["rightHip", KP.RightHip],
  ["leftKnee", KP.LeftKnee],
  ["rightKnee", KP.RightKnee],
  ["leftAnkle", KP.LeftAnkle],
  ["rightAnkle", KP.RightAnkle],
  ["leftHeel", KP.LeftHeel],
  ["rightHeel", KP.RightHeel],
  ["leftFoot", KP.LeftFootIndex],
  ["rightFoot", KP.RightFootIndex],
];

function round(v: number, places = 3): number {
  const f = 10 ** places;
  return Math.round(v * f) / f;
}

function pickMetrics(f: PoseFeatures): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of METRIC_KEYS) {
    const v = f[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = round(v);
  }
  return out;
}

function pickLandmarks(pose: Pose) {
  return JOINTS.flatMap(([name, idx]) => {
    const lm = pose[idx];
    if (!lm) return [];
    return [
      {
        name,
        x: round(lm.x, 4),
        y: round(lm.y, 4),
        z: round(lm.z ?? 0, 4),
        visibility: round(lm.visibility ?? 1),
      },
    ];
  });
}

export class CoachWindow {
  private samples: Sample[] = [];
  private repBatcher = createRepBatcher(3);
  private previous: { t: number; metrics: Record<string, number>; velocity: Record<string, number> } | null = null;
  private lastSampleAt = -Infinity;
  private lastRequestAt = -Infinity;
  private inFlight = false;
  private disabledUntil = 0;
  status: CoachStatus = "idle";
  lastError: string | null = null;

  addSample(args: {
    now: number;
    elapsed: number;
    exerciseId: string;
    exerciseName: string;
    confidence: number;
    issue: FormIssue | null;
    features: PoseFeatures;
    worldPose: Pose;
  }) {
    if (args.now - this.lastSampleAt < 450) return;
    this.lastSampleAt = args.now;

    const metrics = pickMetrics(args.features);
    const velocity: Record<string, number> = {};
    const acceleration: Record<string, number> = {};
    if (this.previous) {
      const dt = Math.max((args.now - this.previous.t) / 1000, 0.001);
      for (const key of Object.keys(metrics)) {
        const v = round((metrics[key] - (this.previous.metrics[key] ?? metrics[key])) / dt);
        velocity[key] = v;
        acceleration[key] = round((v - (this.previous.velocity[key] ?? v)) / dt);
      }
    }

    this.previous = { t: args.now, metrics, velocity };
    const sample = {
      t: round(args.elapsed, 2),
      exerciseId: args.exerciseId,
      exerciseName: args.exerciseName,
      confidence: round(args.confidence),
      formIssue: args.issue?.code ?? null,
      metrics,
      dynamics: { velocity, acceleration },
      landmarks: pickLandmarks(args.worldPose),
    };
    this.samples.push(sample);
    this.samples = this.samples.slice(-24);
    this.repBatcher.addSample(sample);
    if (this.status === "idle" && this.samples.length > 0) this.status = "collecting";
  }

  completeRep(rep: { count: number; quality: number }): RepSummary[] | null {
    return this.repBatcher.completeRep(rep);
  }

  reset() {
    this.samples = [];
    this.repBatcher.reset();
    this.previous = null;
    this.lastSampleAt = -Infinity;
    this.status = "idle";
    this.lastError = null;
  }

  async requestBatch(args: {
    now: number;
    elapsed: number;
    exerciseId: string;
    exerciseName: string;
    currentIssue: FormIssue | null;
    reps: RepSummary[];
  }): Promise<CoachFeedback | null> {
    if (this.inFlight || args.now < this.disabledUntil || args.reps.length < 3) return null;
    if (args.now - this.lastRequestAt < 2000) return null;

    this.inFlight = true;
    this.status = "requesting";
    this.lastError = null;
    this.lastRequestAt = args.now;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseId: args.exerciseId,
          exerciseName: args.exerciseName,
          elapsed: args.elapsed,
          currentIssue: args.currentIssue
            ? { code: args.currentIssue.code, message: args.currentIssue.message }
            : null,
          samples: [],
          reps: args.reps,
        }),
      });
      if (!res.ok) throw new Error(`coach api ${res.status}`);
      const data = (await res.json()) as CoachFeedback;
      if (!data.shortCue) return null;
      this.status = "ready";
      return data;
    } catch (error) {
      this.status = "error";
      this.lastError = error instanceof Error ? error.message : "coach api error";
      this.disabledUntil = args.now + 15000;
      return null;
    } finally {
      this.inFlight = false;
    }
  }
}
