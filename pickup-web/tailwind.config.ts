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
        // Pickleball theme colors
        'neon-green': '#D3FD00',
        'neon-green-dark': '#B8E000',
        
        // Yoga theme colors
        'yoga-purple': '#C4B5FD',
        'yoga-purple-dark': '#A78BFA',
        'yoga-purple-light': '#DDD6FE',
        
        // Shared colors
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

