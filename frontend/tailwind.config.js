/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E2A4A',
        accent: '#C9A84C',
        surface: '#F8F7F4',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(30, 42, 74, 0.16)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
