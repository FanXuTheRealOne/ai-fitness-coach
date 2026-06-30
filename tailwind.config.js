/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design tokens from the handoff
        bg: {
          primary: "#0c0c0c",
          card: "#181818",
          border: "#222222",
          "border-subtle": "#242424",
        },
        orange: {
          primary: "#E5520A",
          dark: "#BF4200",
          darker: "#C94C00",
          hero: "#7a2200",
        },
        lime: {
          DEFAULT: "#C4F000",
          dark: "#9fcc00",
        },
        "green-active": "#4CAF50",
        text: {
          primary: "#ffffff",
          muted: "#555555",
          dim: "#444444",
          placeholder: "#4a4a4a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
