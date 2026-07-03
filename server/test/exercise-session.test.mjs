import test from "node:test";
import assert from "node:assert/strict";
import { createExerciseSession } from "../../src/pose/exercise-session.mjs";

test("exercise session locks after the first rep starts", () => {
  const session = createExerciseSession("squat");

  assert.equal(session.observe("squat", { confidence: 0.9, repCount: 0 }), "squat");
  assert.equal(session.observe("lunge", { confidence: 0.95, repCount: 0 }), "squat");
  assert.equal(session.observe("lunge", { confidence: 0.95, repCount: 1 }), "squat");
  session.reset("squat");
  for (let i = 0; i < 7; i++) {
    assert.equal(session.observe("lunge", { confidence: 0.95, repCount: 0 }), "squat");
  }
  assert.equal(session.observe("lunge", { confidence: 0.95, repCount: 0 }), "lunge");
});
