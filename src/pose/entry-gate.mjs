const LIMB_POINTS = [
  11, 12, // shoulders
  13, 14, // elbows
  15, 16, // wrists
  23, 24, // hips
  25, 26, // knees
  27, 28, // ankles
];

function isVisible(lm, threshold = 0.55) {
  return Boolean(lm && (lm.visibility ?? 0) >= threshold);
}

export function hasVisibleBody(pose) {
  if (!Array.isArray(pose) || pose.length < 33) return false;
  const torsoVisible = isVisible(pose[11]) && isVisible(pose[12]) && isVisible(pose[23]) && isVisible(pose[24]);
  const limbVisibleCount = LIMB_POINTS.filter((i) => isVisible(pose[i])).length;
  return torsoVisible && limbVisibleCount >= 8;
}

export function createEntryGate(minStableFrames = 5) {
  let active = false;
  let stableFrames = 0;
  let lastSeen = false;

  return {
    observe(pose) {
      const seen = hasVisibleBody(pose);
      lastSeen = seen;
      if (active) return true;
      if (seen) stableFrames += 1;
      else stableFrames = 0;
      if (stableFrames >= minStableFrames) active = true;
      return active;
    },
    reset() {
      active = false;
      stableFrames = 0;
      lastSeen = false;
    },
    get active() {
      return active;
    },
    get lastSeen() {
      return lastSeen;
    },
  };
}
