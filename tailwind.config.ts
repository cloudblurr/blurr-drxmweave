import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./App.tsx",
    "./*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        ring: "hsl(var(--ring))",
        holo: {
          cyan: "#00e5ff",
          blue: "#2979ff",
          purple: "#d500f9",
          magenta: "#ff1744",
          green: "#00e676",
          amber: "#ffab00",
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(0, 229, 255, 0.35)",
        neon: "0 0 40px rgba(0, 229, 255, 0.35)",
        "neon-purple": "0 0 30px rgba(213, 0, 249, 0.35)",
        "neon-green": "0 0 30px rgba(0, 230, 118, 0.35)",
        soft: "0 12px 30px rgba(0, 0, 0, 0.4)",
        "holo-lg": "0 0 60px rgba(0, 229, 255, 0.12), 0 25px 50px rgba(0, 0, 0, 0.5)",
        insetSoft: "inset 0 1px 2px rgba(0, 229, 255, 0.1), inset 0 -8px 20px rgba(0, 0, 0, 0.3)"
      },
      backdropBlur: {
        xl: "24px"
      },
      animation: {
        "holo-pulse": "holoPulse 3s ease-in-out infinite",
        "holo-sweep": "holoSweep 4s ease-in-out infinite",
      },
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
