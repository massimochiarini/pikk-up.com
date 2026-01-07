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
  const [filter, setFilter] = useState<'upcoming' | 'joined' | 'hosting'>('upcoming')

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
  }, [games, filter])

  const fetchGames = async () => {
    if (!user) return

    try {
      setGamesLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      
      // Fetch all upcoming games
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .gte('game_date', today)
        .order('game_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      
      // Filter out games that have already passed (including time)
      const upcomingGames = (data || []).filter(game => {
        const gameDateTime = new Date(`${game.game_date}T${game.start_time}`)
        return gameDateTime > now
      })
      
      setGames(upcomingGames)

      // Fetch games I'm hosting (only future games)
      const { data: hostedData, error: hostedError } = await supabase
        .from('games')
        .select('*')
        .eq('created_by', user.id)
        .gte('game_date', today)
        .order('game_date', { ascending: true })

      if (hostedError) throw hostedError

      // Filter out games that have already passed (including time)
      const upcomingHostedGames = (hostedData || []).filter(game => {
        const gameDateTime = new Date(`${game.game_date}T${game.start_time}`)
        return gameDateTime > now
      })

      setHostingGames(upcomingHostedGames)

      // Fetch games I've RSVPed to
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .select('game_id')
        .eq('user_id', user.id)

      if (rsvpError) throw rsvpError

      const gameIds = rsvpData.map(rsvp => rsvp.game_id)

      if (gameIds.length > 0) {
        const { data: joinedData, error: joinedError } = await supabase
          .from('games')
          .select('*')
          .in('id', gameIds)
          .neq('created_by', user.id)
          .gte('game_date', today)
          .order('game_date', { ascending: true })

        if (joinedError) throw joinedError
        
        // Filter out games that have already passed (including time)
        const upcomingJoinedGames = (joinedData || []).filter(game => {
          const gameDateTime = new Date(`${game.game_date}T${game.start_time}`)
          return gameDateTime > now
        })
        
        setJoinedGames(upcomingJoinedGames)
      } else {
        setJoinedGames([])
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setGamesLoading(false)
    }
  }

  const filterGames = () => {
    if (filter === 'upcoming') {
      setFilteredGames(games)
    } else if (filter === 'joined') {
      setFilteredGames(joinedGames)
    } else if (filter === 'hosting') {
      setFilteredGames(hostingGames)
    }
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
            {filter === 'upcoming' && 'Discover Games'}
            {filter === 'joined' && 'Joined Games'}
            {filter === 'hosting' && 'Hosting Games'}
          </h1>
          <p className="text-gray-600">
            {filter === 'upcoming' && 'Find and join pickleball games in your area'}
            {filter === 'joined' && 'View games you\'re attending'}
            {filter === 'hosting' && 'Manage games you\'re hosting'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'upcoming'
                ? 'bg-neon-green text-navy'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('joined')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'joined'
                ? 'bg-neon-green text-navy'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Joined
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

        {/* Games Grid */}
        {gamesLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎾</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No games found
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to create a game!
            </p>
            <button
              onClick={() => router.push('/create-game')}
              className="btn-primary"
            >
              Create Game
            </button>
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

