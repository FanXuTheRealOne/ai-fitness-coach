const MAX_REP_SAMPLES = 18;

function round(value, places = 3) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

function minMetric(samples, key) {
  const values = samples.map((sample) => sample.metrics?.[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
  return values.length ? round(Math.min(...values)) : undefined;
}

function maxMetric(samples, key) {
  const values = samples.map((sample) => sample.metrics?.[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
  return values.length ? round(Math.max(...values)) : undefined;
}

function avgMetric(samples, key) {
  const values = samples.map((sample) => sample.metrics?.[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!values.length) return undefined;
  return round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function deepestSample(samples) {
  return samples.reduce((best, sample) => {
    const knee = sample.metrics?.kneeAngle;
    const bestKnee = best?.metrics?.kneeAngle;
    if (typeof knee !== "number") return best;
    if (!best || typeof bestKnee !== "number" || knee < bestKnee) return sample;
    return best;
  }, samples[0] ?? null);
}

function compactMetrics(metrics = {}) {
  const keys = [
    "kneeAngle",
    "kneeAngleL",
    "kneeAngleR",
    "kneeAsymmetry",
    "hipAngle",
    "torsoInclination",
    "bodyStraightness",
    "ankleSpread",
    "visibility",
    "kneeValgus",
    "hipBelowKnee",
    "footSplay",
  ];
  return Object.fromEntries(
    keys
      .filter((key) => typeof metrics[key] === "number" && Number.isFinite(metrics[key]))
      .map((key) => [key, round(metrics[key])])
  );
}

function summarizeRep(samples, rep) {
  const keyFrame = deepestSample(samples);
  const issueCodes = samples.flatMap((sample) => (sample.formIssue ? [sample.formIssue] : []));
  const metrics = {
    minKneeAngle: minMetric(samples, "kneeAngle"),
    minKneeAngleL: minMetric(samples, "kneeAngleL"),
    minKneeAngleR: minMetric(samples, "kneeAngleR"),
    maxKneeValgus: maxMetric(samples, "kneeValgus"),
    minBodyStraightness: minMetric(samples, "bodyStraightness"),
    avgTorsoInclination: avgMetric(samples, "torsoInclination"),
    maxHipBelowKnee: maxMetric(samples, "hipBelowKnee"),
  };

  return {
    count: rep.count,
    quality: round(rep.quality),
    durationSec:
      samples.length > 1
        ? round((samples.at(-1).t ?? 0) - (samples[0].t ?? 0), 2)
        : 0,
    issueCodes,
    metrics: Object.fromEntries(Object.entries(metrics).filter(([, value]) => value !== undefined)),
    keyFrame: keyFrame
      ? {
          t: round(keyFrame.t, 2),
          metrics: compactMetrics(keyFrame.metrics),
          dynamics: keyFrame.dynamics ?? {},
          landmarks: Array.isArray(keyFrame.landmarks) ? keyFrame.landmarks : [],
        }
      : null,
  };
}

export function createRepBatcher(batchSize = 3) {
  let samples = [];
  let reps = [];

  return {
    addSample(sample) {
      samples.push(sample);
      samples = samples.slice(-MAX_REP_SAMPLES);
    },

    completeRep(rep) {
      const summary = summarizeRep(samples, rep);
      samples = [];
      reps.push(summary);
      if (reps.length < batchSize) return null;
      const batch = reps.slice(-batchSize);
      reps = [];
      return batch;
    },

    reset() {
      samples = [];
      reps = [];
    },
  };
}
