/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F6EC',
          100: '#C3EBD1',
          500: '#1DA65A',
          600: '#178C4B',
          700: '#12703C',
        },
        navy: {
          500: '#0F2A4A',
          700: '#0B1E38',
          900: '#081627',
        },
      },
    },
  },
  plugins: [],
};
