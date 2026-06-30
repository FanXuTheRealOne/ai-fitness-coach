import React from "react";
import { View, Platform, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, PHONE } from "../theme/tokens";

/**
 * On web we render the design inside an iPhone-style device frame on a warm
 * gradient backdrop (matching the handoff prototype). On native iOS/Android the
 * content simply fills the screen.
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const isWeb = Platform.OS === "web";
  const { height } = useWindowDimensions();

  if (!isWeb) {
    return <View style={styles.native}>{children}</View>;
  }

  // Scale the frame down if the viewport is shorter than the device.
  const frameHeight = Math.min(PHONE.height, height - 48);
  const scale = frameHeight / PHONE.height;

  return (
    <LinearGradient
      colors={["#1e0800", "#150600", "#0a0a00"]}
      locations={[0, 0.45, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.backdrop}
    >
      <View
        style={[
          styles.frame,
          {
            width: PHONE.width,
            height: PHONE.height,
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  native: { flex: 1, backgroundColor: colors.bgPrimary },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  frame: {
    backgroundColor: colors.bgPrimary,
    borderRadius: PHONE.radius,
    overflow: "hidden",
    position: "relative",
    // Phone shell shadow / ring
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 50 },
    shadowOpacity: 0.95,
    shadowRadius: 120,
  },
});
