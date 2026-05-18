/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        /* Django green brand palette */
        django: {
          50:  '#f0faf4',
          100: '#d9f2e6',
          200: '#b3e5cc',
          300: '#7dd0aa',
          400: '#44b78b',
          500: '#2ea370',
          600: '#1f8055',
          700: '#17623f',
          800: '#0e4229',   /* sidebar dark */
          900: '#092e1f',   /* header/brand */
          950: '#04180f',
        },
        /* Neutral surfaces — light & dark */
        surface: {
          0:   '#ffffff',
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#18212f',
          900: '#111827',
          950: '#0a0f1a',
        },
        /* Teal accent for interactive states */
        teal: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        /* Status */
        success: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
        warning: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        danger:  { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
        info:    { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },
      },
      boxShadow: {
        'card':      '0 1px 3px 0 rgba(0,0,0,.10), 0 1px 2px -1px rgba(0,0,0,.10)',
        'card-md':   '0 4px 6px -1px rgba(0,0,0,.12), 0 2px 4px -2px rgba(0,0,0,.10)',
        'card-lg':   '0 10px 15px -3px rgba(0,0,0,.14), 0 4px 6px -4px rgba(0,0,0,.10)',
        'django':    '0 0 0 3px rgba(68,183,139,0.25)',
        'panel':     '0 0 0 1px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.08)',
        'inner-sm':  'inset 0 1px 2px rgba(0,0,0,.08)',
        'glow-green':'0 0 20px rgba(46,163,112,0.35)',
        'glow-teal': '0 0 20px rgba(20,184,166,0.30)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
      },
      keyframes: {
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'slide-in-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-ring': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(68,183,139,0.6)' },
          '50%':     { boxShadow: '0 0 0 6px rgba(68,183,139,0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-up':    'slide-in-up 0.18s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':        'fade-in 0.15s ease',
        'pulse-ring':     'pulse-ring 2s ease infinite',
        'shimmer':        'shimmer 2s linear infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
