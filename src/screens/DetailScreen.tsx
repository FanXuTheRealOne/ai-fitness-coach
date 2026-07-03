import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Polygon,
  Polyline,
  Rect,
  Circle,
  Text as SvgText,
} from "react-native-svg";
import { colors } from "../theme/tokens";
import { ScreenFade } from "../components/anim";
import { ChevronLeft, ShareIcon } from "../components/Icons";
import { useApp, clock } from "../state/appState";

const LINE_POINTS =
  "18,82 44,74 68,60 92,56 114,42 136,36 155,46 168,30 190,38 210,34 232,52 252,44 272,58 292,50 316,56 336,62";

const EMOJI: Record<string, string> = {
  squat: "🏋️",
  pushup: "💪",
  plank: "🤸",
  jumpingjack: "⭐",
  lunge: "🦵",
};

// 把每个 rep 的质量分（0..1）映射成图表折线点（viewBox 0..338 × 0..108）。
function buildPoints(q: number[]): string {
  const x0 = 18,
    x1 = 336,
    yTop = 8,
    yBot = 96;
  const n = q.length;
  return q
    .map((v, i) => {
      const x = n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1);
      const y = yTop + (1 - Math.max(0, Math.min(1, v))) * (yBot - yTop);
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    })
    .join(" ");
}

export function DetailScreen() {
  const { navigate, summary } = useApp();
  const exercises = summary?.exercises ?? [];
  const primary = exercises[0] ?? null;
  const exName = primary?.exerciseName ?? summary?.exerciseName ?? "Squat";
  const reps = primary?.reps ?? summary?.reps ?? 45;
  const durationSec = summary ? Math.floor(summary.durationSec) : 372;
  const calories = summary ? Math.round(summary.calories) : 132;
  const avgRpm = summary && summary.durationSec > 0 ? summary.reps / (summary.durationSec / 60) : 7.2;
  const formPct = summary ? Math.round(summary.correctFormPct) : 78;
  const emoji = summary ? EMOJI[primary?.exerciseId ?? summary.exerciseId] ?? "🏋️" : "🏋️";
  const chartPoints = summary && summary.repQualities.length >= 2 ? buildPoints(summary.repQualities) : LINE_POINTS;
  const repBarPct = summary ? Math.max(10, Math.min(100, Math.round((reps / 20) * 100))) : 90;
  const totalWork = exercises.reduce((sum, ex) => sum + ex.reps + ex.holdSec, 0);
  return (
    <ScreenFade duration={300} translate={0}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate("history")} style={styles.backBtn}>
            <ChevronLeft size={16} color="#fff" />
          </Pressable>
          <Text style={styles.date}>May 16, 2025 · 9:15 AM</Text>
          <ShareIcon size={22} color={colors.textDim} />
        </View>

        {/* Orange summary card */}
        <LinearGradient
          colors={["#BF4200", "#E5520A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summary}
        >
          <Text style={styles.bigEmoji}>{emoji}</Text>
          <View>
            <Text style={styles.sumLabel}>{exName}</Text>
            <Text style={styles.bigNum}>{reps}</Text>
            <Text style={styles.sumSub}>Total Reps</Text>
          </View>
          <View style={styles.sumRight}>
            <SummaryStat label="Duration" value={clock(durationSec)} />
            <SummaryStat label="Calories" value={String(calories)} />
            <SummaryStat label="Avg Reps/Min" value={avgRpm.toFixed(1)} />
          </View>
        </LinearGradient>

        {/* Performance chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Performance</Text>
          <Svg viewBox="0 0 338 108" width="100%" height={108}>
            <Defs>
              <SvgLinearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#C4F000" stopOpacity={0.35} />
                <Stop offset="100%" stopColor="#C4F000" stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            <Line x1="18" y1="8" x2="336" y2="8" stroke="#222" strokeWidth={1} />
            <Line x1="18" y1="52" x2="336" y2="52" stroke="#222" strokeWidth={1} />
            <Line x1="18" y1="96" x2="336" y2="96" stroke="#222" strokeWidth={1} />
            <SvgText x="2" y="12" fill="#3a3a3a" fontSize="9">15</SvgText>
            <SvgText x="4" y="56" fill="#3a3a3a" fontSize="9">8</SvgText>
            <SvgText x="4" y="100" fill="#3a3a3a" fontSize="9">0</SvgText>
            <Polygon points={`${chartPoints} 336,96 18,96`} fill="url(#cg)" />
            <Polyline
              points={chartPoints}
              fill="none"
              stroke="#C4F000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {!summary && (
              <>
                <Rect x="138" y="14" width="62" height="20" rx="6" fill="#1e1e1e" stroke="#C4F000" strokeWidth={1} />
                <SvgText x="169" y="28" fill="#C4F000" fontSize="9.5" textAnchor="middle" fontWeight="700">
                  Max Reps 12
                </SvgText>
                <Circle cx="168" cy="30" r="4" fill="#C4F000" />
              </>
            )}
            <SvgText x="18" y="106" fill="#3a3a3a" fontSize="9">0:00</SvgText>
            <SvgText x="100" y="106" fill="#3a3a3a" fontSize="9">1:30</SvgText>
            <SvgText x="196" y="106" fill="#3a3a3a" fontSize="9">3:00</SvgText>
            <SvgText x="278" y="106" fill="#3a3a3a" fontSize="9">4:30</SvgText>
          </Svg>
        </View>

        {/* Exercise breakdown */}
        <View style={[styles.card, { marginBottom: 96 }]}>
          <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Exercise Breakdown</Text>
          {summary && exercises.length === 0 ? (
            <Text style={styles.emptyBreakdown}>No reps or hold time were counted in this session.</Text>
          ) : (
            (summary ? exercises : [{ exerciseName: exName, reps, holdSec: 0, correctFormPct: formPct }]).map((exercise) => {
              const work = exercise.holdSec > exercise.reps ? exercise.holdSec : exercise.reps;
              const label = exercise.holdSec > exercise.reps ? `${Math.round(exercise.holdSec)} sec` : `${exercise.reps} reps`;
              const pct = summary && totalWork > 0 ? Math.max(8, Math.round((work / totalWork) * 100)) : repBarPct;
              return (
                <View key={exercise.exerciseName} style={styles.breakdownItem}>
                  <Bar
                    name={exercise.exerciseName}
                    right={label}
                    rightColor="#666"
                    width={`${pct}%`}
                    gradient={[colors.lime, colors.limeDark]}
                  />
                </View>
              );
            })
          )}
          <Bar
            name="Correct Form"
            right={`${formPct}%`}
            rightColor={colors.orange}
            rightBold
            width={`${formPct}%`}
            gradient={[colors.orange, colors.orangeDark]}
          />
        </View>
      </ScrollView>
    </ScreenFade>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.sumRightLabel}>{label}</Text>
      <Text style={styles.sumRightValue}>{value}</Text>
    </View>
  );
}

