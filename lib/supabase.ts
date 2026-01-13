import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role for admin operations
export const createServerClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
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

// Joined types for convenience
export type ClassWithDetails = YogaClass & {
  instructor: Profile
  time_slot: TimeSlot
  booking_count: number
}
