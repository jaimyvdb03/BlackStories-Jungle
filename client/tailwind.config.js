/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jungle: ['Rock Salt', 'cursive'], // Voeg hier Rock Salt toe
      },
    },
  },
  plugins: [],
}
