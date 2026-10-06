import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fffaf9",
        blush: {
          50: "#fff1f6",
          100: "#ffe6ee",
          200: "#fdd0dd",
          300: "#fbb8cb",
          400: "#f78fb0",
          500: "#f1669a",
        },
        lilac: {
          50: "#f7f4ff",
          100: "#efeaff",
          200: "#e0d8ff",
          300: "#c9bcfd",
          400: "#ab97fa",
          500: "#8f79f5",
          600: "#7d63e8",
        },
        gold: {
          100: "#fdf3ec",
          200: "#f8e3d5",
          300: "#efcdb6",
          400: "#e2b193",
          500: "#c98a68",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: [
          "var(--font-nunito)",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 14px 40px -18px rgba(244, 114, 182, 0.4)",
        gold: "0 8px 30px -8px rgba(201, 138, 104, 0.45)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        fadeUp: "fadeUp 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
