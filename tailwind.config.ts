import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 中国红主题色
        brand: {
          50: "#fff5f5",
          100: "#ffe3e3",
          200: "#ffc9c9",
          300: "#ffa8a8",
          400: "#ff8787",
          500: "#c8161d", // 主色 (中国红)
          DEFAULT: "#c8161d",
          600: "#a01217",
          700: "#7d0e12",
          dark: "#7d0e12",
          800: "#5c0a0d",
          900: "#3d0608",
          ink: "#1a0203",
        },
        ink: {
          DEFAULT: "#1f1d1c",
          soft: "#3a3735",
          mute: "#6b6663",
        },
        paper: {
          DEFAULT: "#fbf7f2", // 米黄宣纸底
          dark: "#f3ece2",
        },
        gold: {
          DEFAULT: "#b8893d",
          dark: "#8c6427",
        },
      },
      fontFamily: {
        serif: [
          '"Noto Serif SC"',
          '"Songti SC"',
          '"PingFang SC"',
          "STSong",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        ink: "0 1px 0 rgba(31,29,28,0.04), 0 4px 16px -4px rgba(31,29,28,0.08)",
        seal: "0 0 0 2px #c8161d, 0 0 0 4px #fbf7f2",
      },
      backgroundImage: {
        "paper-grid":
          "radial-gradient(rgba(31,29,28,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "paper-grid": "18px 18px",
      },
    },
  },
  plugins: [],
};

export default config;
