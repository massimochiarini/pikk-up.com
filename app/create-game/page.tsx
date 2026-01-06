'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateGamePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [sport, setSport] = useState('Pickleball')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [skillLevel, setSkillLevel] = useState('All Levels')
  const [playersNeeded, setPlayersNeeded] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLat(position.coords.latitude)
          setLocationLng(position.coords.longitude)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          created_by: user.id,
          sport,
          date,
          time,
          location,
          location_lat: locationLat,
          location_lng: locationLng,
          description: description || null,
          skill_level: skillLevel,
          players_needed: playersNeeded,
          current_players: 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Auto-RSVP the creator as "going"
      await supabase
        .from('rsvps')
        .insert({
          game_id: data.id,
          user_id: user.id,
          status: 'going',
          created_at: new Date().toISOString(),
        })

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
            Create a Game
          </h1>
          <p className="text-gray-600">
            Host a pickleball game and invite others to join
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Sport */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="input-field"
                required
              >
                <option>Pickleball</option>
                <option>Tennis</option>
                <option>Basketball</option>
                <option>Soccer</option>
                <option>Volleyball</option>
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
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
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Enter address or venue name"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="btn-outline px-4 whitespace-nowrap"
                >
                  📍 Use My Location
                </button>
              </div>
              {locationLat && locationLng && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Location coordinates captured
                </p>
              )}
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
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            {/* Players Needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Players Needed (including you)
              </label>
              <input
                type="number"
                value={playersNeeded}
                onChange={(e) => setPlayersNeeded(parseInt(e.target.value))}
                className="input-field"
                min={2}
                max={20}
                required
              />
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
                placeholder="Add any additional details about the game..."
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
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

