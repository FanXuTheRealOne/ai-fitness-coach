import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { SessionSummary } from "../pose/SessionTracker";

export type Screen = "home" | "camera" | "session" | "history" | "detail" | "library";
export type Filter = "All" | "Strength" | "Cardio" | "Mobility";

// On web, allow deep-linking to a screen via the URL hash (e.g. #library) — handy
// for development and previews. Native always starts on home.
const VALID: Screen[] = ["home", "camera", "session", "history", "detail", "library"];
function initialScreen(): Screen {
  if (Platform.OS === "web" && typeof location !== "undefined") {
    const h = location.hash.replace("#", "") as Screen;
    if (VALID.includes(h)) return h;
  }
  return "home";
}

interface AppState {
  screen: Screen;
  reps: number;
  isPaused: boolean;
  elapsed: number; // seconds
  selectedFilter: Filter;
  summary: SessionSummary | null; // 最近一次训练的真实统计（不跨会话持久化）
  // actions
  startCamera: () => void;
  navigate: (s: Screen) => void;
  togglePause: () => void;
  setFilter: (f: Filter) => void;
  setSummary: (s: SessionSummary | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [reps, setReps] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<Filter>("All");
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Refs mirror state for the interval closure without re-subscribing each tick.
  const screenRef = useRef(screen);
  const pausedRef = useRef(isPaused);
  screenRef.current = screen;
  pausedRef.current = isPaused;

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  // Simulation: every second elapsed++, and a rep every 3s (replace with pose model later).
  const startTimer = useCallback(() => {
    stopTimer();
    timer.current = setInterval(() => {
      if (screenRef.current !== "camera" || pausedRef.current) return;
      setElapsed((e) => {
        const next = e + 1;
        if (next % 3 === 0) setReps((r) => r + 1);
        return next;
      });
    }, 1000);
  }, [stopTimer]);

  const startCamera = useCallback(() => {
    setReps(0);
    setElapsed(0);
    setIsPaused(false);
    setScreen("camera");
    startTimer();
  }, [startTimer]);

  const navigate = useCallback(
    (s: Screen) => {
      if (s !== "camera") stopTimer();
      setScreen(s);
    },
    [stopTimer]
  );

  const togglePause = useCallback(() => setIsPaused((p) => !p), []);
  const setFilter = useCallback((f: Filter) => setSelectedFilter(f), []);

  useEffect(() => stopTimer, [stopTimer]);

  return (
    <Ctx.Provider
      value={{
        screen,
        reps,
        isPaused,
        elapsed,
        selectedFilter,
        summary,
        startCamera,
        navigate,
        togglePause,
        setFilter,
        setSummary,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}

export function fmt2(n: number) {
  return String(n).padStart(2, "0");
}
export function clock(totalSeconds: number) {
  return `${fmt2(Math.floor(totalSeconds / 60))}:${fmt2(totalSeconds % 60)}`;
}
