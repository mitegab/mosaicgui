/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#070a12',
          900: '#0d1320',
          850: '#111827',
          800: '#172033',
          700: '#263247',
        },
        accent: {
          500: '#8b5cf6',
          400: '#a78bfa',
          300: '#c4b5fd',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(139, 92, 246, 0.18)',
      },
    },
  },
  plugins: [],
};
