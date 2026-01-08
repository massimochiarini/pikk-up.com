import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types matching your iOS app database
export type Profile = {
  id: string
  first_name: string
  last_name: string
  username?: string
  bio?: string
  avatar_url?: string
  favorite_sports?: string[]
  location_lat?: number
  location_lng?: number
  sport_preference?: 'pickleball' | 'yoga' | 'both'
  created_at: string
}

export type Game = {
  id: string
  created_by: string
  sport: string
  venue_name: string
  address: string
  game_date: string
  start_time: string
  max_players: number
  cost_cents: number
  description?: string
  image_url?: string
  is_private: boolean
  skill_level?: string
  instructor_id?: string | null
  status?: 'available' | 'booked'
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export type RSVP = {
  id: string
  game_id: string
  user_id: string
  created_at: string
}

export type GroupChat = {
  id: string
  game_id: string
  name: string
  last_message_at?: string
  last_message_preview?: string
  created_at: string
}

export type GroupMessage = {
  id: string
  group_chat_id: string
  sender_id: string
  content: string
  created_at: string
}

export type GroupChatMember = {
  id: string
  group_chat_id: string
  user_id: string
  joined_at: string
}

