import React from "react";

/**
 * 设备外壳：移动端（Eazo WebView）全屏；宽屏（浏览器）显示 iPhone 设备框 + 暖色背景，
 * 还原原型预览效果。视觉 1:1 复刻自原 RN 版。
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center sm:p-6"
      style={{ background: "linear-gradient(155deg,#1e0800 0%,#150600 45%,#0a0a00 100%)" }}
    >
      <div
        className="relative w-full h-[100dvh] bg-fit-bg overflow-hidden sm:w-[390px] sm:h-[844px] sm:rounded-[52px]"
        style={{ boxShadow: "0 0 0 1.5px #2a2a2a, 0 50px 120px rgba(0,0,0,.95), 0 0 80px rgba(229,82,10,.08)" }}
      >
        {children}
      </div>
    </div>
  );
}
