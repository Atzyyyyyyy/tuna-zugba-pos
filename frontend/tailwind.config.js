/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ✅ enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#16a34a',  // green-600
        accent: '#22c55e',   // green-500
      },
    },
  },
  plugins: [],
};
