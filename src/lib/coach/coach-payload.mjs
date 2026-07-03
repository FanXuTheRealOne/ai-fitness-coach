const METRIC_KEYS = new Set([
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
  "minKneeAngle",
  "minKneeAngleL",
  "minKneeAngleR",
  "maxKneeValgus",
  "minBodyStraightness",
  "avgTorsoInclination",
  "maxHipBelowKnee",
]);

const DYNAMIC_KEYS = new Set(["velocity", "acceleration"]);
const MAX_SAMPLES = 24;
const MAX_REPS = 3;
const MAX_LANDMARKS = 17;

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value, places = 3) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

function cleanText(value, fallback, max = 80) {
  if (typeof value !== "string") return fallback;
  const s = value.trim();
  return s ? s.slice(0, max) : fallback;
}

function cleanMetrics(metrics) {
  const out = {};
  if (!metrics || typeof metrics !== "object") return out;
  for (const [key, value] of Object.entries(metrics)) {
    if (METRIC_KEYS.has(key) && finiteNumber(value)) out[key] = round(value, 3);
  }
  return out;
}

function cleanDynamics(dynamics) {
  const out = {};
  if (!dynamics || typeof dynamics !== "object") return out;
  for (const [kind, values] of Object.entries(dynamics)) {
    if (!DYNAMIC_KEYS.has(kind) || !values || typeof values !== "object") continue;
    const cleaned = {};
    for (const [key, value] of Object.entries(values)) {
      if (METRIC_KEYS.has(key) && finiteNumber(value)) cleaned[key] = round(value, 3);
    }
    if (Object.keys(cleaned).length) out[kind] = cleaned;
  }
  return out;
}

function cleanLandmarks(landmarks) {
  if (!Array.isArray(landmarks)) return [];
  return landmarks.slice(0, MAX_LANDMARKS).flatMap((lm) => {
    if (!lm || typeof lm !== "object") return [];
    const { name, x, y, z, visibility } = lm;
    if (!finiteNumber(x) || !finiteNumber(y)) return [];
    return [
      {
        name: cleanText(name, "joint", 24),
        x: round(x, 4),
        y: round(y, 4),
        z: finiteNumber(z) ? round(z, 4) : 0,
        visibility: finiteNumber(visibility) ? round(visibility, 3) : 1,
      },
    ];
  });
}

function cleanIssue(issue) {
  if (!issue || typeof issue !== "object") return null;
  return {
    code: cleanText(issue.code, "unknown", 40),
    message: cleanText(issue.message, "", 80),
  };
}

function cleanRep(rep) {
  if (!rep || typeof rep !== "object") return null;
  const metrics = cleanMetrics(rep.metrics);
  const keyFrame =
    rep.keyFrame && typeof rep.keyFrame === "object"
      ? {
          t: finiteNumber(rep.keyFrame.t) ? round(rep.keyFrame.t, 3) : 0,
          metrics: cleanMetrics(rep.keyFrame.metrics),
          dynamics: cleanDynamics(rep.keyFrame.dynamics),
          landmarks: cleanLandmarks(rep.keyFrame.landmarks),
        }
      : null;

  if (!Object.keys(metrics).length && (!keyFrame || !Object.keys(keyFrame.metrics).length)) return null;

  return {
    count: finiteNumber(rep.count) ? Math.max(0, Math.floor(rep.count)) : 0,
    quality: finiteNumber(rep.quality) ? round(Math.max(0, Math.min(1, rep.quality)), 3) : 0,
    durationSec: finiteNumber(rep.durationSec) ? round(rep.durationSec, 2) : 0,
    issueCodes: Array.isArray(rep.issueCodes)
      ? rep.issueCodes
          .filter((code) => typeof code === "string" && code.trim())
          .slice(0, 12)
          .map((code) => code.slice(0, 40))
      : [],
    metrics,
    keyFrame,
  };
}

export function sanitizeCoachPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid JSON payload");
  }

  const samples = Array.isArray(payload.samples) ? payload.samples.slice(-MAX_SAMPLES) : [];
  const cleanedSamples = samples.flatMap((sample) => {
    if (!sample || typeof sample !== "object") return [];
    const metrics = cleanMetrics(sample.metrics);
    if (!Object.keys(metrics).length) return [];
    return [
      {
        t: finiteNumber(sample.t) ? round(sample.t, 3) : 0,
        exerciseId: cleanText(sample.exerciseId, "unknown", 40),
        exerciseName: cleanText(sample.exerciseName, "Unknown", 60),
        confidence: finiteNumber(sample.confidence) ? round(sample.confidence, 3) : 0,
        formIssue: typeof sample.formIssue === "string" ? sample.formIssue.slice(0, 40) : null,
        metrics,
        dynamics: cleanDynamics(sample.dynamics),
        landmarks: cleanLandmarks(sample.landmarks),
      },
    ];
  });
  const reps = Array.isArray(payload.reps) ? payload.reps.slice(-MAX_REPS).map(cleanRep).filter(Boolean) : [];

  if (!cleanedSamples.length && !reps.length) {
    throw new Error("At least one valid pose sample or rep summary is required");
  }

  return {
    exerciseId: cleanText(payload.exerciseId, cleanedSamples.at(-1)?.exerciseId ?? "unknown", 40),
    exerciseName: cleanText(payload.exerciseName, cleanedSamples.at(-1)?.exerciseName ?? "Unknown", 60),
    elapsed: finiteNumber(payload.elapsed) ? round(payload.elapsed, 2) : 0,
    currentIssue: cleanIssue(payload.currentIssue),
    samples: cleanedSamples,
    reps,
  };
}
