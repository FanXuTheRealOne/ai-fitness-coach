import test from "node:test";
import assert from "node:assert/strict";
import { createEntryGate, hasVisibleBody } from "../../src/pose/entry-gate.mjs";
import { isSquatCountingReady } from "../../src/pose/squat-readiness.mjs";

function makePose(visible = []) {
  const pose = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0.1 }));
  for (const idx of visible) pose[idx].visibility = 0.9;
  return pose;
}

test("hasVisibleBody rejects face-only pose", () => {
  assert.equal(hasVisibleBody(makePose([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])), false);
});

test("hasVisibleBody accepts full body pose", () => {
  assert.equal(hasVisibleBody(makePose([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28])), true);
});

test("entry gate activates after stable body frames", () => {
  const gate = createEntryGate(3);
  const body = makePose([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]);

  assert.equal(gate.observe(makePose([0])), false);
  assert.equal(gate.observe(body), false);
  assert.equal(gate.observe(body), false);
  assert.equal(gate.observe(body), true);
  assert.equal(gate.observe(makePose([0])), true);
});

test("squat counting readiness rejects close-up collapsed lower-body landmarks", () => {
  const pose = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
  pose[11] = { x: 0.42, y: 0.28, visibility: 0.9 };
  pose[12] = { x: 0.58, y: 0.28, visibility: 0.9 };
  pose[23] = { x: 0.45, y: 0.42, visibility: 0.9 };
  pose[24] = { x: 0.55, y: 0.42, visibility: 0.9 };
  pose[25] = { x: 0.48, y: 0.47, visibility: 0.9 };
  pose[26] = { x: 0.52, y: 0.47, visibility: 0.9 };
  pose[27] = { x: 0.49, y: 0.51, visibility: 0.9 };
  pose[28] = { x: 0.51, y: 0.51, visibility: 0.9 };

  assert.equal(hasVisibleBody(pose), true);
  assert.equal(isSquatCountingReady(pose, { visibility: 0.9, ankleSpread: 1 }), false);
});

test("squat counting readiness accepts full-body squat geometry", () => {
  const pose = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
  pose[11] = { x: 0.42, y: 0.18, visibility: 0.9 };
  pose[12] = { x: 0.58, y: 0.18, visibility: 0.9 };
  pose[23] = { x: 0.45, y: 0.42, visibility: 0.9 };
  pose[24] = { x: 0.55, y: 0.42, visibility: 0.9 };
  pose[25] = { x: 0.42, y: 0.65, visibility: 0.9 };
  pose[26] = { x: 0.58, y: 0.65, visibility: 0.9 };
  pose[27] = { x: 0.36, y: 0.86, visibility: 0.9 };
  pose[28] = { x: 0.64, y: 0.86, visibility: 0.9 };

  assert.equal(isSquatCountingReady(pose, { visibility: 0.9, ankleSpread: 1.1 }), true);
});
