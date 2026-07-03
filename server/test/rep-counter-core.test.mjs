import test from "node:test";
import assert from "node:assert/strict";
import { createThresholdRepCounter } from "../../src/pose/rep-counter-core.mjs";

test("threshold counter does not count until it first sees a stable upright start", () => {
  const counter = createThresholdRepCounter({ downEnter: 100, upExit: 155, warmupUpFrames: 3 });

  assert.equal(counter.update(88, { quality: 0.7 }), null);
  assert.equal(counter.update(120, { quality: 0.7 }), null);
  assert.equal(counter.update(160, { quality: 0.7 }), null);
  assert.equal(counter.update(162, { quality: 0.7 }), null);
  assert.equal(counter.update(161, { quality: 0.7 }), null);
  assert.equal(counter.count, 0);
});

test("threshold counter counts after upright warmup, down phase, and return to top", () => {
  const counter = createThresholdRepCounter({ downEnter: 100, upExit: 155, warmupUpFrames: 2 });

  counter.update(160, { quality: 1 });
  counter.update(162, { quality: 1 });
  assert.equal(counter.update(95, { quality: 0.8 }), null);
  assert.deepEqual(counter.update(158, { quality: 0.8 }), { count: 1, quality: 0.8 });
});

test("threshold counter can cancel an invalid partial rep without clearing completed count", () => {
  const counter = createThresholdRepCounter({ downEnter: 100, upExit: 155, warmupUpFrames: 2 });

  counter.update(160, { quality: 1 });
  counter.update(162, { quality: 1 });
  counter.update(94, { quality: 0.6 });
  counter.cancelPartial();
  assert.equal(counter.update(158, { quality: 0.6 }), null);
  assert.equal(counter.count, 0);

  counter.update(160, { quality: 1 });
  counter.update(162, { quality: 1 });
  counter.update(92, { quality: 0.9 });
  assert.deepEqual(counter.update(158, { quality: 0.9 }), { count: 1, quality: 0.9 });
  counter.update(94, { quality: 0.5 });
  counter.cancelPartial();
  assert.equal(counter.count, 1);
});
