'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { GameCard } from '@/components/GameCard'
import { useEffect, useState } from 'react'
import { supabase, type Game } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [joinedGames, setJoinedGames] = useState<Game[]>([])
  const [hostingGames, setHostingGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'joined' | 'hosting' | 'teaching'>('upcoming')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'booked'>('all')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchGames()
    }
  }, [user])

  useEffect(() => {
    filterGames()
  }, [games, filter, statusFilter])

  const fetchGames = async () => {
    if (!user) return

    try {
      setGamesLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      
      // Calculate date 30 days from now
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      const maxDate = thirtyDaysFromNow.toISOString().split('T')[0]
      
      // Fetch available studio sessions (unclaimed, yoga only, within 30 days)
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('sport', 'yoga')
        .is('claimed_by', null)
        .gte('game_date', today)
        .lte('game_date', maxDate)
        .order('game_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      
      // Filter out sessions that have already passed (including time)
      const upcomingSessions = (data || []).filter(game => {
        const gameDateTime = new Date(`${game.game_date}T${game.start_time}`)
        return gameDateTime > now
      })
      
      setGames(upcomingSessions)

      // Fetch sessions I've claimed as an instructor
      const { data: claimedData, error: claimedError } = await supabase
        .from('games')
        .select('*')
        .eq('claimed_by', user.id)
        .gte('game_date', today)
        .order('game_date', { ascending: true })

      if (claimedError) throw claimedError

      // Filter out sessions that have already passed (including time)
      const upcomingClaimedSessions = (claimedData || []).filter(game => {
        const gameDateTime = new Date(`${game.game_date}T${game.start_time}`)
        return gameDateTime > now
      })

      setHostingGames(upcomingClaimedSessions)

      // For now, instructors don't "join" sessions as attendees
      // This feature is for mobile app users (students)
      setJoinedGames([])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setGamesLoading(false)
    }
  }

  const filterGames = () => {
    let filtered: Game[] = []
    
    if (filter === 'upcoming') {
      filtered = games
    } else if (filter === 'joined') {
      filtered = joinedGames
    } else if (filter === 'hosting') {
      filtered = hostingGames
    } else if (filter === 'teaching') {
      // Show sessions where user is the instructor
      filtered = games.filter(game => game.instructor_id === user?.id)
    }

    // Apply status filter
    if (statusFilter === 'available') {
      filtered = filtered.filter(game => !game.instructor_id && game.status !== 'booked')
    } else if (statusFilter === 'booked') {
      filtered = filtered.filter(game => game.instructor_id || game.status === 'booked')
    }

    setFilteredGames(filtered)
  }

  if (loading || !user) {
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
            {filter === 'upcoming' && 'All Sessions'}
            {filter === 'joined' && 'Joined Sessions'}
            {filter === 'hosting' && 'Hosting Sessions'}
            {filter === 'teaching' && 'Teaching Sessions'}
          </h1>
          <p className="text-gray-600">
            {filter === 'upcoming' && 'Browse and claim available sessions'}
            {filter === 'joined' && 'Sessions you\'re attending as a student'}
            {filter === 'hosting' && 'Sessions you\'re hosting'}
            {filter === 'teaching' && 'Sessions you\'re teaching as an instructor'}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Main Filters */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'upcoming'
                  ? 'bg-neon-green text-navy'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilter('teaching')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'teaching'
                  ? 'bg-neon-green text-navy'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Teaching
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'joined'
                  ? 'bg-neon-green text-navy'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Attending
            </button>
            <button
              onClick={() => setFilter('hosting')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'hosting'
                  ? 'bg-neon-green text-navy'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Hosting
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto">
            <span className="text-sm text-gray-600 px-2 py-1.5">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'available'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('booked')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'booked'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Booked
            </button>
          </div>
        </div>

        {/* Sessions Grid */}
        {gamesLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧘</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {filter === 'upcoming' ? 'No available sessions' : 'No claimed sessions yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'upcoming' 
                ? 'Check back soon for new studio availability!' 
                : 'Browse available sessions to claim your first time slot'}
            </p>
            {filter === 'hosting' && (
              <button
                onClick={() => setFilter('upcoming')}
                className="btn-primary"
              >
                Browse Available Sessions
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

