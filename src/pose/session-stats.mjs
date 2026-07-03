const BODY_WEIGHT_KG = 70;

function round(value, places = 3) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

function exerciseInfo(ex) {
  return {
    exerciseId: ex.id,
    exerciseName: ex.displayName,
    met: ex.met,
  };
}

function emptyStats(ex) {
  return {
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    met: ex.met,
    reps: 0,
    holdSec: 0,
    activeSec: 0,
    qualitySum: 0,
    repQualities: [],
  };
}

function publicStats(stats) {
  const calories = stats.met * BODY_WEIGHT_KG * (stats.activeSec / 3600);
  return {
    exerciseId: stats.exerciseId,
    exerciseName: stats.exerciseName,
    reps: stats.reps,
    holdSec: round(stats.holdSec, 2),
    durationSec: round(stats.activeSec, 2),
    calories: round(calories, 3),
    correctFormPct: stats.reps ? round((stats.qualitySum / stats.reps) * 100, 2) : 0,
    repQualities: stats.repQualities.slice(),
  };
}

function scoreExercise(stats) {
  return stats.reps * 1000 + stats.holdSec;
}

export function createSessionStatsTracker(initialExercise, startMs, bodyWeightKg = BODY_WEIGHT_KG) {
  const weight = bodyWeightKg;
  const entries = new Map();
  let active = exerciseInfo(initialExercise);
  let lastMs = startMs;

  function ensure(ex = active) {
    const id = ex.exerciseId ?? ex.id;
    if (!entries.has(id)) {
      entries.set(
        id,
        emptyStats({
          exerciseId: id,
          exerciseName: ex.exerciseName ?? ex.displayName,
          met: ex.met,
        })
      );
    }
    return entries.get(id);
  }

  function accrue(nowMs) {
    const dt = Math.max(0, (nowMs - lastMs) / 1000);
    ensure().activeSec += dt;
    lastMs = nowMs;
  }

  return {
    setExercise(ex, nowMs) {
      accrue(nowMs);
      active = exerciseInfo(ex);
      ensure();
    },

    addRep(quality) {
      const stats = ensure();
      stats.reps += 1;
      stats.qualitySum += Math.max(0, Math.min(1, quality));
      stats.repQualities.push(Math.max(0, Math.min(1, quality)));
    },

    addHold(sec) {
      ensure().holdSec += Math.max(0, sec);
    },

    summary(nowMs) {
      accrue(nowMs);
      const exercises = [...entries.values()]
        .filter((stats) => stats.reps > 0 || stats.holdSec > 0)
        .map((stats) => {
          const calories = stats.met * weight * (stats.activeSec / 3600);
          return { ...publicStats(stats), calories: round(calories, 3) };
        })
        .sort((a, b) => scoreExercise(b) - scoreExercise(a));
      return exercises;
    },
  };
}
