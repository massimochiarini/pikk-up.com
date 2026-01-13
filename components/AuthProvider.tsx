'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
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
  
  // Track if we've already fetched the profile for this user
  const profileFetchedForUser = useRef<string | null>(null)
  const isInitialized = useRef(false)

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Don't re-fetch if we already have this user's profile
    if (profileFetchedForUser.current === userId && profile) {
      return profile
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      
      profileFetchedForUser.current = userId
      return data as Profile
    } catch (err) {
      console.error('Profile fetch error:', err)
      return null
    }
  }, [profile])

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileFetchedForUser.current = null // Force refresh
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) return
    isInitialized.current = true

    let isMounted = true

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          if (isMounted) setProfile(profileData)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes - but only handle SIGN_IN, SIGN_OUT, and USER_UPDATED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        // Only handle meaningful auth events, ignore token refreshes
        if (event === 'TOKEN_REFRESHED') {
          // Just update the session, don't refetch profile
          setSession(session)
          return
        }
        
        // Handle sign in/out
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
          profileFetchedForUser.current = null
          setLoading(false)
          return
        }
        
        // For SIGNED_IN or INITIAL_SESSION
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            // Only fetch profile if it's a new user
            if (profileFetchedForUser.current !== session.user.id) {
              const profileData = await fetchProfile(session.user.id)
              if (isMounted) setProfile(profileData)
            }
          } else {
            setProfile(null)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    try {
      // Clear state first
      setUser(null)
      setProfile(null)
      setSession(null)
      profileFetchedForUser.current = null
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Force redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if sign out fails, redirect to home
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
