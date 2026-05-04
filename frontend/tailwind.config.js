/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#fdf8f0',
          100: '#f9edd8',
          200: '#f2d9b0',
          300: '#e8bf7e',
          400: '#dca04a',
          500: '#c8852a',
          600: '#a86520',
          700: '#854e1c',
          800: '#6b3f1e',
          900: '#57341c',
        },
        cream: {
          50: '#fefcf8',
          100: '#fdf7ed',
          200: '#faedda',
          300: '#f5ddb8',
          400: '#edc78f',
        },
        bark: {
          700: '#4a3728',
          800: '#3a2a1e',
          900: '#2c1f16',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
