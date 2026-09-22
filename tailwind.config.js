/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep navy background system
        navy: {
          950: '#070b18',
          900: '#0b1120',
          850: '#0f172a',
          800: '#141d33',
          750: '#1a2540',
          700: '#22304f',
          600: '#2d3d63',
        },
        // Teal / blue primary accent (AI + IoT)
        accent: {
          50: '#effcfb',
          100: '#d6f6f4',
          200: '#b0ece9',
          300: '#79ddda',
          400: '#3cc6c6',
          500: '#1aa6aa',
          600: '#0f8489',
          700: '#12696e',
          800: '#14545a',
          900: '#15464c',
        },
        // Secondary electric blue for THINK / AI emphasis
        cyanx: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        // Semantic states
        normal: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.35), 0 8px 24px -12px rgba(0,0,0,0.45)',
        glow: '0 0 0 1px rgba(26,166,170,0.25), 0 0 28px -6px rgba(26,166,170,0.45)',
        'glow-danger': '0 0 0 1px rgba(239,68,68,0.3), 0 0 34px -6px rgba(239,68,68,0.55)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.8)', opacity: '0' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
        floatIn: 'floatIn 0.4s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        blink: 'blink 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
