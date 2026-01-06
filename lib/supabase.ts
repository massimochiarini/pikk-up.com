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
  created_at: string
}

export type Game = {
  id: string
  created_by: string
  sport: string
  date: string
  time: string
  location: string
  location_lat?: number
  location_lng?: number
  description?: string
  skill_level?: string
  players_needed: number
  current_players: number
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
  status: 'going' | 'maybe' | 'not_going'
  created_at: string
}

