'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { GameCard } from '@/components/GameCard'
import { useEffect, useState } from 'react'
import { supabase, type Game } from '@/lib/supabase'

export default function MyGamesPage() {
  const { user } = useAuth()
  const [myGames, setMyGames] = useState<Game[]>([])
  const [joinedGames, setJoinedGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'joined' | 'hosting'>('joined')

  useEffect(() => {
    if (user) {
      fetchMyGames()
    }
  }, [user])

  const fetchMyGames = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch games I'm hosting
      const { data: hostedData, error: hostedError } = await supabase
        .from('games')
        .select('*')
        .eq('created_by', user.id)
        .order('date', { ascending: true })

      if (hostedError) throw hostedError

      // Fetch games I've RSVPed to
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .select('game_id')
        .eq('user_id', user.id)
        .eq('status', 'going')

      if (rsvpError) throw rsvpError

      const gameIds = rsvpData.map(rsvp => rsvp.game_id)

      if (gameIds.length > 0) {
        const { data: joinedData, error: joinedError } = await supabase
          .from('games')
          .select('*')
          .in('id', gameIds)
          .neq('created_by', user.id)
          .order('date', { ascending: true })

        if (joinedError) throw joinedError
        setJoinedGames(joinedData || [])
      }

      setMyGames(hostedData || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            My Games
          </h1>
          <p className="text-gray-600">
            View games you're hosting or attending
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('joined')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'joined'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Joined Games ({joinedGames.length})
          </button>
          <button
            onClick={() => setActiveTab('hosting')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'hosting'
                ? 'text-neon-green border-b-2 border-neon-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Hosting ({myGames.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          </div>
        ) : (
          <>
            {activeTab === 'joined' && (
              <>
                {joinedGames.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🎾</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No games joined yet
                    </h3>
                    <p className="text-gray-500">
                      Discover and join games in your area
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {joinedGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'hosting' && (
              <>
                {myGames.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No games hosted yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Create your first game and invite others to join
                    </p>
                    <a href="/create-game" className="btn-primary inline-block">
                      Create Game
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
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

