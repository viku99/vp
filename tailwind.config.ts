import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;