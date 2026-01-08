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
          venue_name: 'Pick Up Studio',
          address: '2500 South Miami Avenue',
          game_date: date,
          start_time: time,
          max_players: 15,
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
          name: 'Pick Up Studio',
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

        {/* Studio Info Card */}
        <div className="bg-gradient-to-br from-neon-green to-sky-blue rounded-2xl p-8 mb-8 text-center shadow-lg">
          <div className="mb-4">
            <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tight" style={{ fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
              Pick<span className="italic">Up</span> Studio
            </h2>
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-navy hover:text-white transition-colors group"
          >
            <span className="text-2xl">📍</span>
            <span className="text-lg font-semibold underline decoration-2 underline-offset-4 group-hover:decoration-white">
              2500 South Miami Ave
            </span>
          </a>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

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
                  <option value="07:00:00">7:00 AM</option>
                  <option value="09:00:00">9:00 AM</option>
                  <option value="11:00:00">11:00 AM</option>
                  <option value="13:00:00">1:00 PM</option>
                  <option value="17:00:00">5:00 PM</option>
                  <option value="19:00:00">7:00 PM</option>
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
                  <div className="font-semibold text-gray-900">15 Participants Max</div>
                  <div className="text-sm text-gray-600">Group session</div>
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
