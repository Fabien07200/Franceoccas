/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#E8460A',
          light: '#FFF0EB',
          border: '#F5C4B3',
        },
        dark: '#1A1A18',
        fo: {
          bg: '#F7F5F0',
          border: '#E2DDD6',
        },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
