import React from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/tokens";
import { ScreenFade, GlowPulse } from "../components/anim";
import { CameraIcon } from "../components/Icons";
import { WorkoutRow } from "../components/WorkoutRow";
import { useApp } from "../state/appState";
import { recentWorkouts } from "../data";

export function HomeScreen() {
  const { startCamera, navigate } = useApp();
  return (
    <ScreenFade>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={require("../../assets/hero-athlete.webp")} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.05)"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["transparent", colors.bgPrimary]}
            style={styles.heroFade}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroLine}>Track every</Text>
            <Text style={styles.heroLine}>rep. See</Text>
            <Text style={[styles.heroLine, styles.heroAccent]}>real results.</Text>
          </View>
        </View>

        {/* Camera CTA */}
        <Pressable onPress={startCamera} style={styles.cta}>
          <View>
            <Text style={styles.ctaTitle}>Start Camera Detection</Text>
            <Text style={styles.ctaSub}>Point your camera at yourself</Text>
          </View>
          <GlowPulse
            color={colors.lime}
            minRadius={8}
            maxRadius={20}
            minOpacity={0.25}
            maxOpacity={0.55}
            duration={2200}
            style={styles.ctaCircle}
          >
            <CameraIcon size={22} color={colors.bgPrimary} />
          </GlowPulse>
        </Pressable>

        {/* Today's Activity */}
        <View style={styles.activityWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Activity</Text>
            <Text style={styles.viewAll}>View all</Text>
          </View>
          <View style={styles.statsCard}>
            <Stat label="Workouts" value="3" />
            <View style={styles.divider} />
            <Stat label="Total Reps" value="125" />
            <View style={styles.divider} />
            <Stat label="Calories" value="512" valueColor={colors.orange} />
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.recentWrap}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Recent Workouts</Text>
          {recentWorkouts.map((w) => (
            <WorkoutRow key={w.name} {...w} onPress={() => navigate("detail")} />
          ))}
        </View>
      </ScrollView>
    </ScreenFade>
  );
}

function Stat({ label, value, valueColor = "#fff" }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 268, position: "relative", overflow: "hidden" },
  heroImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  heroFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },
  heroText: { position: "absolute", left: 22, bottom: 28, right: 0 },
  heroLine: { color: "#fff", fontSize: 30, fontWeight: "800", lineHeight: 35 },
  heroAccent: { color: colors.lime, fontStyle: "italic" },

  cta: {
    margin: 14,
    marginHorizontal: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.bgBorderSubtle,
  },
  ctaTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ctaSub: { color: colors.textPlaceholder, fontSize: 13, marginTop: 3 },
  ctaCircle: {
    width: 46,
    height: 46,
    backgroundColor: colors.lime,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  activityWrap: { paddingHorizontal: 16, paddingTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  viewAll: { color: colors.orange, fontSize: 13, fontWeight: "600" },
  statsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.bgBorder,
  },
  stat: { alignItems: "center" },
  statLabel: {
    color: colors.textPlaceholder,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  statValue: { fontSize: 30, fontWeight: "800", lineHeight: 30 },
  divider: { width: 1, height: 36, backgroundColor: "#252525" },

  recentWrap: { paddingHorizontal: 16, paddingTop: 18 },
});
