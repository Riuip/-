import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ff4500", // Reddit-ish orange
          dark: "#cc3700",
        },
      },
    },
  },
  plugins: [],
};

export default config;
