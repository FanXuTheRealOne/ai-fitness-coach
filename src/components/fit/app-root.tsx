"use client";
import React from "react";
import { AppStateProvider, useApp } from "./app-state";
import { PhoneShell } from "./phone-shell";
import { StatusBar } from "./status-bar";
import { DynamicIsland } from "./dynamic-island";
import { BottomNav } from "./bottom-nav";
import { HomePage } from "@/components/home/home-page";
import { CameraPage } from "@/components/camera/camera-page";
import { SessionPage } from "@/components/session/session-page";
import { HistoryPage } from "@/components/history/history-page";
import { DetailPage } from "@/components/detail/detail-page";
import { LibraryPage } from "@/components/library/library-page";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

function Screens() {
  const { screen } = useApp();
  switch (screen) {
    case "home":
      return <HomePage />;
    case "camera":
      return <CameraPage />;
    case "session":
      return <SessionPage />;
    case "history":
      return <HistoryPage />;
    case "detail":
      return <DetailPage />;
    case "library":
      return <LibraryPage />;
    default:
      return null;
  }
}

function Shell() {
  const { screen } = useApp();
  const onCamera = screen === "camera";
  return (
    <PhoneShell>
      <div className="absolute right-4 top-[52px] z-[150]">
        <LanguageSwitcher />
      </div>
      <DynamicIsland recording={onCamera} />
      <StatusBar />
      <Screens />
      {!onCamera && <BottomNav />}
    </PhoneShell>
  );
}

export function AppRoot() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
