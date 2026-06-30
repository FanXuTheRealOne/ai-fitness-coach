// Static demo data mirroring the handoff prototype.

export const recentWorkouts = [
  { name: "Squat", detail: "3 sets · 45 reps", time: "Today", emoji: "🏋️" },
  { name: "Push-up", detail: "3 sets · 35 reps", time: "Yesterday", emoji: "💪" },
];

export const historyItems = [
  { name: "Squat", detail: "3 sets · 45 reps · 6:12", time: "Today", emoji: "🏋️" },
  { name: "Push-up", detail: "3 sets · 35 reps · 5:20", time: "Yesterday", emoji: "💪" },
  { name: "Jumping Jack", detail: "3 sets · 80 reps · 6:45", time: "May 15", emoji: "🤸" },
  { name: "Lunge", detail: "3 sets · 40 reps · 5:40", time: "May 14", emoji: "🦵" },
];

export const sessionStats = [
  { emoji: "🔄", label: "Reps", value: "12" },
  { emoji: "🔥", label: "Calories", value: "86" },
  { emoji: "⏱", label: "Duration", value: "00:45" },
  { emoji: "📊", label: "Total Reps", value: "32" },
];

export const filters = ["All", "Strength", "Cardio", "Mobility"] as const;

export type ExerciseCard = {
  name: string;
  emoji: string;
  soon: boolean;
  gradient: [string, string];
  nameColor: string;
  nameSize: number;
  border?: boolean;
};

export const exercises: ExerciseCard[] = [
  { name: "Squat", emoji: "🏋️", soon: false, gradient: ["#3d1800", "#6e2c00"], nameColor: "#fff", nameSize: 15 },
  { name: "Push-up", emoji: "💪", soon: false, gradient: ["#2a1a00", "#503000"], nameColor: "#fff", nameSize: 15 },
  { name: "Plank", emoji: "🤸", soon: false, gradient: ["#001818", "#003030"], nameColor: "#C4F000", nameSize: 15 },
  { name: "Jumping Jack", emoji: "⭐", soon: false, gradient: ["#1c1a00", "#363200"], nameColor: "#fff", nameSize: 14 },
  { name: "Lunge", emoji: "🦵", soon: false, gradient: ["#1c0034", "#3a0060"], nameColor: "#fff", nameSize: 15 },
  { name: "More", emoji: "+", soon: true, gradient: ["#111", "#111"], nameColor: "#444", nameSize: 15, border: true },
];
