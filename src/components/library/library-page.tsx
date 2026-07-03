"use client";
import React from "react";
import { useApp } from "@/components/fit/app-state";
import { exercises, type ExerciseCard } from "@/lib/fit/data";

function Card({ ex, onSelect }: { ex: ExerciseCard; onSelect?: () => void }) {
  const inner = (
    <>
      <span
        className="absolute top-[23%] left-1/2 -translate-x-1/2 opacity-[0.32] pointer-events-none leading-[64px]"
        style={{ fontSize: 58 }}
      >
        {ex.emoji}
      </span>
      <span
        className="relative z-10 font-bold text-center"
        style={{ color: ex.nameColor, fontSize: ex.nameSize }}
      >
        {ex.name}
      </span>
      {ex.soon && <span className="text-[#444] text-[11px] mt-[3px] text-center">Coming Soon</span>}
    </>
  );

  return (
    <button
      data-control-id="library-start-exercise"
      onClick={onSelect}
      disabled={ex.soon}
      className={`aspect-square rounded-[18px] relative overflow-hidden p-[14px] flex flex-col items-center justify-end ${
        ex.border ? "bg-[#111] border border-[#1e1e1e]" : ""
      }`}
      style={ex.border ? undefined : { background: `linear-gradient(145deg,${ex.gradient[0]},${ex.gradient[1]})` }}
    >
      {inner}
    </button>
  );
}

export function LibraryPage() {
  const { startCamera } = useApp();
  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-none anim-fadeUp">
      <div className="pt-[58px] px-5">
        <span className="block text-white text-[30px] font-extrabold">Exercise Library</span>
        <span className="block text-fit-dim text-[13px] mt-[5px] leading-[19px]">
          Choose an exercise or let AI detect it live.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pt-[18px] pb-24">
        {exercises.map((ex) => (
          <Card key={ex.name} ex={ex} onSelect={ex.soon ? undefined : startCamera} />
        ))}
      </div>
    </div>
  );
}
