'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { supabase, type Game, type Profile, type RSVP } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

export default function GameDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [creator, setCreator] = useState<Profile | null>(null)
  const [attendees, setAttendees] = useState<Profile[]>([])
  const [userRsvp, setUserRsvp] = useState<RSVP | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpLoading, setRsvpLoading] = useState(false)

  useEffect(() => {
    if (gameId) {
      fetchGameDetails()
    }
  }, [gameId, user])

  const fetchGameDetails = async () => {
    try {
      setLoading(true)

      // Fetch game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (gameError) throw gameError
      setGame(gameData)

      // Fetch creator
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', gameData.created_by)
        .single()

      setCreator(creatorData)

      // Fetch RSVPs and attendees (no status filter - all RSVPs count)
      const { data: rsvpsData } = await supabase
        .from('rsvps')
        .select('*, profiles(*)')
        .eq('game_id', gameId)

      if (rsvpsData) {
        const profilesData = rsvpsData
          .map(rsvp => (rsvp as any).profiles)
          .filter(Boolean)
        setAttendees(profilesData)
      }

      // Check user's RSVP status
      if (user) {
        const { data: userRsvpData } = await supabase
          .from('rsvps')
          .select('*')
          .eq('game_id', gameId)
          .eq('user_id', user.id)
          .single()

        setUserRsvp(userRsvpData)
      }
    } catch (error) {
      console.error('Error fetching game details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRsvp = async () => {
    if (!user || !game) return

    setRsvpLoading(true)
    try {
      // Check if already RSVPed
      const { data: existingRsvp } = await supabase
        .from('rsvps')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .single()

      if (existingRsvp) {
        // Already RSVPed - remove RSVP
        await supabase
          .from('rsvps')
          .delete()
          .eq('game_id', gameId)
          .eq('user_id', user.id)
      } else {
        // Not RSVPed yet - add RSVP
        await supabase
          .from('rsvps')
          .insert({
            game_id: gameId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          })
      }

      // Refresh data
      await fetchGameDetails()
    } catch (error) {
      console.error('Error updating RSVP:', error)
    } finally {
      setRsvpLoading(false)
    }
  }

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
        </div>
      </div>
    )
  }

  const gameDate = parseISO(game.game_date)
  const formattedDate = format(gameDate, 'EEEE, MMMM d, yyyy')
  
  // Format time (HH:mm:ss to h:mm AM/PM)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }
  
  const currentPlayers = attendees.length
  const spotsLeft = game.max_players - currentPlayers
  const isUserGoing = userRsvp !== null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="card">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="text-5xl">🎾</div>
              <div>
                <h1 className="text-3xl font-bold text-navy capitalize">{game.sport}</h1>
                {game.skill_level && (
                  <span className="text-gray-600 capitalize">{game.skill_level}</span>
                )}
              </div>
            </div>

            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              spotsLeft === 0 
                ? 'bg-red-100 text-red-700'
                : spotsLeft <= 2
                ? 'bg-orange-100 text-orange-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {spotsLeft === 0 ? 'FULL' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
            </div>
          </div>

          {/* Game Details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-semibold text-gray-900">{formattedDate}</div>
                <div className="text-gray-600">at {formatTime(game.start_time)}</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">📍</span>
              <div>
                <div className="font-semibold text-gray-900">{game.venue_name}</div>
                {game.address && <div className="text-gray-600">{game.address}</div>}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">👥</span>
              <div>
                <div className="font-semibold text-gray-900">
                  {currentPlayers} / {game.max_players} players
                </div>
                <div className="text-gray-600">Players going</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {game.description && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">About this game</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{game.description}</p>
            </div>
          )}

          {/* RSVP Button */}
          {user && user.id !== game.created_by && (
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Join this game?</h3>
              <button
                onClick={handleRsvp}
                disabled={rsvpLoading || (spotsLeft === 0 && !isUserGoing)}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  isUserGoing
                    ? 'bg-red-100 hover:bg-red-200 text-red-700'
                    : 'bg-neon-green hover:bg-neon-green-dark text-navy'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {rsvpLoading ? 'Loading...' : isUserGoing ? '✓ Going - Click to Cancel' : '+ Join Game'}
              </button>
            </div>
          )}

          {/* Host */}
          {creator && (
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Hosted by</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold text-lg">
                  {creator.first_name[0]}
                </div>
                <div>
                  <div className="font-semibold">
                    {creator.first_name} {creator.last_name}
                  </div>
                  {creator.username && (
                    <div className="text-gray-500 text-sm">@{creator.username}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Who's going ({attendees.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold text-sm">
                      {attendee.first_name[0]}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {attendee.first_name} {attendee.last_name[0]}.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

