'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { SportPreference, getThemeColors, applyTheme } from '@/lib/theme'

interface ThemeContextType {
  sportPreference: SportPreference
  setSportPreference: (preference: SportPreference) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  sportPreference: 'pickleball',
  setSportPreference: () => {},
  isLoading: true,
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [sportPreference, setSportPreferenceState] = useState<SportPreference>('pickleball')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user's sport preference and apply theme
  useEffect(() => {
    async function loadUserTheme() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('sport_preference')
            .eq('id', user.id)
            .single()
          
          if (profile?.sport_preference) {
            setSportPreferenceState(profile.sport_preference as SportPreference)
            applyTheme(profile.sport_preference as SportPreference)
          } else {
            // Default to pickleball
            applyTheme('pickleball')
          }
        } else {
          // Not logged in, use default
          applyTheme('pickleball')
        }
      } catch (error) {
        console.error('Error loading theme:', error)
        applyTheme('pickleball')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserTheme()
  }, [])

  // Update theme when preference changes
  const setSportPreference = (preference: SportPreference) => {
    setSportPreferenceState(preference)
    applyTheme(preference)
  }

  return (
    <ThemeContext.Provider value={{ sportPreference, setSportPreference, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

