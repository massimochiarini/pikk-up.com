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
        'neon-green': '#D3FD00',
        'neon-green-dark': '#B8E000',
        'navy': '#0F1B2E',
        'navy-light': '#1A2B4A',
        'sky-blue': '#4A9EBF',
        'sky-blue-light': '#7BB8D0',
      },
    },
  },
  plugins: [],
}
export default config

