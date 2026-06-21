/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // optional if you want class-based dark mode
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"], // available themes
    darkTheme: "dark",
  },
};
