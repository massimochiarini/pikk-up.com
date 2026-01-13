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
        // Warm, calming yoga palette
        'sage': {
          50: '#f6f7f4',
          100: '#e3e7de',
          200: '#c8d0be',
          300: '#a6b396',
          400: '#859772',
          500: '#687b56',
          600: '#516243',
          700: '#414e37',
          800: '#36402f',
          900: '#2e3629',
        },
        'sand': {
          50: '#faf8f5',
          100: '#f2ede4',
          200: '#e4d9c7',
          300: '#d3c0a3',
          400: '#bfa37d',
          500: '#b08d62',
          600: '#a37b55',
          700: '#876448',
          800: '#6f5340',
          900: '#5b4536',
        },
        'terracotta': {
          50: '#fdf6f3',
          100: '#fce9e2',
          200: '#fad6c9',
          300: '#f5b9a3',
          400: '#ed9272',
          500: '#e26f47',
          600: '#cf5634',
          700: '#ad4429',
          800: '#8f3a26',
          900: '#763425',
        },
        'cream': '#fdfbf7',
        'charcoal': '#2c2c2c',
      },
      fontFamily: {
        'display': ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        'body': ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
