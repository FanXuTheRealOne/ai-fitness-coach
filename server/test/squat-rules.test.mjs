import test from "node:test";
import assert from "node:assert/strict";
import { squatFormIssues } from "../../src/pose/squat-rules.mjs";

function squat(overrides = {}) {
  return {
    kneeAngle: 92,
    kneeAngleL: 92,
    kneeAngleR: 93,
    kneeAsymmetry: 1,
    hipAngle: 75,
    torsoInclination: 24,
    bodyStraightness: 174,
    wristsAboveShoulders: 0,
    ankleSpread: 1.2,
    visibility: 0.95,
    kneeValgus: 0.1,
    hipBelowKnee: 1,
    footSplay: 12,
    footVisible: true,
    ...overrides,
  };
}

test("squat rules prioritize knee valgus while squatting", () => {
  const issues = squatFormIssues(squat({ kneeValgus: 0.48 }));
  assert.equal(issues[0].code, "valgus");
  assert.match(issues[0].speak, /膝盖/);
});

test("squat rules catch excessive toe out and toe in", () => {
  assert.equal(squatFormIssues(squat({ footSplay: 52 }))[0].code, "footout");
  assert.equal(squatFormIssues(squat({ footSplay: -10 }))[0].code, "footin");
});

test("squat rules catch butt wink at the bottom", () => {
  const issues = squatFormIssues(squat({ kneeAngle: 88, bodyStraightness: 154, hipBelowKnee: 1 }));
  assert.equal(issues[0].code, "buttwink");
  assert.match(issues[0].message, /骨盆|腰/);
});
