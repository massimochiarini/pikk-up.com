'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type Profile } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error.message)
        return null
      }
      console.log('Profile fetched:', data?.email)
      return data as Profile
    } catch (err) {
      console.error('Profile fetch exception:', err)
      return null
    }
  }

  useEffect(() => {
    let isActive = true

    const initSession = async () => {
      try {
        console.log('Initializing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('getSession error:', error)
          setLoading(false)
          return
        }
        
        if (!isActive) return
        
        if (session) {
          console.log('Session found for:', session.user.email)
          setSession(session)
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          if (isActive) {
            setProfile(profileData)
          }
        } else {
          console.log('No session found')
        }
        
        if (isActive) {
          setLoading(false)
        }
      } catch (err) {
        console.error('Session init error:', err)
        if (isActive) {
          setLoading(false)
        }
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isActive) return
        
        console.log('Auth state change:', event, newSession?.user?.email)
        
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id)
          if (isActive) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
        
        if (isActive) {
          setLoading(false)
        }
      }
    )

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      if (profileData) {
        setProfile(profileData)
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
