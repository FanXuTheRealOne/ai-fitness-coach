import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeCoachPayload } from "../coach-payload.mjs";

test("sanitizeCoachPayload trims samples and keeps numeric pose metrics", () => {
  const samples = Array.from({ length: 40 }, (_, i) => ({
    t: i * 0.5,
    exerciseId: "squat",
    exerciseName: "Squat",
    confidence: 0.8,
    formIssue: i % 2 ? "depth" : null,
    metrics: {
      kneeAngle: 130 - i,
      torsoInclination: 30 + i / 10,
      bodyStraightness: Number.NaN,
      extra: 999,
    },
  }));

  const result = sanitizeCoachPayload({
    exerciseId: "squat",
    exerciseName: "Squat",
    elapsed: 18.2,
    currentIssue: { code: "depth", message: "再蹲低" },
    samples,
  });

  assert.equal(result.exerciseId, "squat");
  assert.equal(result.samples.length, 24);
  assert.equal(result.samples.at(-1).metrics.kneeAngle, 91);
  assert.equal(result.samples.at(-1).metrics.torsoInclination, 33.9);
  assert.equal("bodyStraightness" in result.samples.at(-1).metrics, false);
  assert.equal("extra" in result.samples.at(-1).metrics, false);
});

test("sanitizeCoachPayload accepts three-rep macro batches without raw frame samples", () => {
  const result = sanitizeCoachPayload({
    exerciseId: "squat",
    exerciseName: "Squat",
    elapsed: 24,
    currentIssue: null,
    reps: [
      {
        count: 4,
        quality: 0.82,
        durationSec: 1.4,
        issueCodes: ["depth", "depth", "valgus"],
        metrics: { minKneeAngle: 97, maxKneeValgus: 0.22, extra: 123 },
        keyFrame: {
          t: 21.2,
          metrics: { kneeAngle: 97, kneeValgus: 0.22 },
          landmarks: [{ name: "leftKnee", x: 0.1, y: 0.2, z: 0, visibility: 0.9 }],
        },
      },
      { count: 5, quality: 0.9, metrics: { minKneeAngle: 91 }, issueCodes: [] },
      { count: 6, quality: 0.88, metrics: { minKneeAngle: 93 }, issueCodes: [] },
    ],
  });

  assert.equal(result.samples.length, 0);
  assert.equal(result.reps.length, 3);
  assert.equal(result.reps[0].count, 4);
  assert.deepEqual(result.reps[0].issueCodes, ["depth", "depth", "valgus"]);
  assert.equal(result.reps[0].metrics.minKneeAngle, 97);
  assert.equal("extra" in result.reps[0].metrics, false);
  assert.equal(result.reps[0].keyFrame.landmarks[0].name, "leftKnee");
});
