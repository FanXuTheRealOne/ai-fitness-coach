import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/tokens";
import { ScreenFade, PulsingDot, GlowPulse } from "../components/anim";
import { ChevronLeft, PauseIcon } from "../components/Icons";
import { useApp, clock } from "../state/appState";
import { sessionStats } from "../data";
import { ExerciseSessionStats } from "../pose/SessionTracker";

const EMOJI: Record<string, string> = {
  squat: "🏋️",
  pushup: "💪",
  plank: "🤸",
  jumpingjack: "⭐",
  lunge: "🦵",
};

export function SessionScreen() {
  const { navigate, summary } = useApp();
  const exercises = summary?.exercises ?? [];
  const primary = exercises[0] ?? null;
  const exName = primary?.exerciseName ?? summary?.exerciseName ?? "Squat";
  const repOrHoldLabel = summary && summary.holdSec > summary.reps ? "Hold (s)" : "Reps";
  const repOrHoldValue = summary ? String(summary.holdSec > summary.reps ? Math.round(summary.holdSec) : summary.reps) : "0";
  const stats = summary
    ? [
        { emoji: "🔄", label: repOrHoldLabel, value: repOrHoldValue },
        { emoji: "🔥", label: "Calories", value: String(Math.round(summary.calories)) },
        { emoji: "⏱", label: "Duration", value: clock(Math.floor(summary.durationSec)) },
        { emoji: "📊", label: "Form", value: `${Math.round(summary.correctFormPct)}%` },
      ]
    : sessionStats;
  return (
    <ScreenFade duration={300} translate={0}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate("home")} style={styles.backBtn}>
            <ChevronLeft size={16} color="#fff" />
          </Pressable>
          <View style={styles.activeWrap}>
            <PulsingDot size={8} color={colors.greenActive} duration={1300} />
            <Text style={styles.activeText}>Active Session</Text>
          </View>
          <Pressable onPress={() => navigate("home")}>
            <Text style={styles.finish}>Finish</Text>
          </Pressable>
        </View>

        {/* Exercise header */}
        <View style={styles.exHeader}>
          <Text style={styles.exName}>{exName}</Text>
          <View style={styles.exMeta}>
            <Text style={styles.metaText}>Set 1 of 1</Text>
            <Text style={styles.metaText}>{summary ? `${stats[0].value} ${stats[0].label.toLowerCase()}` : "0 reps"}</Text>
          </View>
          <ProgressBar />
        </View>

        {/* Stats 2x2 */}
        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={styles.statTop}>
                <Text style={{ fontSize: 15 }}>{s.emoji}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Recognized exercises */}
        <View style={styles.recWrap}>
          <Text style={styles.recLabel}>Recognized Exercises</Text>
          {summary && exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No counted exercises</Text>
              <Text style={styles.emptyText}>Only movements with real reps or hold time appear here.</Text>
            </View>
          ) : (
            (summary ? exercises : []).map((exercise, index) => (
              <ExerciseCard key={exercise.exerciseId} exercise={exercise} primary={index === 0} />
            ))
          )}
        </View>

        {/* Pause button */}
        <View style={styles.pauseWrap}>
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
            <Pressable onPress={() => navigate("home")} style={styles.pauseInner}>
              <PauseIcon size={20} color="#fff" />
              <Text style={styles.pauseText}>Pause</Text>
            </Pressable>
          </GlowPulse>
        </View>
      </ScrollView>
    </ScreenFade>
  );
}

function ExerciseCard({ exercise, primary }: { exercise: ExerciseSessionStats; primary: boolean }) {
  const subtitle =
    exercise.holdSec > exercise.reps
      ? `${Math.round(exercise.holdSec)} sec · ${Math.round(exercise.correctFormPct)}% form`
      : `${exercise.reps} reps · ${Math.round(exercise.correctFormPct)}% form`;
  const card = (
    <>
      <View>
        <Text style={styles.exCardName}>{exercise.exerciseName}</Text>
        <Text style={primary ? styles.currentTag : styles.nextTag}>{subtitle}</Text>
      </View>
      <LinearGradient
        colors={primary ? ["#7a2200", "#C94C00"] : ["#252525", "#1c1c1c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.exThumb}
      >
        <Text style={{ fontSize: 26 }}>{EMOJI[exercise.exerciseId] ?? "🏋️"}</Text>
      </LinearGradient>
    </>
  );

  if (primary) {
    return (
      <LinearGradient colors={["#2e1600", "#3e1e00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.currentCard}>
        {card}
      </LinearGradient>
    );
  }
  return <View style={styles.exerciseCard}>{card}</View>;
}

function ProgressBar() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 900,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: false,
    }).start();
  }, [v]);
  const width = v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "80%"] });
  return (
    <View style={styles.track}>
      <Animated.View style={{ width, height: "100%" }}>
        <LinearGradient
          colors={[colors.lime, colors.limeDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 34, height: 34, backgroundColor: "#1c1c1c", borderRadius: 17, alignItems: "center", justifyContent: "center" },
  activeWrap: { flexDirection: "row", alignItems: "center", gap: 7 },
  activeText: { color: colors.greenActive, fontSize: 13, fontWeight: "600" },
  finish: { color: colors.orange, fontSize: 15, fontWeight: "600" },

  exHeader: { paddingHorizontal: 20, paddingTop: 18 },
  exName: { color: "#fff", fontSize: 40, fontWeight: "900", letterSpacing: -0.5 },
  exMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5 },
  metaText: { color: colors.textMuted, fontSize: 14 },
  track: { height: 6, backgroundColor: "#1c1c1c", borderRadius: 3, marginTop: 10, overflow: "hidden" },
  fill: { flex: 1, borderRadius: 3 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  statCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    width: "47.5%",
    flexGrow: 1,
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  statLabel: { color: colors.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: "600" },
  statValue: { color: "#fff", fontSize: 27, fontWeight: "800" },

  recWrap: { paddingHorizontal: 20 },
  recLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  currentCard: {
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "rgba(229,82,10,0.25)",
  },
  exerciseCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.bgBorder,
  },
  exCardName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  currentTag: { color: colors.orange, fontSize: 12, fontWeight: "600", marginTop: 3 },
  nextTag: { color: colors.textDim, fontSize: 12, marginTop: 3 },
  exThumb: { width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.bgBorder,
  },
  emptyTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  emptyText: { color: colors.textDim, fontSize: 12, marginTop: 4 },

  pauseWrap: { paddingHorizontal: 20, paddingTop: 16 },
  pauseBtn: { borderRadius: 18, height: 58, backgroundColor: colors.orange },
  pauseInner: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  pauseText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
