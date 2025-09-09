/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1a1a',
        'dark-secondary': '#242424', 
        'dark-accent': '#2a2a2a',
        'dark-surface': '#2e2e2e',
        'dark-card': '#1e1e1e',
        'metallic-blue': '#2563eb',
        'accent-blue': '#3b82f6',
        'accent-gold': '#d97706',
        'accent-red': '#dc2626',
        'deep-red': '#dc2626',
        'neon-blue': '#0066ff',
        'premium-gold': '#ffd700',
        'alert-red': '#ff0000'
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
        'status-pulse': 'status-pulse 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(220, 38, 38, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0)' }
        },
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}