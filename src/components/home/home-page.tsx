"use client";
import React from "react";
import { useApp } from "@/components/fit/app-state";
import { CameraIcon } from "@/components/fit/icons";
import { WorkoutRow } from "@/components/fit/workout-row";
import { recentWorkouts } from "@/lib/fit/data";

function Stat({ label, value, valueClass = "text-white" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="text-center">
      <div className="text-fit-placeholder text-[10px] uppercase tracking-[.6px] mb-[5px]">{label}</div>
      <div className={`text-[30px] font-extrabold leading-none ${valueClass}`}>{value}</div>
    </div>
  );
}

export function HomePage() {
  const { startCamera, navigate } = useApp();
  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-none anim-fadeUp">
      {/* Hero */}
      <div className="h-[268px] relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-athlete.webp" alt="hero" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.05) 100%)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: "linear-gradient(to top,#0c0c0c,transparent)" }}
        />
        <div className="absolute left-[22px] bottom-7 right-0">
          <h1
            className="text-[30px] font-extrabold leading-[1.18] text-white"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,.6)" }}
          >
            Track every
            <br />
            rep. See
            <br />
            <span className="text-lime italic">real results.</span>
          </h1>
        </div>
      </div>

      {/* Camera CTA */}
      <button
        data-control-id="home-start-camera"
        onClick={startCamera}
        className="mx-4 my-[14px] w-[calc(100%-2rem)] bg-fit-card border border-fit-border-subtle rounded-[18px] px-[18px] py-4 flex items-center justify-between"
      >
        <div className="text-left">
          <div className="text-white text-[16px] font-bold">Start Camera Detection</div>
          <div className="text-fit-placeholder text-[13px] mt-[3px]">Point your camera at yourself</div>
        </div>
        <span className="w-[46px] h-[46px] bg-lime rounded-full flex items-center justify-center shrink-0 anim-limePulse">
          <CameraIcon size={22} color="#0c0c0c" />
        </span>
      </button>

      {/* Today's Activity */}
      <div className="px-4 pt-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-[17px] font-bold">Today&apos;s Activity</span>
          <span className="text-orange text-[13px] font-semibold">View all</span>
        </div>
        <div className="bg-fit-card border border-fit-border rounded-[18px] py-[18px] px-2 flex justify-around items-center">
          <Stat label="Workouts" value="3" />
          <div className="w-px h-9 bg-[#252525]" />
          <Stat label="Total Reps" value="125" />
          <div className="w-px h-9 bg-[#252525]" />
          <Stat label="Calories" value="512" valueClass="text-orange" />
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="px-4 pt-[18px] pb-24">
        <div className="text-white text-[17px] font-bold mb-3">Recent Workouts</div>
        {recentWorkouts.map((w) => (
          <WorkoutRow key={w.name} {...w} controlId="home-open-workout-detail" onSelect={() => navigate("detail")} />
        ))}
      </div>
    </div>
  );
}
