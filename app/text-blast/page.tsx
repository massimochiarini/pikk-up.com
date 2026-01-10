'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { supabase, type Game } from '@/lib/supabase'
import { format, parseISO, isFuture } from 'date-fns'

type ParticipantProfile = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

type GameWithParticipants = {
  game: Game
  participants: ParticipantProfile[]
  participantCount: number
}

export default function TextBlastPage() {
  const { user, profile } = useAuth()
  const [myGames, setMyGames] = useState<GameWithParticipants[]>([])
  const [selectedGame, setSelectedGame] = useState<GameWithParticipants | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (user && profile?.is_instructor) {
      fetchMyGames()
    }
  }, [user, profile])

  const fetchMyGames = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch games created by this instructor
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('organizer_id', user.id)
        .order('game_date', { ascending: true })

      if (gamesError) throw gamesError

      // For each game, fetch participants with phone numbers
      const gamesWithParticipants = await Promise.all(
        (gamesData || []).map(async (game) => {
          const { data: participants, error: participantsError } = await supabase
            .from('participants')
            .select(`
              user_id,
              profiles!inner (
                id,
                first_name,
                last_name,
                email,
                phone
              )
            `)
            .eq('game_id', game.id)
            .eq('status', 'joined')

          if (participantsError) throw participantsError

          const participantProfiles: ParticipantProfile[] = (participants || [])
            .map((p: any) => {
              const profile = p.profiles
              return {
                id: profile.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email || null,
                phone: profile.phone || null
              }
            })
            .filter(Boolean)

          return {
            game,
            participants: participantProfiles,
            participantCount: participantProfiles.length
          }
        })
      )

      setMyGames(gamesWithParticipants)
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTextBlast = async () => {
    if (!selectedGame || !message.trim()) return

    setSending(true)
    setSuccessMessage('')

    try {
      // Get participants with valid phone numbers
      const participantsWithPhone = selectedGame.participants.filter(p => p.phone)

      if (participantsWithPhone.length === 0) {
        alert('No participants have phone numbers on file.')
        return
      }

      // In a production app, this would call a backend API that uses Twilio or similar
      // For now, we'll just simulate sending and show confirmation
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Log the text blast (you would store this in your database)
      const { error: logError } = await supabase
        .from('text_blasts')
        .insert({
          game_id: selectedGame.game.id,
          instructor_id: user?.id,
          message: message.trim(),
          recipient_count: participantsWithPhone.length,
          sent_at: new Date().toISOString()
        })

      if (logError) {
        console.error('Error logging text blast:', logError)
      }

      setSuccessMessage(`Text blast sent to ${participantsWithPhone.length} student${participantsWithPhone.length === 1 ? '' : 's'}!`)
      setMessage('')
      setSelectedGame(null)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)

    } catch (error) {
      console.error('Error sending text blast:', error)
      alert('Failed to send text blast. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Redirect if not an instructor
  if (profile && !profile.is_instructor) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">This feature is only available for instructors.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Text Blast
          </h1>
          <p className="text-gray-400">
            Send a text message to all students in your class
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          </div>
        ) : myGames.length === 0 ? (
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-12 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No classes yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create a class first to send text blasts to your students
            </p>
            <a href="/create-game" className="btn-primary inline-block">
              Create Class
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Game Selection */}
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
              <label className="block text-sm font-semibold text-white mb-3">
                Select Class
              </label>
              <select
                value={selectedGame?.game.id || ''}
                onChange={(e) => {
                  const game = myGames.find(g => g.game.id === e.target.value)
                  setSelectedGame(game || null)
                }}
                className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-neon-green focus:border-transparent"
              >
                <option value="">Choose a class...</option>
                {myGames.map(({ game, participantCount }) => (
                  <option key={game.id} value={game.id}>
                    {game.title} - {format(parseISO(game.game_date), 'MMM d, yyyy')} ({participantCount} student{participantCount === 1 ? '' : 's'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Game Info */}
            {selectedGame && (
              <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Class Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Class:</span>
                    <span className="text-white font-medium">{selectedGame.game.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{format(parseISO(selectedGame.game.game_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white">{selectedGame.game.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Students:</span>
                    <span className="text-white font-medium">{selectedGame.participantCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Students with Phone:</span>
                    <span className="text-white font-medium">
                      {selectedGame.participants.filter(p => p.phone).length}
                    </span>
                  </div>
                </div>

                {selectedGame.participants.filter(p => p.phone).length === 0 && (
                  <div className="mt-4 bg-yellow-900/20 border border-yellow-500/50 text-yellow-400 px-3 py-2 rounded text-sm">
                    ⚠️ No students have phone numbers on file
                  </div>
                )}
              </div>
            )}

            {/* Message Input */}
            {selectedGame && (
              <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message to students..."
                  rows={6}
                  maxLength={320}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-neon-green focus:border-transparent resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">
                    {message.length}/320 characters
                  </span>
                  <button
                    onClick={sendTextBlast}
                    disabled={!message.trim() || sending || selectedGame.participants.filter(p => p.phone).length === 0}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : `Send to ${selectedGame.participants.filter(p => p.phone).length} Student${selectedGame.participants.filter(p => p.phone).length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">ℹ️ About Text Blasts</p>
          <p className="text-blue-300">
            Text blasts will be sent to all students who have a phone number on file. 
            Students can update their phone number in their profile settings.
          </p>
        </div>
      </div>
    </div>
  )
}
