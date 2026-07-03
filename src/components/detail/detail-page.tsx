"use client";
import React from "react";
import { useApp, clock } from "@/components/fit/app-state";
import { ChevronLeft, ShareIcon } from "@/components/fit/icons";
import { colors } from "@/lib/theme/colors";

const LINE_POINTS =
  "18,82 44,74 68,60 92,56 114,42 136,36 155,46 168,30 190,38 210,34 232,52 252,44 272,58 292,50 316,56 336,62";

const EMOJI: Record<string, string> = {
  squat: "🏋️",
  pushup: "💪",
  plank: "🤸",
  jumpingjack: "⭐",
  lunge: "🦵",
};

// 把每个 rep 的质量分（0..1）映射成图表折线点（viewBox 0..338 × 0..108）。
function buildPoints(q: number[]): string {
  const x0 = 18,
    x1 = 336,
    yTop = 8,
    yBot = 96;
  const n = q.length;
  return q
    .map((v, i) => {
      const x = n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1);
      const y = yTop + (1 - Math.max(0, Math.min(1, v))) * (yBot - yTop);
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    })
    .join(" ");
}

export function DetailPage() {
  const { navigate, summary } = useApp();
  const exName = summary?.exerciseName ?? "Squat";
  const reps = summary?.reps ?? 45;
  const durationSec = summary ? Math.floor(summary.durationSec) : 372;
  const calories = summary ? Math.round(summary.calories) : 132;
  const avgRpm = summary && summary.durationSec > 0 ? summary.reps / (summary.durationSec / 60) : 7.2;
  const formPct = summary ? Math.round(summary.correctFormPct) : 78;
  const emoji = summary ? EMOJI[summary.exerciseId] ?? "🏋️" : "🏋️";
  const chartPoints =
    summary && summary.repQualities.length >= 2 ? buildPoints(summary.repQualities) : LINE_POINTS;
  const repBarPct = summary ? Math.max(10, Math.min(100, Math.round((reps / 20) * 100))) : 90;

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-none anim-fadeUp">
      <div className="pb-24">
        {/* Header */}
        <div className="pt-[58px] px-5 flex items-center justify-between">
          <button
            data-control-id="detail-back-history"
            onClick={() => navigate("history")}
            className="w-[34px] h-[34px] bg-[#1c1c1c] rounded-full flex items-center justify-center"
          >
            <ChevronLeft size={16} color="#fff" />
          </button>
          <span className="text-fit-dim text-[13px]">May 16, 2025 · 9:15 AM</span>
          <ShareIcon size={22} color={colors.textDim} />
        </div>

        {/* Orange summary card */}
        <div
          className="m-[14px] mx-4 rounded-[22px] p-[22px] relative overflow-hidden flex items-start justify-between"
          style={{ background: "linear-gradient(135deg,#BF4200,#E5520A)" }}
        >
          <span
            className="absolute right-[-6px] top-[-4px] text-[110px] opacity-[.12]"
            style={{ lineHeight: "110px" }}
          >
            {emoji}
          </span>
          <div>
            <div className="text-white/60 text-[14px] font-medium mb-[3px]">{exName}</div>
            <div className="text-white text-[68px] font-black leading-[68px]">{reps}</div>
            <div className="text-white/60 text-[13px] mt-[2px]">Total Reps</div>
          </div>
          <div className="flex flex-col items-end gap-[14px]">
            <SummaryStat label="Duration" value={clock(durationSec)} />
            <SummaryStat label="Calories" value={String(calories)} />
            <SummaryStat label="Avg Reps/Min" value={avgRpm.toFixed(1)} />
          </div>
        </div>

        {/* Performance chart */}
        <div className="mx-4 mb-[14px] bg-fit-card border border-fit-border rounded-[18px] p-[18px]">
          <div className="text-white text-[16px] font-bold mb-[14px]">Performance</div>
          <svg viewBox="0 0 338 108" width="100%" height={108}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4F000" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C4F000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <line x1="18" y1="8" x2="336" y2="8" stroke="#222" strokeWidth={1} />
            <line x1="18" y1="52" x2="336" y2="52" stroke="#222" strokeWidth={1} />
            <line x1="18" y1="96" x2="336" y2="96" stroke="#222" strokeWidth={1} />
            <text x="2" y="12" fill="#3a3a3a" fontSize="9">
              15
            </text>
            <text x="4" y="56" fill="#3a3a3a" fontSize="9">
              8
            </text>
            <text x="4" y="100" fill="#3a3a3a" fontSize="9">
              0
            </text>
            <polygon points={`${chartPoints} 336,96 18,96`} fill="url(#cg)" />
            <polyline
              points={chartPoints}
              fill="none"
              stroke="#C4F000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {!summary && (
              <>
                <rect x="138" y="14" width="62" height="20" rx="6" fill="#1e1e1e" stroke="#C4F000" strokeWidth={1} />
                <text x="169" y="28" fill="#C4F000" fontSize="9.5" textAnchor="middle" fontWeight="700">
                  Max Reps 12
                </text>
                <circle cx="168" cy="30" r="4" fill="#C4F000" />
              </>
            )}
            <text x="18" y="106" fill="#3a3a3a" fontSize="9">
              0:00
            </text>
            <text x="100" y="106" fill="#3a3a3a" fontSize="9">
              1:30
            </text>
            <text x="196" y="106" fill="#3a3a3a" fontSize="9">
              3:00
            </text>
            <text x="278" y="106" fill="#3a3a3a" fontSize="9">
              4:30
            </text>
          </svg>
        </div>

        {/* Exercise breakdown */}
        <div className="mx-4 mb-24 bg-fit-card border border-fit-border rounded-[18px] p-[18px]">
          <div className="text-white text-[16px] font-bold mb-4">Exercise Breakdown</div>
          <Bar
            name={exName}
            right={`${reps} reps`}
            rightColor="#666"
            width={`${repBarPct}%`}
            gradient={[colors.lime, colors.limeDark]}
          />
          <div className="h-4" />
          <Bar
            name="Correct Form"
            right={`${formPct}%`}
            rightColor={colors.orange}
            rightBold
            width={`${formPct}%`}
            gradient={[colors.orange, colors.orangeDark]}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/50 text-[11px] text-right">{label}</div>
      <div className="text-white text-[18px] font-bold text-right">{value}</div>
    </div>
  );
}

function Bar({
  name,
  right,
  rightColor,
  rightBold,
  width,
  gradient,
}: {
  name: string;
  right: string;
  rightColor: string;
  rightBold?: boolean;
  width: string;
  gradient: [string, string];
}) {
  return (
    <div>
      <div className="flex justify-between mb-[7px]">
        <span className="text-white text-[14px] font-semibold">{name}</span>
        <span className="text-[13px]" style={{ color: rightColor, fontWeight: rightBold ? 700 : 400 }}>
          {right}
        </span>
      </div>
      <div className="h-[5px] bg-[#222] rounded-[3px] overflow-hidden">
        <div
          className="h-full rounded-[3px]"
          style={{ width, background: `linear-gradient(90deg,${gradient[0]},${gradient[1]})` }}
        />
      </div>
    </div>
  );
}
