import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

/**
 * Reusable animation primitives built on the RN Animated API (JS driver) so they
 * behave identically on web (react-native-web) and native iOS/Android — no
 * Reanimated worklets / babel plugins required for our own motion.
 */

// Generic infinite loop driver for a single 0->1 value.
function useLoopValue(duration: number, easing = Easing.inOut(Easing.ease)) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: duration / 2, easing, useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: duration / 2, easing, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return v;
}

/** Screen entrance: fadeUp (opacity 0->1, translateY 14->0). */
export function ScreenFade({
  children,
  style,
  translate = 14,
  duration = 350,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  translate?: number;
  duration?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start();
  }, [v, duration]);
  return (
    <Animated.View
      style={[
        { flex: 1, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [translate, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** dotPulse — scale 1->1.5, opacity 1->0.6. */
export function PulsingDot({
  size = 9,
  color,
  duration = 1000,
  style,
}: {
  size?: number;
  color: string;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useLoopValue(duration);
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
        },
        style,
      ]}
    />
  );
}

/**
 * GlowPulse — wraps a child and animates a colored glow (box-shadow on web,
 * shadow* on iOS). minRadius/maxRadius + opacities map to the handoff keyframes.
 */
export function GlowPulse({
  children,
  color,
  minRadius,
  maxRadius,
  minOpacity,
  maxOpacity,
  duration,
  style,
  offsetY = 0,
}: {
  children: React.ReactNode;
  color: string;
  minRadius: number;
  maxRadius: number;
  minOpacity: number;
  maxOpacity: number;
  duration: number;
  style?: StyleProp<ViewStyle>;
  offsetY?: number;
}) {
  const v = useLoopValue(duration);
  return (
    <Animated.View
      style={[
        {
          shadowColor: color,
          shadowOffset: { width: 0, height: offsetY },
          shadowRadius: v.interpolate({ inputRange: [0, 1], outputRange: [minRadius, maxRadius] }),
          shadowOpacity: v.interpolate({ inputRange: [0, 1], outputRange: [minOpacity, maxOpacity] }),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Steady (non-pulsing) glow halo. */
export function glowStyle(color: string, radius: number, opacity: number, offsetY = 0): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowRadius: radius,
    shadowOpacity: opacity,
  };
}
