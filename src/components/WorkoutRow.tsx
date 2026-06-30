import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/tokens";
import { ChevronRight } from "./Icons";

export function WorkoutRow({
  emoji,
  name,
  detail,
  time,
  onPress,
  detailColor = colors.textPlaceholder,
  timeFontSize = 12,
}: {
  emoji: string;
  name: string;
  detail: string;
  time: string;
  onPress?: () => void;
  detailColor?: string;
  timeFontSize?: number;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <LinearGradient
        colors={["#7a2200", "#C94C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.thumb}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </LinearGradient>
      <View style={styles.mid}>
        <Text style={styles.name}>{name}</Text>
        <Text style={[styles.detail, { color: detailColor }]}>{detail}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, { fontSize: timeFontSize }]}>{time}</Text>
        <ChevronRight size={14} color="#333" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.bgBorder,
  },
  thumb: { width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 26 },
  mid: { flex: 1, minWidth: 0 },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  detail: { fontSize: 12, marginTop: 3 },
  right: { alignItems: "flex-end", gap: 5 },
  time: { color: colors.textMuted },
});
