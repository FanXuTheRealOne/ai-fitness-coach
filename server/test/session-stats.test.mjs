import test from "node:test";
import assert from "node:assert/strict";
import { createSessionStatsTracker } from "../../src/pose/session-stats.mjs";

const squat = { id: "squat", displayName: "Squat", met: 5 };
const pushup = { id: "pushup", displayName: "Push-up", met: 3.8 };

test("session stats only includes exercises that were actually counted", () => {
  const tracker = createSessionStatsTracker(squat, 0);
  tracker.addRep(0.8);
  tracker.addRep(1);
  tracker.setExercise(pushup, 20_000);

  const exercises = tracker.summary(30_000);

  assert.equal(exercises.length, 1);
  assert.equal(exercises[0].exerciseId, "squat");
  assert.equal(exercises[0].reps, 2);
  assert.equal(exercises[0].correctFormPct, 90);
});

test("session stats tracks separate real exercises when both have work", () => {
  const tracker = createSessionStatsTracker(squat, 0);
  tracker.addRep(0.5);
  tracker.setExercise(pushup, 10_000);
  tracker.addRep(1);
  tracker.addRep(1);

  const exercises = tracker.summary(25_000);

  assert.deepEqual(
    exercises.map((ex) => [ex.exerciseId, ex.reps]),
    [
      ["pushup", 2],
      ["squat", 1],
    ]
  );
  assert.equal(exercises[0].durationSec, 15);
  assert.equal(exercises[1].durationSec, 10);
});
