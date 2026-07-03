"use client";
import React from "react";
import { useApp } from "@/components/fit/app-state";
import { CalendarIcon } from "@/components/fit/icons";
import { WorkoutRow } from "@/components/fit/workout-row";
import { historyItems, filters } from "@/lib/fit/data";

function FilterPill({
  filter,
  active,
  onSelect,
}: {
  filter: string;
  active: boolean;
  onSelect: () => void;
}) {
  const className = `shrink-0 py-2 px-[20px] rounded-[20px] text-[14px] font-semibold ${
    active ? "bg-lime text-fit-bg" : "bg-fit-card text-fit-muted border border-fit-border-subtle"
  }`;
  if (filter === "Strength") return <button data-control-id="history-filter-strength" onClick={onSelect} className={className}>{filter}</button>;
  if (filter === "Cardio") return <button data-control-id="history-filter-cardio" onClick={onSelect} className={className}>{filter}</button>;
  if (filter === "Mobility") return <button data-control-id="history-filter-mobility" onClick={onSelect} className={className}>{filter}</button>;
  return <button data-control-id="history-filter-all" onClick={onSelect} className={className}>{filter}</button>;
}

export function HistoryPage() {
  const { navigate, selectedFilter, setFilter } = useApp();
  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-none anim-fadeUp">
      <div className="pb-24">
        {/* Title */}
        <div className="pt-[58px] px-[20px] pb-4 flex items-center justify-between">
          <span className="text-white text-[32px] font-extrabold">History</span>
          <CalendarIcon size={22} color="#444" />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-[20px] pb-[18px] overflow-x-auto scrollbar-none">
          {filters.map((f) => {
            const active = f === selectedFilter;
            return (
              <FilterPill key={f} filter={f} active={active} onSelect={() => setFilter(f)} />
            );
          })}
        </div>

        {/* Week label */}
        <div className="px-[20px] pb-[10px] text-fit-dim text-[11px] font-semibold uppercase tracking-[0.8px]">
          This Week
        </div>

        {/* History list */}
        <div className="px-[20px]">
          {historyItems.map((h) => (
            <WorkoutRow
              key={h.name}
              {...h}
              detailColor="#444"
              timeSize={11}
              controlId="history-open-detail"
              onSelect={() => navigate("detail")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
