import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Josefin Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Brand = Tailwind blue (primary: blue-600 #2563eb)
      colors: {
        brand: colors.blue,
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(37, 99, 235, 0.2), 0 20px 60px rgba(37, 99, 235, 0.15)",
      },
    },
  },
  plugins: [],
}

