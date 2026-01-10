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
  const [guestAttendees, setGuestAttendees] = useState<RSVP[]>([])
  const [userRsvp, setUserRsvp] = useState<RSVP | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

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
        // Separate user RSVPs and guest RSVPs
        const userRsvps = rsvpsData
          .filter(rsvp => rsvp.user_id !== null)
          .map(rsvp => (rsvp as any).profiles)
          .filter(Boolean)
        
        const guestRsvps = rsvpsData
          .filter(rsvp => rsvp.user_id === null)
        
        setAttendees(userRsvps)
        setGuestAttendees(guestRsvps)
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

  const handleCopyBookingLink = async () => {
    const bookingUrl = `${window.location.origin}/book/${gameId}`
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
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
  
  const currentPlayers = attendees.length + guestAttendees.length
  const spotsLeft = game.max_players - currentPlayers
  const isUserGoing = userRsvp !== null
  const isUserInstructor = user && game.instructor_id === user.id
  const isSessionBooked = game.status === 'booked' || !!game.instructor_id
  const isSessionAvailable = !isSessionBooked

  // Parse event title and description
  // Description format: "Event Name\n\nActual description"
  const parseEventDetails = (description: string | null | undefined) => {
    if (!description) return { title: game.sport, description: null }
    
    const parts = description.split('\n\n')
    if (parts.length >= 2) {
      return { title: parts[0], description: parts.slice(1).join('\n\n') }
    }
    // If no separator, use entire description as title
    return { title: description, description: null }
  }

  const { title: eventTitle, description: eventDescription } = parseEventDetails(game.description)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-black mb-6 flex items-center gap-2 font-medium transition-colors"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-6xl">🧘</div>
                <div>
                  <h1 className="text-4xl font-bold text-black mb-2">{eventTitle}</h1>
                  {game.skill_level && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 capitalize">
                      {game.skill_level}
                    </span>
                  )}
                </div>
              </div>

              <div className={`px-5 py-2.5 rounded-full text-sm font-bold ${
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <span className="text-3xl">📅</span>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Date & Time</div>
                  <div className="font-semibold text-black">{formattedDate}</div>
                  <div className="text-gray-600">{formatTime(game.start_time)}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-3xl">📍</span>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Location</div>
                  <div className="font-semibold text-black">{game.venue_name}</div>
                  {game.address && <div className="text-gray-600 text-sm">{game.address}</div>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-3xl">👥</span>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Participants</div>
                  <div className="font-semibold text-black">
                    {currentPlayers} / {game.max_players} attending
                  </div>
                  <div className="text-gray-600 text-sm">
                    {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} available
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {eventDescription && (
            <div className="p-8 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-black mb-3">About this session</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{eventDescription}</p>
            </div>
          )}

          {/* Instructor Claiming Section */}
          {user && user.id !== game.created_by && (
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black mb-4">
                {isUserInstructor ? 'You are teaching this session' : 'Claim this session'}
              </h3>
              
              {claimError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {claimError}
                </div>
              )}

              {isUserInstructor ? (
                <>
                  <button
                    onClick={handleUnclaimSession}
                    disabled={claimLoading}
                    className="w-full py-3.5 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-black transition-colors disabled:opacity-50 mb-4"
                  >
                    {claimLoading ? 'Releasing...' : 'Release Session'}
                  </button>

                  {/* Booking Link Section */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-green-900 text-sm">📎 Public Booking Link</h4>
                      <button
                        onClick={handleCopyBookingLink}
                        className="text-xs bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        {copySuccess ? '✓ Copied!' : 'Copy Link'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Share this link with clients so they can RSVP without downloading the app
                    </p>
                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 font-mono break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/book/${gameId}` : '...'}
                    </div>
                  </div>
                </>
              ) : isSessionAvailable ? (
                <button
                  onClick={handleClaimSession}
                  disabled={claimLoading}
                  className="w-full py-3.5 rounded-xl font-bold bg-black hover:bg-gray-800 text-white transition-colors disabled:opacity-50"
                >
                  {claimLoading ? 'Claiming...' : '✓ Claim as Instructor'}
                </button>
              ) : (
                <div className="w-full py-3.5 rounded-xl font-semibold bg-purple-50 text-purple-700 text-center border border-purple-200">
                  ✓ This session has been claimed by an instructor
                </div>
              )}

              <p className="text-sm text-gray-600 mt-3">
                {isUserInstructor 
                  ? 'Share the booking link with your clients to allow them to register'
                  : isSessionAvailable
                  ? 'Claim this session to teach it. One instructor per session.'
                  : 'This session has been claimed by another instructor'}
              </p>
            </div>
          )}

          {/* Host Actions */}
          {user && user.id === game.created_by && (
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black mb-4">Manage Session</h3>
              
              {isSessionBooked && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-700 font-medium">
                    ✓ This session has been claimed by an instructor
                  </p>
                </div>
              )}
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="w-full py-3.5 rounded-xl font-bold bg-red-50 hover:bg-red-100 text-red-700 transition-colors disabled:opacity-50 border border-red-200"
              >
                {isDeleting ? 'Canceling...' : 'Cancel Session'}
              </button>
            </div>
          )}

          {/* RSVP Button */}
          {user && user.id !== game.created_by && (
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black mb-4">Join this session?</h3>
              <button
                onClick={handleRsvp}
                disabled={rsvpLoading || (spotsLeft === 0 && !isUserGoing)}
                className={`w-full py-3.5 rounded-xl font-bold transition-colors ${
                  isUserGoing
                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    : 'bg-black hover:bg-gray-800 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {rsvpLoading ? 'Loading...' : isUserGoing ? '✓ Attending - Click to Cancel' : '+ Join Session'}
              </button>
            </div>
          )}

          {/* Host */}
          {creator && (
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black mb-4">Hosted by</h3>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {creator.first_name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-black text-lg">
                    {creator.first_name} {creator.last_name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {creator.username && (
                      <div className="text-gray-600 text-sm">@{creator.username}</div>
                    )}
                    {creator.instagram && (
                      <>
                        {creator.username && <span className="text-gray-400">•</span>}
                        <a
                          href={`https://instagram.com/${creator.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700 text-sm flex items-center gap-1 transition-colors font-medium"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          @{creator.instagram}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendees */}
          {(attendees.length > 0 || guestAttendees.length > 0) && (
            <div className="p-8">
              <h3 className="text-lg font-bold text-black mb-4">
                Who's going ({currentPlayers})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* User attendees */}
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold shadow-sm">
                      {attendee.first_name[0]}
                    </div>
                    <div className="text-sm font-semibold text-black truncate">
                      {attendee.first_name} {attendee.last_name[0]}.
                    </div>
                  </div>
                ))}
                {/* Guest attendees */}
                {guestAttendees.map((guest) => (
                  <div key={guest.id} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold shadow-sm">
                      {guest.guest_first_name?.[0] || '?'}
                    </div>
                    <div className="text-sm font-semibold text-black truncate">
                      {guest.guest_first_name} {guest.guest_last_name?.[0]}.
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
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-black mb-3">Cancel Session?</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Are you sure you want to cancel this session? This will also delete the group chat and 
                remove all bookings. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-50 py-3 px-4 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGame}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
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

