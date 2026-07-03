import React from "react";

/** 迁移过渡用占位画面（其余 5 个画面将在后续阶段 1:1 迁移）。 */
export function PlaceholderScreen({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 anim-fadeIn">
      <span className="text-lime text-[15px] font-bold uppercase tracking-[2px]">{name}</span>
      <span className="text-fit-muted text-[13px]">画面迁移中…</span>
    </div>
  );
}
