// Theme configuration for different sports
// Supports dynamic theming based on user's sport preference

export type SportPreference = 'pickleball' | 'yoga' | 'both'

export interface ThemeColors {
  primary: string
  primaryDark: string
  accent: string
  background: string
  text: string
}

export const sportThemes: Record<SportPreference, ThemeColors> = {
  pickleball: {
    primary: '#D3FD00',      // Neon green
    primaryDark: '#B8E000',  // Darker neon green
    accent: '#4A9EBF',       // Sky blue
    background: '#0F1B2E',   // Navy
    text: '#1F2937',         // Gray-900
  },
  yoga: {
    primary: '#C4B5FD',      // Light purple
    primaryDark: '#A78BFA',  // Medium purple
    accent: '#DDD6FE',       // Lighter purple
    background: '#1E1B4B',   // Deep purple/indigo
    text: '#1F2937',         // Gray-900
  },
  both: {
    primary: 'linear-gradient(135deg, #D3FD00 0%, #C4B5FD 100%)', // Green to purple gradient
    primaryDark: 'linear-gradient(135deg, #B8E000 0%, #A78BFA 100%)',
    accent: '#7BB8D0',       // Sky blue light
    background: '#0F1B2E',   // Navy
    text: '#1F2937',         // Gray-900
  },
}

// Get theme colors for a given sport preference
export function getThemeColors(preference: SportPreference = 'pickleball'): ThemeColors {
  return sportThemes[preference] || sportThemes.pickleball
}

// Check if a color is a gradient
export function isGradient(color: string): boolean {
  return color.startsWith('linear-gradient')
}

// Get CSS variables object for a theme
export function getThemeVars(preference: SportPreference = 'pickleball'): Record<string, string> {
  const colors = getThemeColors(preference)
  
  return {
    '--primary-color': colors.primary,
    '--primary-dark': colors.primaryDark,
    '--accent-color': colors.accent,
    '--background-color': colors.background,
    '--text-color': colors.text,
  }
}

// Apply theme to document root
export function applyTheme(preference: SportPreference = 'pickleball'): void {
  if (typeof document === 'undefined') return
  
  const vars = getThemeVars(preference)
  const root = document.documentElement
  
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  
  // Add data attribute for CSS selectors
  root.setAttribute('data-theme', preference)
}

