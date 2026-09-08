/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#061820",
          800: "#0c2833",
          700: "#133845",
          600: "#1c4a5a",
        },
        gold: {
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
        teal: {
          DEFAULT: "#0f766e",
          accent: "#0d5c6b",
          dark: "#08333c",
          light: "#e6f4f1",
        },
        sand: {
          50: "#faf8f5",
          100: "#f5f2eb",
          200: "#eae4d8",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
