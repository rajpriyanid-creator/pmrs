import type { Config } from "tailwindcss";

/**
 * Design tokens per Spec Section 9 ("The Review Rail"). Deliberately NOT
 * cream+terracotta, not near-black+neon, not broadsheet - a registrar-ledger
 * paper/ink palette with brass, teal, and brick-red status accents.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#F6F7F4", dim: "#ECEEE8", dark: "#14181F" },
        ink: { DEFAULT: "#1B2430", soft: "#4B5563", inverse: "#F6F7F4" },
        seal: { DEFAULT: "#B8863B", soft: "#E4C892", dark: "#8A6529" },
        verdant: { DEFAULT: "#1F5C57", soft: "#CFE3E0", dark: "#123834" },
        flag: { DEFAULT: "#A63D33", soft: "#F0D3CF", dark: "#7A2D25" },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        rail: "inset -1px 0 0 0 rgba(27,36,48,0.08)",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        lg: "8px",
      },
      transitionDuration: {
        fill: "420ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
