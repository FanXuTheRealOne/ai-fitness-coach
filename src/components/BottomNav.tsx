import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";
import { GlowPulse } from "./anim";
import { HomeIcon, HistoryIcon, LibraryIcon, StatsIcon, CameraIcon } from "./Icons";
import { Screen, useApp } from "../state/appState";

function NavItem({
  label,
  active,
  onPress,
  Icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  const color = active ? colors.lime : colors.navInactive;
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Icon size={23} color={color} />
      <Text style={[styles.label, { color, fontWeight: active ? "700" : "400" }]}>{label}</Text>
    </Pressable>
  );
}

export function BottomNav() {
  const { screen, navigate, startCamera } = useApp();
  const is = (s: Screen) => screen === s;
  return (
    <View style={styles.bar}>
      <NavItem label="Home" active={is("home")} onPress={() => navigate("home")} Icon={HomeIcon} />
      <NavItem label="History" active={is("history")} onPress={() => navigate("history")} Icon={HistoryIcon} />

      {/* Center elevated camera button */}
      <Pressable onPress={startCamera} style={styles.centerItem}>
        <GlowPulse
          color={colors.lime}
          minRadius={14}
          maxRadius={32}
          minOpacity={0.3}
          maxOpacity={0.7}
          duration={2500}
          style={styles.camBtn}
        >
          <CameraIcon size={24} color={colors.bgPrimary} />
        </GlowPulse>
      </Pressable>

      <NavItem label="Library" active={is("library")} onPress={() => navigate("library")} Icon={LibraryIcon} />
      {/* Stats routes home, matching the prototype */}
      <NavItem label="Stats" active={false} onPress={() => navigate("home")} Icon={StatsIcon} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: 10,
    zIndex: 100,
  },
  item: { alignItems: "center", gap: 4, minWidth: 56, paddingTop: 2 },
  centerItem: { alignItems: "center", minWidth: 56, marginTop: -10 },
  camBtn: {
    width: 54,
    height: 54,
    backgroundColor: colors.lime,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 10 },
});
