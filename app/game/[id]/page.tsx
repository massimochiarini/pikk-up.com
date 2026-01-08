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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState('')

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
        
        // Also remove from group chat
        const { data: groupChat } = await supabase
          .from('group_chats')
          .select('id')
          .eq('game_id', gameId)
          .single()
        
        if (groupChat) {
          await supabase
            .from('group_chat_members')
            .delete()
            .eq('group_chat_id', groupChat.id)
            .eq('user_id', user.id)
        }
      } else {
        // Not RSVPed yet - add RSVP
        await supabase
          .from('rsvps')
          .insert({
            game_id: gameId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          })
        
        // Also add to group chat
        const { data: groupChat } = await supabase
          .from('group_chats')
          .select('id')
          .eq('game_id', gameId)
          .single()
        
        if (groupChat) {
          await supabase
            .from('group_chat_members')
            .insert({
              group_chat_id: groupChat.id,
              user_id: user.id,
              joined_at: new Date().toISOString(),
            })
        }
      }

      // Refresh data
      await fetchGameDetails()
    } catch (error) {
      console.error('Error updating RSVP:', error)
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleClaimSession = async () => {
    if (!user || !game) return

    setClaimLoading(true)
    setClaimError('')

    try {
      // Check if already booked
      if (game.status === 'booked' && game.instructor_id && game.instructor_id !== user.id) {
        setClaimError('This session has already been claimed by another instructor')
        return
      }

      // Call the claim_session function
      const { data, error } = await supabase.rpc('claim_session', {
        p_game_id: gameId,
        p_instructor_id: user.id
      })

      if (error) throw error

      if (data && !data.success) {
        setClaimError(data.error || 'Failed to claim session')
        return
      }

      // Refresh game details
      await fetchGameDetails()
    } catch (error: any) {
      console.error('Error claiming session:', error)
      setClaimError(error.message || 'Failed to claim session')
    } finally {
      setClaimLoading(false)
    }
  }

  const handleUnclaimSession = async () => {
    if (!user || !game) return

    setClaimLoading(true)
    setClaimError('')

    try {
      // Call the unclaim_session function
      const { data, error } = await supabase.rpc('unclaim_session', {
        p_game_id: gameId,
        p_instructor_id: user.id
      })

      if (error) throw error

      if (data && !data.success) {
        setClaimError(data.error || 'Failed to release session')
        return
      }

      // Refresh game details
      await fetchGameDetails()
    } catch (error: any) {
      console.error('Error releasing session:', error)
      setClaimError(error.message || 'Failed to release session')
    } finally {
      setClaimLoading(false)
    }
  }

  const handleDeleteGame = async () => {
    if (!user || !game || game.created_by !== user.id) return

    setIsDeleting(true)
    try {
      // Delete group chat messages first
      const { data: groupChat } = await supabase
        .from('group_chats')
        .select('id')
        .eq('game_id', gameId)
        .single()

      if (groupChat) {
        // Delete messages
        await supabase
          .from('group_messages')
          .delete()
          .eq('group_chat_id', groupChat.id)

        // Delete members
        await supabase
          .from('group_chat_members')
          .delete()
          .eq('group_chat_id', groupChat.id)

        // Delete group chat
        await supabase
          .from('group_chats')
          .delete()
          .eq('id', groupChat.id)
      }

      // Delete RSVPs
      await supabase
        .from('rsvps')
        .delete()
        .eq('game_id', gameId)

      // Delete the game
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)
        .eq('created_by', user.id) // Extra safety check

      if (error) throw error

      // Redirect to my games
      router.push('/my-games')
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('Failed to delete game. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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
  const isUserInstructor = user && game.instructor_id === user.id
  const isSessionBooked = game.status === 'booked' || !!game.instructor_id
  const isSessionAvailable = !isSessionBooked

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
                  {currentPlayers} / {game.max_players} participants
                </div>
                <div className="text-gray-600">Participants attending</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {game.description && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">About this session</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{game.description}</p>
            </div>
          )}

          {/* Instructor Claiming Section */}
          {user && user.id !== game.created_by && (
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">
                {isUserInstructor ? 'You are teaching this session' : 'Claim this session'}
              </h3>
              
              {claimError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {claimError}
                </div>
              )}

              {isUserInstructor ? (
                <button
                  onClick={handleUnclaimSession}
                  disabled={claimLoading}
                  className="w-full py-3 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50"
                >
                  {claimLoading ? 'Releasing...' : 'Release Session'}
                </button>
              ) : isSessionAvailable ? (
                <button
                  onClick={handleClaimSession}
                  disabled={claimLoading}
                  className="w-full py-3 rounded-lg font-semibold bg-neon-green hover:bg-neon-green-dark text-navy transition-colors disabled:opacity-50"
                >
                  {claimLoading ? 'Claiming...' : '✓ Claim as Instructor'}
                </button>
              ) : (
                <div className="w-full py-3 rounded-lg font-semibold bg-purple-50 text-purple-700 text-center">
                  Already Booked by Another Instructor
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {isUserInstructor 
                  ? 'Release this session to make it available for other instructors'
                  : isSessionAvailable
                  ? 'Claim this session to teach it. One instructor per session.'
                  : 'This session has been claimed by another instructor'}
              </p>
            </div>
          )}

          {/* Class Analytics - Instructor View */}
          {isUserInstructor && (
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Class Analytics
              </h3>
              
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 space-y-4">
                {/* Number of Students */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    <span className="text-gray-700 font-medium">Students Enrolled</span>
                  </div>
                  <div className="text-2xl font-bold text-navy">
                    {currentPlayers}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-purple-200"></div>

                {/* Total Revenue */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-gray-700 font-medium">Total Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${((game.cost_cents * currentPlayers) / 100).toFixed(2)}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-purple-200"></div>

                {/* Instructor Cut */}
                <div className="flex items-center justify-between bg-white/60 rounded-lg p-4 -mx-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    <div>
                      <div className="text-gray-700 font-semibold">Your Earnings</div>
                      <div className="text-xs text-gray-500">50% instructor cut</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-neon-green">
                    ${((game.cost_cents * currentPlayers * 0.5) / 100).toFixed(2)}
                  </div>
                </div>

                {/* Info Note */}
                <div className="text-xs text-gray-600 bg-white/40 rounded p-3 mt-4">
                  <p>💡 <strong>Revenue Breakdown:</strong> ${(game.cost_cents / 100).toFixed(2)} per student × {currentPlayers} student{currentPlayers !== 1 ? 's' : ''} = ${((game.cost_cents * currentPlayers) / 100).toFixed(2)} total</p>
                  <p className="mt-1">As the instructor, you receive 50% of total revenue.</p>
                </div>
              </div>
            </div>
          )}

          {/* Host Actions */}
          {user && user.id === game.created_by && (
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Manage Session</h3>
              
              {isSessionBooked && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-purple-700">
                    ✓ This session has been claimed by an instructor
                  </p>
                </div>
              )}
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="w-full py-3 rounded-lg font-semibold bg-red-50 hover:bg-red-100 text-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Canceling...' : 'Cancel Session'}
              </button>
            </div>
          )}

          {/* RSVP Button */}
          {user && user.id !== game.created_by && (
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Join this session?</h3>
              <button
                onClick={handleRsvp}
                disabled={rsvpLoading || (spotsLeft === 0 && !isUserGoing)}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  isUserGoing
                    ? 'bg-red-100 hover:bg-red-200 text-red-700'
                    : 'bg-neon-green hover:bg-neon-green-dark text-navy'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {rsvpLoading ? 'Loading...' : isUserGoing ? '✓ Attending - Click to Cancel' : '+ Join Session'}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-navy mb-3">Cancel Session?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this session? This will also delete the group chat and 
                remove all bookings. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGame}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Canceling...' : 'Cancel Session'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

