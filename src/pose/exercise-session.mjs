export function createExerciseSession(initialExerciseId = "squat") {
  let activeExerciseId = initialExerciseId;
  let candidateExerciseId = null;
  let candidateFrames = 0;
  let locked = false;

  return {
    observe(nextExerciseId, { confidence = 0, repCount = 0 } = {}) {
      if (locked || repCount > 0) {
        locked = true;
        return activeExerciseId;
      }

      if (nextExerciseId === activeExerciseId) {
        candidateExerciseId = null;
        candidateFrames = 0;
        return activeExerciseId;
      }

      if (nextExerciseId === candidateExerciseId) candidateFrames++;
      else {
        candidateExerciseId = nextExerciseId;
        candidateFrames = 1;
      }

      if (candidateFrames >= 8 && confidence >= 0.55) {
        activeExerciseId = nextExerciseId;
        candidateExerciseId = null;
        candidateFrames = 0;
      }

      return activeExerciseId;
    },
    reset(nextExerciseId = initialExerciseId) {
      activeExerciseId = nextExerciseId;
      candidateExerciseId = null;
      candidateFrames = 0;
      locked = false;
    },
    get current() {
      return activeExerciseId;
    },
  };
}
