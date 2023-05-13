/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        inter: ["var(--my-inter)", ...fontFamily.sans],
        robo: ["var(--my-robo)"]
      },
      colors: {
        my_yellow1: "#F8FFE5",
        my_emerald: "#06D6A0",
        my_blue: "#1B9AAA",
        my_cyan: "#00FFF7",
        my_pink: "#EF476F",
        my_yellow2: "#FFC43D",
      }
    },
  },
  plugins: [],
}
