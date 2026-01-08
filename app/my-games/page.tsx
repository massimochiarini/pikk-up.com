'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { supabase, type Game } from '@/lib/supabase'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

export default function MyClassesPage() {
  const { user } = useAuth()
  const [upcomingClasses, setUpcomingClasses] = useState<Game[]>([])
  const [pastClasses, setPastClasses] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (user) {
      fetchMyClasses()
    }
  }, [user])

  const fetchMyClasses = async () => {
    if (!user) return

    try {
      setLoading(true)
      const now = new Date()

      // Fetch all classes where I'm the instructor
      const { data: allClasses, error } = await supabase
        .from('games')
        .select('*')
        .eq('instructor_id', user.id)
        .order('game_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error

      // Split into upcoming and past
      const upcoming = [] as Game[]
      const past = [] as Game[]

      (allClasses || []).forEach(session => {
        const sessionDateTime = new Date(`${session.game_date}T${session.start_time}`)
        if (sessionDateTime > now) {
          upcoming.push(session)
        } else {
          past.push(session)
        }
      })

      // Sort upcoming ascending (soonest first), past descending (most recent first)
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.game_date}T${a.start_time}`)
        const dateB = new Date(`${b.game_date}T${b.start_time}`)
        return dateA.getTime() - dateB.getTime()
      })

      setUpcomingClasses(upcoming)
      setPastClasses(past)
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format time helper
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  // Get status badge
  const getStatusBadge = (session: Game) => {
    const sessionDateTime = new Date(`${session.game_date}T${session.start_time}`)
    const now = new Date()
    
    if (sessionDateTime < now) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Completed</span>
    }
    
    if (session.status === 'booked') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Booked</span>
    }
    
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Scheduled</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            My Classes Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your teaching schedule and view class analytics
          </p>
        </div>

        {/* Stats Summary */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-sm text-gray-600 mb-1">Income</div>
              <div className="text-3xl font-bold text-navy">{upcomingClasses.length}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-sm text-gray-600 mb-1">Students Taught</div>
              <div className="text-3xl font-bold text-navy">{pastClasses.length}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-sm text-gray-600 mb-1">Total Classes</div>
              <div className="text-3xl font-bold text-navy">{upcomingClasses.length + pastClasses.length}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-semibold transition-all rounded-t-lg ${
              activeTab === 'upcoming'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming ({upcomingClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 font-semibold transition-all rounded-lg ${
              activeTab === 'past'
                ? 'bg-neon-green text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Past Sessions ({pastClasses.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          </div>
        ) : (
          <>
            {activeTab === 'upcoming' && (
              <>
                {upcomingClasses.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No upcoming sessions
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Browse available sessions to claim your next time slot
                    </p>
                    <Link href="/home" className="btn-primary inline-block">
                      Browse Available Sessions
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingClasses.map((session) => {
                      const sessionDate = parseISO(session.game_date)
                      const formattedDate = format(sessionDate, 'EEEE, MMM d, yyyy')
                      
                      return (
                        <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-4xl">🧘</div>
                              <div>
                                <h3 className="font-bold text-lg text-navy capitalize">
                                  {session.sport} Class
                                </h3>
                                <p className="text-sm text-gray-600">{session.venue_name}</p>
                              </div>
                            </div>
                            {getStatusBadge(session)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="flex items-center space-x-2 text-gray-700 mb-2">
                                <span>📅</span>
                                <span className="font-medium">{formattedDate}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-700">
                                <span>🕐</span>
                                <span className="font-medium">{formatTime(session.start_time)}</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 text-gray-700 mb-2">
                                <span>👥</span>
                                <span className="font-medium">Capacity: {session.max_players} students</span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-700">
                                <span>📍</span>
                                <span className="font-medium truncate">{session.address}</span>
                              </div>
                            </div>
                          </div>

                          {session.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {session.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            <Link 
                              href={`/game/${session.id}`}
                              className="btn-secondary flex-1 text-center"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'past' && (
              <>
                {pastClasses.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No past sessions yet
                    </h3>
                    <p className="text-gray-500">
                      Your completed classes will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastClasses.map((session) => {
                      const sessionDate = parseISO(session.game_date)
                      const formattedDate = format(sessionDate, 'EEEE, MMM d, yyyy')
                      
                      return (
                        <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow opacity-90">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-4xl grayscale">🧘</div>
                              <div>
                                <h3 className="font-bold text-lg text-navy capitalize">
                                  {session.sport} Class
                                </h3>
                                <p className="text-sm text-gray-600">{session.venue_name}</p>
                              </div>
                            </div>
                            {getStatusBadge(session)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="flex items-center space-x-2 text-gray-700 mb-2">
                                <span>📅</span>
                                <span className="font-medium">{formattedDate}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-700">
                                <span>🕐</span>
                                <span className="font-medium">{formatTime(session.start_time)}</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 text-gray-700 mb-2">
                                <span>👥</span>
                                <span className="font-medium">Capacity: {session.max_players} students</span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-700">
                                <span>📍</span>
                                <span className="font-medium truncate">{session.address}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            <Link 
                              href={`/game/${session.id}`}
                              className="btn-secondary flex-1 text-center"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

