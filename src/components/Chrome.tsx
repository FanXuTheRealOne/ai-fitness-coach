import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";
import { PulsingDot } from "./anim";
import { SignalIcon, WifiIcon, BatteryIcon } from "./Icons";

/** Notch / dynamic island. Shows a REC pill while the camera is active. */
export function DynamicIsland({ recording }: { recording: boolean }) {
  return (
    <View style={styles.island} pointerEvents="none">
      {recording && (
        <>
          <PulsingDot size={10} color={colors.orange} duration={1100} />
          <Text style={styles.rec}>REC</Text>
        </>
      )}
    </View>
  );
}

/** iOS status bar (time + signal/wifi/battery). */
export function StatusBar() {
  return (
    <View style={styles.statusBar} pointerEvents="none">
      <Text style={styles.time}>9:41</Text>
      <View style={styles.glyphs}>
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  island: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    width: 126,
    height: 37,
    backgroundColor: "#000",
    borderRadius: 20,
    zIndex: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rec: { color: "rgba(255,255,255,.45)", fontSize: 11, fontWeight: "500", letterSpacing: 0.5 },
  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 54,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingBottom: 8,
    zIndex: 150,
  },
  time: { color: "#fff", fontSize: 15, fontWeight: "600" },
  glyphs: { flexDirection: "row", alignItems: "center", gap: 5 },
});
