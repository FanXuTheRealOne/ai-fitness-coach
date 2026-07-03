"use client";
import React, { createContext, useCallback, useContext, useState } from "react";
import type { SessionSummary } from "@/pose/SessionTracker";

export type Screen = "home" | "camera" | "session" | "history" | "detail" | "library";
export type Filter = "All" | "Strength" | "Cardio" | "Mobility";

interface AppState {
  screen: Screen;
  selectedFilter: Filter;
  summary: SessionSummary | null;
  startCamera: () => void;
  navigate: (s: Screen) => void;
  setFilter: (f: Filter) => void;
  setSummary: (s: SessionSummary | null) => void;
}

const Ctx = createContext<AppState | null>(null);

function initialScreen(): Screen {
  if (typeof location === "undefined") return "home";
  const h = location.hash.replace("#", "");
  return ["home", "camera", "session", "history", "detail", "library"].includes(h) ? (h as Screen) : "home";
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [selectedFilter, setSelectedFilter] = useState<Filter>("All");
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const startCamera = useCallback(() => setScreen("camera"), []);
  const navigate = useCallback((s: Screen) => setScreen(s), []);
  const setFilter = useCallback((f: Filter) => setSelectedFilter(f), []);

  return (
    <Ctx.Provider value={{ screen, selectedFilter, summary, startCamera, navigate, setFilter, setSummary }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}

export function fmt2(n: number): string {
  return String(n).padStart(2, "0");
}
export function clock(totalSeconds: number): string {
  return `${fmt2(Math.floor(totalSeconds / 60))}:${fmt2(totalSeconds % 60)}`;
}
