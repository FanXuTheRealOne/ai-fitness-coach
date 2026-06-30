import React from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { AppStateProvider, useApp } from "./state/appState";
import { PhoneShell } from "./components/PhoneShell";
import { StatusBar, DynamicIsland } from "./components/Chrome";
import { BottomNav } from "./components/BottomNav";
import { HomeScreen } from "./screens/HomeScreen";
import { CameraScreen } from "./screens/CameraScreen";
import { SessionScreen } from "./screens/SessionScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { LibraryScreen } from "./screens/LibraryScreen";

// Use Inter on web (loaded via global.css). Native falls back to the system font.
if (Platform.OS === "web") {
  const T = Text as any;
  T.defaultProps = T.defaultProps || {};
  T.defaultProps.style = [{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }];
}

function CurrentScreen() {
  const { screen } = useApp();
  switch (screen) {
    case "home":
      return <HomeScreen />;
    case "camera":
      return <CameraScreen />;
    case "session":
      return <SessionScreen />;
    case "history":
      return <HistoryScreen />;
    case "detail":
      return <DetailScreen />;
    case "library":
      return <LibraryScreen />;
  }
}

function AppContent() {
  const { screen } = useApp();
  const onCamera = screen === "camera";
  return (
    <View style={styles.fill}>
      <DynamicIsland recording={onCamera} />
      <StatusBar />
      <View style={styles.fill}>
        <CurrentScreen />
      </View>
      {!onCamera && <BottomNav />}
    </View>
  );
}

export default function Root() {
  return (
    <AppStateProvider>
      <ExpoStatusBar style="light" />
      <PhoneShell>
        <AppContent />
      </PhoneShell>
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, position: "relative" },
});
