import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bordeaux: {
          DEFAULT: "#5C1A2E",
          secondary: "#7A2440",
          light: "rgba(92,26,46,0.07)",
        },
        fond: {
          DEFAULT: "#F8F5F0",
          blanc: "#FDFBF8",
          or: "#F0E8D8",
        },
        or: {
          DEFAULT: "#8C6D3F",
          accent: "#C4A46B",
        },
        texte: {
          DEFAULT: "#1A1210",
          secondary: "#3D2E28",
          tertiary: "#7A6A60",
          discret: "#B0A098",
        },
        vert: "#1B3A2D",
      },
      fontFamily: {
        cormorant: ["Cormorant Garamond", "serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        btn: "13px",
      },
    },
  },
  plugins: [],
};
export default config;
