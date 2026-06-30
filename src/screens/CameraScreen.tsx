import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing, LayoutChangeEvent } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Line,
  G,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
} from "react-native-svg";
import { colors } from "../theme/tokens";
import { PulsingDot, GlowPulse } from "../components/anim";
import { CloseIcon, BoltIcon, VolumeIcon, PauseIcon, PlayIcon } from "../components/Icons";
import { useApp, clock } from "../state/appState";

export function CameraScreen() {
  const { reps, isPaused, elapsed, navigate, togglePause } = useApp();
  const [h, setH] = useState(844);

  const onLayout = (e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height);

  return (
    <View style={styles.root} onLayout={onLayout}>
      {/* Camera feed background (radial gradient) */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg" cx="55%" cy="42%" rx="75%" ry="75%">
            <Stop offset="0%" stopColor="#151508" />
            <Stop offset="68%" stopColor="#040404" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
      </Svg>

      <ScanLine containerHeight={h} />

      {/* Corner guides */}
      <View style={[styles.corner, styles.cTL]} />
      <View style={[styles.corner, styles.cTR]} />
      <View style={[styles.corner, styles.cBL]} />
      <View style={[styles.corner, styles.cBR]} />

      <Skeleton />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigate("session")} style={styles.roundBtn}>
          <CloseIcon size={18} color="#fff" />
        </Pressable>
        <Text style={styles.timer}>{clock(elapsed)}</Text>
        <View style={styles.roundBtn}>
          <BoltIcon size={18} color="#fff" />
        </View>
      </View>

      {/* Detection badge */}
      <View style={styles.badge}>
        <PulsingDot size={9} color={colors.lime} duration={1000} />
        <Text style={styles.badgeName}>SQUAT</Text>
        <Text style={styles.badgeConf}>
          Confidence <Text style={{ color: "#ccc" }}>92%</Text>
        </Text>
      </View>

      {/* Rep counter */}
      <View style={styles.repWrap}>
        <RepCounter reps={reps} />
        <Text style={styles.repsLabel}>REPS</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={{ width: 38 }} />
        <GlowPulse
          color={colors.orange}
          minRadius={28}
          maxRadius={42}
          minOpacity={0.45}
          maxOpacity={0.8}
          duration={2000}
          offsetY={6}
          style={styles.pauseBtn}
        >
          <Pressable onPress={togglePause} style={styles.pauseInner}>
            {isPaused ? <PlayIcon size={28} color="#fff" /> : <PauseIcon size={28} color="#fff" />}
          </Pressable>
        </GlowPulse>
        <View style={styles.volBtn}>
          <VolumeIcon size={18} color="#fff" />
        </View>
      </View>
    </View>
  );
}

/** Animated scan line travelling 8% -> 92% of the screen height, looping. */
function ScanLine({ containerHeight }: { containerHeight: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [containerHeight * 0.08, containerHeight * 0.92],
  });
  return (
    <Animated.View style={[styles.scanLine, { opacity: 0.5, transform: [{ translateY }] }]}>
      <Svg width="100%" height={2}>
        <Defs>
          <RadialGradient id="sl" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(196,240,0,0.7)" />
            <Stop offset="100%" stopColor="rgba(196,240,0,0)" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={2} fill="rgba(196,240,0,0.7)" />
      </Svg>
    </Animated.View>
  );
}

/** Rep counter that pops (scale 1 -> 1.22 -> 1) whenever the value changes. */
function RepCounter({ reps }: { reps: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.22,
        duration: 158,
        easing: Easing.bezier(0.36, 0.07, 0.19, 0.97),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 292,
        easing: Easing.bezier(0.36, 0.07, 0.19, 0.97),
        useNativeDriver: true,
      }),
    ]).start();
  }, [reps, scale]);
  return <Animated.Text style={[styles.repNum, { transform: [{ scale }] }]}>{reps}</Animated.Text>;
}

/** Pose skeleton (static squat pose from the handoff) with a pulsing lime glow. */
function Skeleton() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  const W = 230;
  const H = (W * 580) / 300;
  return (
    <View style={styles.skelWrap} pointerEvents="none">
      <Animated.View
        style={{
          shadowColor: colors.lime,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: v.interpolate({ inputRange: [0, 1], outputRange: [5, 18] }),
          shadowOpacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
        }}
      >
        <Svg width={W} height={H} viewBox="0 0 300 580">
          <Defs>
            <Filter id="jg">
              <FeGaussianBlur stdDeviation="3" result="b" />
              <FeMerge>
                <FeMergeNode in="b" />
                <FeMergeNode in="SourceGraphic" />
              </FeMerge>
            </Filter>
          </Defs>
          <G filter="url(#jg)" stroke={colors.lime} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.92}>
            <Circle cx={150} cy={62} r={30} />
            <Line x1={150} y1={92} x2={150} y2={122} />
            <Line x1={150} y1={122} x2={147} y2={250} />
            <Line x1={150} y1={116} x2={100} y2={148} />
            <Line x1={150} y1={116} x2={200} y2={148} />
            <Line x1={100} y1={148} x2={68} y2={196} />
            <Line x1={68} y1={196} x2={40} y2={165} />
            <Line x1={200} y1={148} x2={235} y2={193} />
            <Line x1={235} y1={193} x2={260} y2={162} />
            <Line x1={147} y1={250} x2={110} y2={265} />
            <Line x1={147} y1={250} x2={186} y2={265} />
            <Line x1={110} y1={265} x2={82} y2={365} />
            <Line x1={82} y1={365} x2={76} y2={460} />
            <Line x1={186} y1={265} x2={216} y2={362} />
            <Line x1={216} y1={362} x2={222} y2={456} />
          </G>
          <G filter="url(#jg)" fill={colors.lime}>
            <Circle cx={100} cy={148} r={7} />
            <Circle cx={200} cy={148} r={7} />
            <Circle cx={68} cy={196} r={6} />
            <Circle cx={235} cy={193} r={6} />
            <Circle cx={40} cy={165} r={5} />
            <Circle cx={260} cy={162} r={5} />
            <Circle cx={147} cy={250} r={8} />
            <Circle cx={110} cy={265} r={7} />
            <Circle cx={186} cy={265} r={7} />
            <Circle cx={82} cy={365} r={9} />
            <Circle cx={216} cy={362} r={9} />
            <Circle cx={76} cy={460} r={6} />
            <Circle cx={222} cy={456} r={6} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#040404", overflow: "hidden" },
  scanLine: { position: "absolute", left: 0, right: 0, top: 0, height: 2, zIndex: 5 },

  corner: { position: "absolute", width: 28, height: 28, borderColor: "rgba(196,240,0,0.4)" },
  cTL: { top: 70, left: 24, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  cTR: { top: 70, right: 24, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  cBL: { bottom: 155, left: 24, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  cBR: { bottom: 155, right: 24, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },

  skelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },

  topBar: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  roundBtn: {
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  timer: { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: 2 },

  badge: {
    position: "absolute",
    top: 108,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 30,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(196,240,0,0.25)",
  },
  badgeName: { color: colors.lime, fontSize: 14, fontWeight: "700", letterSpacing: 1.2 },
  badgeConf: { color: colors.textDim, fontSize: 12, marginLeft: 6 },

  repWrap: { position: "absolute", bottom: 148, left: 0, right: 0, alignItems: "center", zIndex: 10 },
  repNum: { color: "#fff", fontSize: 108, fontWeight: "900", lineHeight: 112 },
  repsLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 4, marginTop: -2 },

  controls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    zIndex: 10,
  },
  pauseBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange },
  pauseInner: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  volBtn: {
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
