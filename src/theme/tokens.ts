// Design tokens — single source of truth, mirrors the handoff spec.
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

// Logical phone canvas size (iPhone 14-ish), used for the web device frame.
export const PHONE = { width: 390, height: 844, radius: 52 } as const;

export const font = "Inter";
