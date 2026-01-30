import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Calm minimal palette - inspired by YE reference
        'stone': {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // Primary gray - matches YE logo tone (soft, neutral, not harsh)
        'gray': {
          DEFAULT: '#6b6b6b',
          light: '#8a8a8a',
          dark: '#4a4a4a',
        },
        // Legacy support
        'charcoal': '#6b6b6b',
        'neutral': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        'sans': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'display': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'body': ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'relaxed': '0.025em',
        'wide': '0.05em',
        'wider': '0.1em',
      },
      // Premium shadows - soft depth (spread > blur, low opacity)
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'soft-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'soft': '0 4px 16px -4px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        'soft-md': '0 8px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 16px 40px -8px rgba(0, 0, 0, 0.1), 0 8px 16px -6px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px -5px rgba(107, 107, 107, 0.15)',
      },
      // Premium timing functions
      transitionTimingFunction: {
        'ease-out-soft': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      // Extended durations for slow, calm animations
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      // Premium animations
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'blur-in': 'blurIn 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'drift': 'drift 20s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(8px)', transform: 'scale(0.98)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(10px, -10px) scale(1.02)' },
          '50%': { transform: 'translate(-5px, 5px) scale(0.98)' },
          '75%': { transform: 'translate(-10px, -5px) scale(1.01)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
      },
      // Backdrop blur presets
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
      },
    },
  },
  plugins: [],
}

export default config
