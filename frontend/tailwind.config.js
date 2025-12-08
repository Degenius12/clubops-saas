/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════
      // MIDNIGHT LUXE COLOR SYSTEM - Optimized for Low-Light Environments
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // Primary Backgrounds (True Black System - OLED Optimized)
        'midnight': {
          950: '#000000',    // Pure black - OLED battery savings
          900: '#0A0A0B',    // Main app background
          850: '#0F0F11',    // Slightly elevated
          800: '#111113',    // Card backgrounds
          750: '#151517',    // Elevated elements
          700: '#18181B',    // Higher elevation
          650: '#1C1C1F',    // Hover backgrounds
          600: '#1F1F23',    // Hover states
          500: '#27272A',    // Active/pressed states
          400: '#3F3F46',    // Borders, dividers
        },
        
        // Champagne Gold - Primary Accent (VIP, Premium, CTAs)
        'gold': {
          50: '#FDF9E7',
          100: '#FCF3CF',
          200: '#F9E79F',
          300: '#F5D76E',
          400: '#E5BE50',
          500: '#D4AF37',     // Primary gold
          600: '#B8960C',     // Pressed state
          700: '#9A7B0A',
          800: '#7C6208',
          900: '#5E4906',
          950: '#3D2F04',
        },
        
        // Royal Purple - Secondary Accent (Premium SaaS Features)
        'royal': {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',     // Primary purple
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        
        // Electric Cyan - Tertiary Accent (Active States, Links)
        'electric': {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',     // Primary cyan
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },

        // Status Colors (Muted for Low-Light Comfort)
        'status': {
          // Success - Soft Emerald
          'success': '#10B981',
          'success-muted': 'rgba(16, 185, 129, 0.08)',
          'success-border': 'rgba(16, 185, 129, 0.25)',
          
          // Warning - Soft Amber
          'warning': '#F59E0B',
          'warning-muted': 'rgba(245, 158, 11, 0.08)',
          'warning-border': 'rgba(245, 158, 11, 0.25)',
          
          // Danger - Soft Rose
          'danger': '#EF4444',
          'danger-muted': 'rgba(239, 68, 68, 0.08)',
          'danger-border': 'rgba(239, 68, 68, 0.25)',
          
          // Info - Soft Blue
          'info': '#3B82F6',
          'info-muted': 'rgba(59, 130, 246, 0.08)',
          'info-border': 'rgba(59, 130, 246, 0.25)',
        },

        // Text Colors (Optimized for Eye Comfort)
        'text': {
          'primary': '#FAFAFA',      // 95% white - main text
          'secondary': '#A1A1AA',    // 60% - secondary text
          'tertiary': '#71717A',     // 45% - placeholder/disabled
          'muted': '#52525B',        // 32% - very subtle labels
          'inverse': '#0A0A0B',      // For light backgrounds
        },

        // Legacy colors (for backward compatibility during migration)
        'dark-bg': '#0A0A0B',
        'dark-secondary': '#111113',
        'dark-accent': '#18181B',
        'dark-surface': '#1F1F23',
        'dark-card': '#111113',
        'metallic-blue': '#3B82F6',
        'accent-blue': '#06B6D4',
        'accent-gold': '#D4AF37',
        'accent-red': '#EF4444',
        'deep-red': '#DC2626',
        'neon-blue': '#06B6D4',
        'premium-gold': '#D4AF37',
        'alert-red': '#EF4444',
      },

      // ═══════════════════════════════════════════════════════════════
      // TYPOGRAPHY SYSTEM
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        'sans': ['Inter', 'Inter Variable', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
        '5xl': ['3rem', { lineHeight: '1' }],             // 48px - Dashboard KPIs
        '6xl': ['3.75rem', { lineHeight: '1' }],          // 60px - Hero numbers
      },

      // ═══════════════════════════════════════════════════════════════
      // SPACING & SIZING
      // ═══════════════════════════════════════════════════════════════
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      borderRadius: {
        'xl': '0.75rem',     // 12px
        '2xl': '1rem',       // 16px
        '3xl': '1.5rem',     // 24px
      },

      // ═══════════════════════════════════════════════════════════════
      // BOX SHADOWS (Premium Depth System)
      // ═══════════════════════════════════════════════════════════════
      boxShadow: {
        'glow-gold': '0 0 20px -5px rgba(212, 175, 55, 0.4)',
        'glow-gold-lg': '0 0 40px -10px rgba(212, 175, 55, 0.5)',
        'glow-purple': '0 0 20px -5px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
        'glow-danger': '0 0 20px -5px rgba(239, 68, 68, 0.4)',
        'glow-success': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
      },

      // ═══════════════════════════════════════════════════════════════
      // ANIMATIONS (Premium Micro-interactions)
      // ═══════════════════════════════════════════════════════════════
      animation: {
        // Existing
        'pulse-ring': 'pulse-ring 2s infinite',
        'status-pulse': 'status-pulse 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        
        // New Premium Animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'timer-warning': 'timerWarning 1s ease-in-out infinite',
        'counter': 'counter 0.5s ease-out',
      },
      
      keyframes: {
        // Existing
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' }
        },
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        
        // New Premium Keyframes
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'fadeInUp': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fadeInDown': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'scaleIn': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'slideInRight': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'slideInLeft': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'glowPulse': {
          '0%, 100%': { boxShadow: '0 0 20px -5px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 30px -5px rgba(212, 175, 55, 0.5)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'bounceSubtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        'timerWarning': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)',
            borderColor: 'rgba(239, 68, 68, 0.5)'
          },
          '50%': { 
            boxShadow: '0 0 20px 0 rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(239, 68, 68, 0.8)'
          }
        },
        'counter': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },

      // ═══════════════════════════════════════════════════════════════
      // TRANSITIONS
      // ═══════════════════════════════════════════════════════════════
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '400': '400ms',
      },

      // ═══════════════════════════════════════════════════════════════
      // BACKDROP BLUR
      // ═══════════════════════════════════════════════════════════════
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // ═══════════════════════════════════════════════════════════════
      // Z-INDEX SCALE
      // ═══════════════════════════════════════════════════════════════
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
