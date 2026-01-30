import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Log config issues (will show in browser console)
    if (typeof window !== 'undefined') {
  if (!supabaseUrl) console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set!')
  if (!supabaseAnonKey) console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!')
  if (supabaseUrl && supabaseAnonKey) console.log('✅ Supabase config loaded')
}

// Browser client - using default localStorage (simpler, more reliable)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Helper for direct REST API calls (more reliable than supabase client in some cases)
export async function supabaseRest<T>(
  endpoint: string,
  options?: { method?: string; body?: any }
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
      method: options?.method || 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
    
    if (!response.ok) {
      return { data: null, error: response.statusText }
    }
    
    const data = await response.json()
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}

// Server-side client with service role for admin operations
export const createServerClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for server client')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Database Types
export type Profile = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  is_instructor: boolean
  instructor_status: 'none' | 'pending' | 'approved' | 'rejected'
  is_admin: boolean
  bio?: string
  instagram?: string
  created_at: string
}

export type TimeSlot = {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'claimed' | 'completed'
  created_at: string
}

export type YogaClass = {
  id: string
  instructor_id: string
  time_slot_id: string
  title: string
  description?: string
  price_cents: number
  max_capacity: number
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'all'
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  is_donation?: boolean
  image_url?: string
  created_at: string
}

export type Booking = {
  id: string
  class_id: string
  user_id?: string
  guest_first_name?: string
  guest_last_name?: string
  guest_phone?: string
  status: 'confirmed' | 'cancelled'
  created_at: string
}

export type Payment = {
  id: string
  booking_id: string
  class_id: string
  stripe_checkout_session_id: string
  stripe_payment_intent_id?: string
  amount_cents: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  customer_name?: string
  customer_phone?: string
  paid_at?: string
  created_at: string
}

export type InstructorPackage = {
  id: string
  instructor_id: string
  name: string
  description?: string
  class_count: number
  price_cents: number
  is_active: boolean
  created_at: string
}

export type PackageCredit = {
  id: string
  package_id: string
  instructor_id: string
  user_id?: string
  guest_phone?: string
  classes_remaining: number
  classes_total: number
  stripe_checkout_session_id?: string
  stripe_payment_intent_id?: string
  purchased_at: string
  created_at: string
}

// Joined types for convenience
export type ClassWithDetails = YogaClass & {
  instructor: Profile
  time_slot: TimeSlot
  booking_count: number
}

export type PackageWithInstructor = InstructorPackage & {
  instructor: Profile
}

export type PackageCreditWithDetails = PackageCredit & {
  package: InstructorPackage
  instructor: Profile
}
