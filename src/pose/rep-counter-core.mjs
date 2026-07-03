export function createThresholdRepCounter({ downEnter, upExit, warmupUpFrames = 3 }) {
  let state = "waitingUp";
  let upFrames = 0;
  let bottomSignal = Infinity;
  let bottomPayload = null;

  const api = {
    count: 0,

    reset() {
      state = "waitingUp";
      upFrames = 0;
      bottomSignal = Infinity;
      bottomPayload = null;
      api.count = 0;
    },

    cancelPartial() {
      state = "waitingUp";
      upFrames = 0;
      bottomSignal = Infinity;
      bottomPayload = null;
    },

    update(signal, payload = {}) {
      if (typeof signal !== "number" || !Number.isFinite(signal)) return null;

      if (state === "waitingUp") {
        if (signal > upExit) {
          upFrames += 1;
          if (upFrames >= warmupUpFrames) state = "up";
        } else {
          upFrames = 0;
        }
        return null;
      }

      if (state === "up") {
        if (signal < downEnter) {
          state = "down";
          bottomSignal = signal;
          bottomPayload = payload;
        }
        return null;
      }

      if (signal < bottomSignal) {
        bottomSignal = signal;
        bottomPayload = payload;
      }

      if (signal > upExit) {
        state = "up";
        api.count += 1;
        const quality = typeof bottomPayload?.quality === "number" ? bottomPayload.quality : 1;
        bottomSignal = Infinity;
        bottomPayload = null;
        return { count: api.count, quality };
      }

      return null;
    },
  };

  return api;
}
