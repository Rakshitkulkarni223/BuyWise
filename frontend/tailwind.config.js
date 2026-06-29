/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#F4F5F7',
        surface: '#FFFFFF',
        ink: '#0F172A',
        'ink-soft': '#1E293B',
        muted: '#64748B',
        accent: '#2563EB',
        'accent-hover': '#1D4ED8',
        'accent-soft': '#EFF4FF',
        success: '#10B981',
        'success-bg': '#D1FAE5',
        warning: '#F59E0B',
        'warning-bg': '#FEF3C7',
        danger: '#EF4444',
        line: '#E2E8F0',
      },
      fontFamily: {
        display: ['Cabinet Grotesk', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        md: '6px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        lift: '0 8px 24px -8px rgba(15, 23, 42, 0.12)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease forwards',
        'scan': 'scan 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
