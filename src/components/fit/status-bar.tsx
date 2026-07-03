import React from "react";
import { SignalIcon, WifiIcon, BatteryIcon } from "./icons";

/** 模拟 iOS 状态栏（9:41 + 信号/Wi-Fi/电量）。 */
export function StatusBar() {
  return (
    <div className="absolute top-0 left-0 right-0 h-[54px] flex items-end justify-between px-7 pb-2 z-[150] pointer-events-none">
      <span className="text-white text-[15px] font-semibold">9:41</span>
      <div className="flex items-center gap-[5px]">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}
