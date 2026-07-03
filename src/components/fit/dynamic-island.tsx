import React from "react";

/** 灵动岛；录制时显示 REC。 */
export function DynamicIsland({ recording }: { recording: boolean }) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[20px] z-[200] flex items-center justify-center gap-2 pointer-events-none">
      {recording && (
        <>
          <span className="w-[10px] h-[10px] rounded-full bg-orange anim-dotPulse" />
          <span className="text-white/45 text-[11px] font-medium tracking-[.5px]">REC</span>
        </>
      )}
    </div>
  );
}
