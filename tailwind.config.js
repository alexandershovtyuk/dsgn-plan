/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.js', './build.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
