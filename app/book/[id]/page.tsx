'use client'

import { useEffect, useState } from 'react'
import { supabase, type Game, type Profile } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'

export default function PublicBookingPage() {
  const params = useParams()
  const gameId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [instructor, setInstructor] = useState<Profile | null>(null)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookingState, setBookingState] = useState<'form' | 'success' | 'error'>('form')
  
  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchGameDetails()
  }, [gameId])

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

      // Fetch instructor
      if (gameData.instructor_id) {
        const { data: instructorData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', gameData.instructor_id)
          .single()

        setInstructor(instructorData)
      }

      // Count RSVPs (including both user_id and guest RSVPs)
      const { data: rsvpsData, error: rsvpError } = await supabase
        .from('rsvps')
        .select('id')
        .eq('game_id', gameId)

      if (!rsvpError && rsvpsData) {
        setAttendeeCount(rsvpsData.length)
      }
    } catch (error) {
      console.error('Error fetching game details:', error)
      setBookingState('error')
      setErrorMessage('Unable to load session details. This link may be invalid.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!game || !firstName || !lastName || !email) {
      setErrorMessage('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      // Check if session is full
      if (attendeeCount >= game.max_players) {
        setErrorMessage('Sorry, this session is already full.')
        setSubmitting(false)
        return
      }

      // Check if email already booked
      const { data: existingRsvp } = await supabase
        .from('rsvps')
        .select('id')
        .eq('game_id', gameId)
        .eq('guest_email', email.toLowerCase())
        .single()

      if (existingRsvp) {
        setErrorMessage('This email address has already been registered for this session.')
        setSubmitting(false)
        return
      }

      // Create guest RSVP
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .insert({
          game_id: gameId,
          user_id: null, // Guest RSVP
          guest_first_name: firstName.trim(),
          guest_last_name: lastName.trim(),
          guest_email: email.toLowerCase().trim(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (rsvpError) throw rsvpError

      // Send confirmation email
      try {
        console.log('📧 Attempting to send confirmation email...')
        console.log('   To:', email)
        console.log('   Guest:', `${firstName.trim()} ${lastName.trim()}`)
        console.log('   Session:', game.description?.split('\n\n')[0] || game.sport)
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            to: email.toLowerCase().trim(),
            guestName: `${firstName.trim()} ${lastName.trim()}`,
            sessionTitle: game.description?.split('\n\n')[0] || game.sport,
            sessionDate: format(parseISO(game.game_date), 'EEEE, MMM d, yyyy'),
            sessionTime: formatTime(game.start_time),
            venueName: game.venue_name,
            venueAddress: game.address || '',
            instructorName: instructor ? `${instructor.first_name} ${instructor.last_name}` : '',
            cost: game.cost_cents,
            bookingId: rsvpData.id,
          }
        })
        
        if (emailError) {
          console.error('❌ Email function error:', emailError)
          console.error('   This usually means:')
          console.error('   1. Function not deployed (run: supabase functions deploy send-booking-confirmation)')
          console.error('   2. RESEND_API_KEY not set (run: supabase secrets set RESEND_API_KEY=...)')
          console.error('   3. Email domain not verified in Resend')
          console.error('')
          console.error('   See: EMAIL_FIX_START_HERE.md for complete fix')
        } else {
          console.log('✅ Email sent successfully!')
          console.log('   Message ID:', emailData?.messageId || emailData)
          console.log('   Check your inbox (and spam folder)')
        }
      } catch (emailError) {
        // Log email error but don't fail the booking
        console.error('❌ Exception sending confirmation email:', emailError)
        console.error('   Booking still succeeded, but email failed.')
        console.error('   See: EMAIL_FIX_START_HERE.md for fix')
      }

      // Success!
      setBookingState('success')
      await fetchGameDetails() // Update attendee count
    } catch (error: any) {
      console.error('Error creating RSVP:', error)
      setErrorMessage(error.message || 'Failed to book. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const formatCost = (costCents: number) => {
    if (costCents === 0) return 'Free'
    return `$${(costCents / 100).toFixed(0)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-blue"></div>
      </div>
    )
  }

  if (!game || bookingState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
          <p className="text-gray-600">
            {errorMessage || 'This booking link may be invalid or the session may have been cancelled.'}
          </p>
        </div>
      </div>
    )
  }

  if (bookingState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h1>
          <p className="text-gray-600 mb-6">
            Your spot has been reserved for this session. You should receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center space-x-2">
              <span>📅</span>
              <span className="text-sm font-medium text-gray-700">
                {format(parseISO(game.game_date), 'EEEE, MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🕐</span>
              <span className="text-sm font-medium text-gray-700">
                {formatTime(game.start_time)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>📍</span>
              <span className="text-sm font-medium text-gray-700">
                {game.venue_name}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            See you there! For questions, contact the instructor through the app.
          </p>
        </div>
      </div>
    )
  }

  const gameDate = parseISO(game.game_date)
  const formattedDate = format(gameDate, 'EEEE, MMMM d, yyyy')
  const spotsLeft = game.max_players - attendeeCount

  // Parse event title and description
  const parseEventDetails = (description: string | null | undefined) => {
    if (!description) return { title: game.sport, description: null }
    
    const parts = description.split('\n\n')
    if (parts.length >= 2) {
      return { title: parts[0], description: parts.slice(1).join('\n\n') }
    }
    return { title: description, description: null }
  }

  const { title: eventTitle, description: eventDescription } = parseEventDetails(game.description)

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <span className="text-xl font-bold text-gray-900">Pick Up</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Session Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-5xl">🧘</div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{eventTitle}</h1>
                  {game.skill_level && (
                    <span className="text-gray-500 capitalize text-sm">{game.skill_level}</span>
                  )}
                </div>
              </div>

              {/* Instructor */}
              {instructor && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="text-xs uppercase font-semibold text-gray-500 mb-2">Instructor</div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold text-lg">
                      {instructor.first_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {instructor.first_name} {instructor.last_name}
                      </div>
                      {instructor.instagram && (
                        <a 
                          href={`https://instagram.com/${instructor.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-blue text-sm hover:underline flex items-center gap-1"
                        >
                          <span>📷</span>
                          @{instructor.instagram.replace('@', '')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-4 mb-6">
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
                    {game.address && <div className="text-gray-600 text-sm">{game.address}</div>}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="font-semibold text-green-600">{formatCost(game.cost_cents)}</div>
                    <div className="text-gray-600 text-sm">per person</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className={`font-semibold ${spotsLeft === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {attendeeCount} / {game.max_players} participants
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {eventDescription && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="text-xs uppercase font-semibold text-gray-500 mb-2">About this session</div>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{eventDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sticky top-8">
              {spotsLeft === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Session Full</h3>
                  <p className="text-gray-600">
                    Sorry, all spots have been filled for this session.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserve Your Spot</h2>
                  <p className="text-gray-600 text-sm mb-6">
                    Fill out the form below to register for this session
                  </p>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent text-gray-900"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent text-gray-900"
                        placeholder="Doe"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-blue focus:border-transparent text-gray-900"
                        placeholder="john@example.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-lg font-semibold bg-gradient-to-r from-sky-blue to-neon-green text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {submitting ? 'Booking...' : '✓ Reserve My Spot'}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      By booking, you agree to receive confirmation and reminder emails about this session.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
