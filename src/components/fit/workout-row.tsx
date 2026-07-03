import React from "react";
import { ChevronRight } from "./icons";

/** Home / History 共用的训练记录行。 */
export function WorkoutRow({
  emoji,
  name,
  detail,
  time,
  onSelect,
  controlId,
  detailColor = "#4a4a4a",
  timeSize = 12,
}: {
  emoji: string;
  name: string;
  detail: string;
  time: string;
  onSelect?: () => void;
  controlId: string;
  detailColor?: string;
  timeSize?: number;
}) {
  const content = (
    <>
      <div
        className="w-[54px] h-[54px] rounded-xl flex items-center justify-center text-[26px] shrink-0"
        style={{ background: "linear-gradient(135deg,#7a2200,#C94C00)" }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-[15px] font-semibold">{name}</div>
        <div className="text-[12px] mt-[3px]" style={{ color: detailColor }}>
          {detail}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[5px] shrink-0">
        <span className="text-fit-muted" style={{ fontSize: timeSize }}>
          {time}
        </span>
        <ChevronRight size={14} color="#333" />
      </div>
    </>
  );
  const className = "w-full flex items-center gap-3 rounded-2xl bg-fit-card border border-fit-border p-[13px] text-left mb-[9px]";
  if (controlId === "history-open-detail") {
    return (
      <button data-control-id="history-open-detail" onClick={onSelect} className={className}>
        {content}
      </button>
    );
  }
  return (
    <button data-control-id="home-open-workout-detail" onClick={onSelect} className={className}>
      {content}
    </button>
  );
}
