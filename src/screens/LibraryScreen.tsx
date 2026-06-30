import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/tokens";
import { ScreenFade } from "../components/anim";
import { useApp } from "../state/appState";
import { exercises, ExerciseCard } from "../data";

export function LibraryScreen() {
  const { startCamera } = useApp();
  return (
    <ScreenFade duration={300} translate={0}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Exercise Library</Text>
          <Text style={styles.sub}>Choose an exercise or let AI detect it live.</Text>
        </View>

        <View style={styles.grid}>
          {exercises.map((ex) => (
            <Card key={ex.name} ex={ex} onPress={ex.soon ? undefined : startCamera} />
          ))}
        </View>
      </ScrollView>
    </ScreenFade>
  );
}

function Card({ ex, onPress }: { ex: ExerciseCard; onPress?: () => void }) {
  const inner = (
    <>
      <Text style={styles.cardEmoji}>{ex.emoji}</Text>
      <Text style={[styles.cardName, { color: ex.nameColor, fontSize: ex.nameSize }]}>{ex.name}</Text>
      {ex.soon && <Text style={styles.soon}>Coming Soon</Text>}
    </>
  );
  return (
    <Pressable onPress={onPress} style={styles.cardWrap}>
      {ex.border ? (
        <View style={[styles.card, { backgroundColor: "#111", borderWidth: 1, borderColor: "#1e1e1e" }]}>{inner}</View>
      ) : (
        <LinearGradient colors={ex.gradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.card}>
          {inner}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 58, paddingHorizontal: 20 },
  title: { color: "#fff", fontSize: 30, fontWeight: "800" },
  sub: { color: colors.textDim, fontSize: 13, marginTop: 5, lineHeight: 19 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingTop: 18 },
  cardWrap: { width: "47.5%", flexGrow: 1, aspectRatio: 1 },
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },
  cardEmoji: {
    position: "absolute",
    top: "23%",
    fontSize: 58,
    opacity: 0.32,
    lineHeight: 64,
  },
  cardName: { fontWeight: "700", textAlign: "center", zIndex: 1 },
  soon: { color: colors.textDim, fontSize: 11, marginTop: 3, textAlign: "center" },
});
