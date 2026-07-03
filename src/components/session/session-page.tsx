"use client";
import React from "react";
import { useApp, clock } from "@/components/fit/app-state";
import { ChevronLeft, PauseIcon } from "@/components/fit/icons";
import { sessionStats } from "@/lib/fit/data";

const EMOJI: Record<string, string> = {
  squat: "🏋️",
  pushup: "💪",
  plank: "🤸",
  jumpingjack: "⭐",
  lunge: "🦵",
};

export function SessionPage() {
  const { navigate, summary } = useApp();
  const exName = summary?.exerciseName ?? "Squat";
  const stats = summary
    ? [
        {
          emoji: "🔄",
          label: summary.holdSec > 0 ? "Hold (s)" : "Reps",
          value: String(summary.holdSec > 0 ? Math.round(summary.holdSec) : summary.reps),
        },
        { emoji: "🔥", label: "Calories", value: String(Math.round(summary.calories)) },
        { emoji: "⏱", label: "Duration", value: clock(Math.floor(summary.durationSec)) },
        { emoji: "📊", label: "Form", value: `${Math.round(summary.correctFormPct)}%` },
      ]
    : sessionStats;

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-none anim-fadeUp">
      <div className="pb-24">
        {/* Header */}
        <div className="pt-[58px] px-5 flex items-center justify-between">
          <button
            data-control-id="session-back-home"
            onClick={() => navigate("home")}
            className="w-[34px] h-[34px] bg-[#1c1c1c] rounded-full flex items-center justify-center"
          >
            <ChevronLeft size={16} color="#fff" />
          </button>
          <button data-control-id="session-active-home" onClick={() => navigate("home")} className="flex items-center gap-[7px]">
            <span className="w-2 h-2 rounded-full bg-green-active anim-dotPulse" />
            <span className="text-green-active text-[13px] font-semibold">Active Session</span>
          </button>
          <button data-control-id="session-finish-home" onClick={() => navigate("home")}>
            <span className="text-orange text-[15px] font-semibold">Finish</span>
          </button>
        </div>

        {/* Exercise header */}
        <div className="px-5 pt-[18px]">
          <div className="text-white text-[40px] font-black tracking-[-0.5px] leading-none">{exName}</div>
          <div className="flex items-center justify-between mt-[5px]">
            <span className="text-fit-muted text-[14px]">Set 1 of 1</span>
            <span className="text-fit-muted text-[14px]">
              {summary ? `${stats[0].value} ${stats[0].label.toLowerCase()}` : "12 / 15"}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-[6px] bg-[#1c1c1c] rounded-[3px] mt-[10px] overflow-hidden">
            <div
              className="h-full rounded-[3px]"
              style={{
                width: "80%",
                background: "linear-gradient(90deg,#C4F000,#9fcc00)",
                transition: "width .9s cubic-bezier(.25,.46,.45,.94)",
              }}
            />
          </div>
        </div>

        {/* Stats 2x2 */}
        <div className="flex flex-wrap gap-[10px] px-5 py-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-fit-card border border-fit-border rounded-2xl p-[15px] grow w-[47.5%]"
            >
              <div className="flex items-center gap-[6px] mb-[7px]">
                <span className="text-[15px]">{s.emoji}</span>
                <span className="text-fit-dim text-[10px] uppercase tracking-[.7px] font-semibold">{s.label}</span>
              </div>
              <div className="text-white text-[27px] font-extrabold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Recognized exercises */}
        <div className="px-5">
          <div className="text-fit-dim text-[11px] font-semibold uppercase tracking-[.8px] mb-[10px]">
            Recognized Exercises
          </div>

          {/* Current card */}
          <div
            className="rounded-2xl py-[14px] px-4 flex items-center justify-between mb-[9px] border"
            style={{
              background: "linear-gradient(135deg,#2e1600,#3e1e00)",
              borderColor: "rgba(229,82,10,0.25)",
            }}
          >
            <div>
              <div className="text-white text-[16px] font-bold">{exName}</div>
              <div className="text-orange text-[12px] font-semibold mt-[3px]">Current</div>
            </div>
            <div
              className="w-[54px] h-[54px] rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7a2200,#C94C00)" }}
            >
              <span className="text-[26px]">{summary ? EMOJI[summary.exerciseId] ?? "🏋️" : "🏋️"}</span>
            </div>
          </div>

          {/* Next card */}
          <div className="bg-fit-card border border-fit-border rounded-2xl py-[14px] px-4 flex items-center justify-between">
            <div>
              <div className="text-white text-[16px] font-bold">Push-up</div>
              <div className="text-fit-dim text-[12px] mt-[3px]">Next</div>
            </div>
            <div className="w-[54px] h-[54px] rounded-xl flex items-center justify-center bg-[#222]">
              <span className="text-[26px]">💪</span>
            </div>
          </div>
        </div>

        {/* Pause button */}
        <div className="px-5 pt-4">
          <button
            data-control-id="session-pause-home"
            onClick={() => navigate("home")}
            className="w-full h-[58px] bg-orange rounded-[18px] anim-orangeGlow flex items-center justify-center gap-[10px]"
          >
            <PauseIcon size={20} color="#fff" />
            <span className="text-white text-[17px] font-bold">Pause</span>
          </button>
        </div>
      </div>
    </div>
  );
}
