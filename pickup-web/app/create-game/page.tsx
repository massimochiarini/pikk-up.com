'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateGamePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // Step 1: Create the game
      const { data, error } = await supabase
        .from('games')
        .insert({
          created_by: user.id,
          sport: 'pickleball',
          venue_name: venue,
          address: address || venue,
          game_date: date,
          start_time: time,
          max_players: 4,
          cost_cents: 0,
          description: description || null,
          skill_level: skillLevel || null,
          is_private: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Step 2: Auto-RSVP the creator
      await supabase
        .from('rsvps')
        .insert({
          game_id: data.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })

      // Step 3: Create group chat for the game
      const { data: groupChatData, error: groupChatError } = await supabase
        .from('group_chats')
        .insert({
          game_id: data.id,
          name: venue,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (groupChatError) {
        console.error('Error creating group chat:', groupChatError)
        // Don't fail the entire operation if group chat creation fails
      } else if (groupChatData) {
        // Step 4: Add creator as first member of group chat
        await supabase
          .from('group_chat_members')
          .insert({
            group_chat_id: groupChatData.id,
            user_id: user.id,
            joined_at: new Date().toISOString(),
          })
      }

      router.push(`/game/${data.id}`)
    } catch (error: any) {
      setError(error.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Book a Session
          </h1>
          <p className="text-gray-600">
            Schedule a class session and invite students to join
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Venue Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Studio/Venue Name *
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="input-field"
                placeholder="e.g., Sunrise Yoga Studio"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
                placeholder="e.g., 6301 NE 4th Ave, Miami, FL 33138"
              />
              <p className="text-xs text-gray-500 mt-1">Optional - helps players find the venue</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hour = Math.floor(i / 2)
                    const minute = i % 2 === 0 ? '00' : '30'
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                    const period = hour < 12 ? 'AM' : 'PM'
                    const value = `${String(hour).padStart(2, '0')}:${minute}:00`
                    const display = `${displayHour}:${minute} ${period}`
                    return <option key={value} value={value}>{display}</option>
                  })}
                </select>
              </div>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="input-field"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Capacity Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-semibold text-gray-900">4 Participants Max</div>
                  <div className="text-sm text-gray-600">Small group session</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Add any additional details about the session..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Book Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
