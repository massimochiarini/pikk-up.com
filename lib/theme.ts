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
    primary: '#1F2937',      // Dark gray (was neon green)
    primaryDark: '#111827',  // Darker gray
    accent: '#6B7280',       // Medium gray
    background: '#FFFFFF',   // White
    text: '#1F2937',         // Dark gray
  },
  yoga: {
    primary: '#1F2937',      // Dark gray
    primaryDark: '#111827',  // Darker gray
    accent: '#6B7280',       // Medium gray
    background: '#FFFFFF',   // White
    text: '#1F2937',         // Dark gray
  },
  both: {
    primary: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)', // Gray gradient
    primaryDark: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
    accent: '#6B7280',       // Medium gray
    background: '#FFFFFF',   // White
    text: '#1F2937',         // Dark gray
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

