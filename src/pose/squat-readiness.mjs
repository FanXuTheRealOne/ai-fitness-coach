const REQUIRED_POINTS = [11, 12, 23, 24, 25, 26, 27, 28];

function visible(lm, threshold = 0.55) {
  return Boolean(lm && (lm.visibility ?? 0) >= threshold);
}

function inFrame(lm) {
  return lm && lm.x >= -0.03 && lm.x <= 1.03 && lm.y >= -0.03 && lm.y <= 1.03;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function isSquatCountingReady(pose, features) {
  if (!Array.isArray(pose) || pose.length < 33) return false;
  if (!REQUIRED_POINTS.every((i) => visible(pose[i]) && inFrame(pose[i]))) return false;

  const shoulderMid = mid(pose[11], pose[12]);
  const hipMid = mid(pose[23], pose[24]);
  const kneeMid = mid(pose[25], pose[26]);
  const ankleMid = mid(pose[27], pose[28]);
  const shoulderWidth = Math.max(dist(pose[11], pose[12]), 1e-4);
  const torsoHeight = hipMid.y - shoulderMid.y;
  const upperLeg = dist(hipMid, kneeMid);
  const lowerLeg = dist(kneeMid, ankleMid);
  const legDrop = ankleMid.y - hipMid.y;
  const legLength = upperLeg + lowerLeg;

  // Close-up/cropped frames can still have "visible" landmarks, but the lower body
  // collapses into a small cluster. Do not let those frames drive squat reps.
  if (torsoHeight < shoulderWidth * 0.55) return false;
  if (legDrop < shoulderWidth * 0.9) return false;
  if (legLength < shoulderWidth * 1.15) return false;

  if (features) {
    if (features.visibility < 0.65) return false;
    if (features.ankleSpread < 0.35 || features.ankleSpread > 2.4) return false;
  }

  return true;
}
