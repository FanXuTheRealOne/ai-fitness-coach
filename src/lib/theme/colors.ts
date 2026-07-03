// 设计 token 的 hex 常量（供 SVG / 内联样式使用；Tailwind 类见 globals.css 的 @theme）。
export const colors = {
  bgPrimary: "#0c0c0c",
  bgCard: "#181818",
  bgBorder: "#222222",
  bgBorderSubtle: "#242424",
  orange: "#E5520A",
  orangeDark: "#BF4200",
  orangeDarker: "#C94C00",
  orangeHero: "#7a2200",
  lime: "#C4F000",
  limeDark: "#9fcc00",
  greenActive: "#4CAF50",
  textPrimary: "#ffffff",
  textMuted: "#555555",
  textDim: "#444444",
  textPlaceholder: "#4a4a4a",
  navInactive: "#383838",
} as const;
