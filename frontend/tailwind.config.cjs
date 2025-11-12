/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2d6a4f',
        accent: '#95d5b2',
        success: '#52b788',
        dark: '#1b4332',
      },
    },
  },
  plugins: [],
};
