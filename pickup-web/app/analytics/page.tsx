'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { supabase, type Game } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const [teachingSessions, setTeachingSessions] = useState<Game[]>([])
  const [sessionAttendees, setSessionAttendees] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTeachingData()
    }
  }, [user])

  const fetchTeachingData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Fetch sessions where user is the instructor
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('games')
        .select('*')
        .eq('instructor_id', user.id)
        .gte('game_date', today)
        .order('game_date', { ascending: true })

      if (sessionsError) throw sessionsError

      setTeachingSessions(sessionsData || [])

      // Fetch RSVP counts for each session
      const attendeeCounts: Record<string, number> = {}
      for (const session of sessionsData || []) {
        const { count } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('game_id', session.id)

        attendeeCounts[session.id] = count || 0
      }

      setSessionAttendees(attendeeCounts)
    } catch (error) {
      console.error('Error fetching teaching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalStudents = Object.values(sessionAttendees).reduce((sum, count) => sum + count, 0)
  const totalRevenue = teachingSessions.reduce((sum, session) => {
    const attendees = sessionAttendees[session.id] || 0
    return sum + (session.cost_cents * attendees)
  }, 0)
  const instructorEarnings = totalRevenue * 0.5

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Teaching Analytics
          </h1>
          <p className="text-gray-600">
            Overview of your teaching sessions and earnings
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          </div>
        ) : teachingSessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No teaching sessions yet
            </h3>
            <p className="text-gray-500 mb-6">
              Claim your first session to start earning!
            </p>
            <Link href="/home" className="btn-primary inline-block">
              Browse Available Sessions
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Sessions */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
                    <p className="text-3xl font-bold text-navy mt-2">{teachingSessions.length}</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>

              {/* Total Students */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-navy mt-2">{totalStudents}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-semibold">Your Earnings</p>
                    <p className="text-3xl font-bold text-neon-green mt-2">
                      ${(instructorEarnings / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">50% of ${(totalRevenue / 100).toFixed(2)} total</p>
                  </div>
                  <div className="text-4xl">✨</div>
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-navy">Your Teaching Sessions</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {teachingSessions.map((session) => {
                  const attendees = sessionAttendees[session.id] || 0
                  const sessionRevenue = session.cost_cents * attendees
                  const sessionEarnings = sessionRevenue * 0.5
                  const gameDate = parseISO(session.game_date)

                  return (
                    <Link
                      key={session.id}
                      href={`/game/${session.id}`}
                      className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🎾</span>
                            <div>
                              <h3 className="font-semibold text-gray-900 capitalize">
                                {session.sport} Session
                              </h3>
                              <p className="text-sm text-gray-600">{session.venue_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>📅 {format(gameDate, 'MMM d, yyyy')}</span>
                            <span>🕐 {formatTime(session.start_time)}</span>
                            <span>👥 {attendees} student{attendees !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-neon-green">
                            ${(sessionEarnings / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            of ${(sessionRevenue / 100).toFixed(2)} total
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 How earnings work:</strong> You receive 50% of the total revenue from each session you teach. 
                Revenue is calculated as the session price (${(teachingSessions[0]?.cost_cents / 100 || 0).toFixed(2)}) 
                multiplied by the number of enrolled students.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

