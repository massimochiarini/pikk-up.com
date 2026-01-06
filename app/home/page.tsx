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
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today'>('all')

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
    try {
      setGamesLoading(true)
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setGamesLoading(false)
    }
  }

  const filterGames = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    let filtered = games

    if (filter === 'today') {
      filtered = games.filter(game => game.date === today)
    } else if (filter === 'upcoming') {
      filtered = games.filter(game => {
        const gameDate = new Date(game.date)
        return gameDate >= now
      })
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
            Discover Games
          </h1>
          <p className="text-gray-600">
            Find and join pickleball games in your area
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-neon-green text-navy'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Games
          </button>
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
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'today'
                ? 'bg-neon-green text-navy'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Today
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

