import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Luxury gold accent
        accent: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#c9a227", // primary gold
          DEFAULT: "#c9a227",
          600: "#a78520",
          700: "#856a1a",
          800: "#634f14",
          900: "#42350e",
        },
        // GitHub-inspired neutrals
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f6f8fa",
          border: "#d1d9e0",
          dark: "#0d1117",
          "dark-secondary": "#161b22",
          "dark-border": "#30363d",
        },
        // Backwards-compat aliases mapped to the new GitHub-luxury palette,
        // so that legacy class names like text-brand / bg-paper-dark / text-ink-soft
        // still produce something sensible during the gradual migration.
        brand: {
          DEFAULT: "#c9a227",
          dark: "#856a1a",
        },
        ink: {
          DEFAULT: "#1f2328",
          soft: "#424a53",
          mute: "#6e7781",
        },
        paper: {
          DEFAULT: "#f6f8fa",
          dark: "#d1d9e0",
        },
        gold: {
          DEFAULT: "#c9a227",
          dark: "#856a1a",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"Noto Sans"',
          "Helvetica",
          "Arial",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"SF Mono"',
          "Menlo",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      boxShadow: {
        luxury:
          "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)",
        "luxury-lg":
          "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        "luxury-dark":
          "0 1px 3px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