function Bar({
  name,
  right,
  rightColor,
  rightBold,
  width,
  gradient,
}: {
  name: string;
  right: string;
  rightColor: string;
  rightBold?: boolean;
  width: string;
  gradient: [string, string];
}) {
  return (
    <View>
      <View style={styles.barTop}>
        <Text style={styles.barName}>{name}</Text>
        <Text style={[styles.barRight, { color: rightColor, fontWeight: rightBold ? "700" : "400" }]}>{right}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={{ width: width as any, height: "100%" }}>
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.barFill} />
        </View>
      </View>
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
  date: { color: colors.textDim, fontSize: 13 },

  summary: {
    margin: 14,
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  bigEmoji: { position: "absolute", right: -6, top: -4, fontSize: 110, opacity: 0.12, lineHeight: 110 },
  sumLabel: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500", marginBottom: 3 },
  bigNum: { color: "#fff", fontSize: 68, fontWeight: "900", lineHeight: 68 },
  sumSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 },
  sumRight: { gap: 14, alignItems: "flex-end" },
  sumRightLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, textAlign: "right" },
  sumRightValue: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "right" },

  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.bgBorder,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 14 },

  barTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  barName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  barRight: { fontSize: 13 },
  barTrack: { height: 5, backgroundColor: "#222", borderRadius: 3, overflow: "hidden" },
  barFill: { flex: 1, borderRadius: 3 },
  breakdownItem: { marginBottom: 16 },
  emptyBreakdown: { color: colors.textDim, fontSize: 13, marginBottom: 16 },
});
