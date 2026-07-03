import test from "node:test";
import assert from "node:assert/strict";
import { createRepBatcher } from "../../src/pose/rep-batch.mjs";

function sample(t, kneeAngle, issueCode = null) {
  return {
    t,
    exerciseId: "squat",
    exerciseName: "Squat",
    confidence: 0.9,
    formIssue: issueCode,
    metrics: {
      kneeAngle,
      kneeValgus: issueCode === "valgus" ? 0.5 : 0.1,
      bodyStraightness: 170,
      torsoInclination: 25,
      hipBelowKnee: kneeAngle < 95 ? 1 : 0,
    },
    dynamics: {
      velocity: { kneeAngle: -20 + t },
      acceleration: { kneeAngle: 5 - t },
    },
    landmarks: [{ name: "leftKnee", x: 0.2, y: 0.5, z: 0, visibility: 0.9 }],
  };
}

test("createRepBatcher returns a batch only after three completed reps", () => {
  const batcher = createRepBatcher(3);

  batcher.addSample(sample(0, 160));
  batcher.addSample(sample(0.6, 96, "depth"));
  assert.equal(batcher.completeRep({ count: 1, quality: 0.7 }), null);

  batcher.addSample(sample(1.5, 158));
  batcher.addSample(sample(2.1, 90));
  assert.equal(batcher.completeRep({ count: 2, quality: 0.95 }), null);

  batcher.addSample(sample(3, 157));
  batcher.addSample(sample(3.6, 92, "valgus"));
  const batch = batcher.completeRep({ count: 3, quality: 0.85 });

  assert.equal(batch.length, 3);
  assert.equal(batch[0].count, 1);
  assert.equal(batch[0].metrics.minKneeAngle, 96);
  assert.deepEqual(batch[0].issueCodes, ["depth"]);
  assert.equal(batch[2].metrics.maxKneeValgus, 0.5);
  assert.equal(batch[2].keyFrame.metrics.kneeAngle, 92);
  assert.equal(batch[2].keyFrame.landmarks[0].name, "leftKnee");
});
