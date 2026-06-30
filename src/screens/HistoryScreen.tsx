import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";
import { ScreenFade } from "../components/anim";
import { CalendarIcon } from "../components/Icons";
import { WorkoutRow } from "../components/WorkoutRow";
import { useApp } from "../state/appState";
import { historyItems, filters } from "../data";

export function HistoryScreen() {
  const { navigate, selectedFilter, setFilter } = useApp();
  return (
    <ScreenFade duration={300} translate={0}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <CalendarIcon size={22} color={colors.textDim} />
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {filters.map((f) => {
            const active = f === selectedFilter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.pill,
                  active
                    ? { backgroundColor: colors.lime }
                    : { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.bgBorderSubtle },
                ]}
              >
                <Text style={[styles.pillText, { color: active ? colors.bgPrimary : colors.textMuted }]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.weekLabel}>This Week</Text>

        <View style={styles.list}>
          {historyItems.map((h) => (
            <WorkoutRow
              key={h.name}
              {...h}
              detailColor={colors.textDim}
              timeFontSize={11}
              onPress={() => navigate("detail")}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#fff", fontSize: 32, fontWeight: "800" },
  pillRow: { gap: 8, paddingHorizontal: 20, paddingBottom: 18 },
  pill: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  pillText: { fontSize: 14, fontWeight: "600" },
  weekLabel: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  list: { paddingHorizontal: 20 },
});
