"use client";
import React from "react";
import { useApp, Screen } from "./app-state";
import { HomeIcon, HistoryIcon, LibraryIcon, StatsIcon, CameraIcon } from "./icons";

const LIME = "#C4F000";
const INACTIVE = "#383838";

function NavItem({
  label,
  active,
  onSelect,
  Icon,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  const color = active ? LIME : INACTIVE;
  const content = (
    <>
      <Icon size={23} color={color} />
      <span className="text-[10px]" style={{ color, fontWeight: active ? 700 : 400 }}>
        {label}
      </span>
    </>
  );
  const className = "flex flex-col items-center gap-1 min-w-[56px] pt-[2px]";
  if (label === "Home") {
    return (
      <button data-control-id="nav-home" onClick={onSelect} className={className}>
        {content}
      </button>
    );
  }
  if (label === "History") {
    return (
      <button data-control-id="nav-history" onClick={onSelect} className={className}>
        {content}
      </button>
    );
  }
  if (label === "Library") {
    return (
      <button data-control-id="nav-library" onClick={onSelect} className={className}>
        {content}
      </button>
    );
  }
  return (
    <button data-control-id="nav-stats" onClick={onSelect} className={className}>
      {content}
    </button>
  );
}

export function BottomNav() {
  const { screen, navigate, startCamera } = useApp();
  const is = (s: Screen) => screen === s;
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[84px] bg-fit-bg border-t border-[#1a1a1a] flex items-start justify-around pt-[10px] z-[100]">
      <NavItem label="Home" active={is("home")} onSelect={() => navigate("home")} Icon={HomeIcon} />
      <NavItem label="History" active={is("history")} onSelect={() => navigate("history")} Icon={HistoryIcon} />
      <button data-control-id="nav-camera" onClick={startCamera} className="flex flex-col items-center min-w-[56px] -mt-[10px]">
        <span className="w-[54px] h-[54px] bg-lime rounded-full flex items-center justify-center anim-limePulse">
          <CameraIcon size={24} color="#0c0c0c" />
        </span>
      </button>
      <NavItem label="Library" active={is("library")} onSelect={() => navigate("library")} Icon={LibraryIcon} />
      <NavItem label="Stats" active={false} onSelect={() => navigate("home")} Icon={StatsIcon} />
    </div>
  );
}
