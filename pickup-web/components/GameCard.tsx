'use client'

import Link from 'next/link'
import { type Game } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const gameDate = parseISO(game.date)
  const formattedDate = format(gameDate, 'MMM d, yyyy')
  const spotsLeft = game.players_needed - game.current_players

  return (
    <Link href={`/game/${game.id}`}>
      <div className="game-card cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-3xl">🎾</div>
            <div>
              <h3 className="font-bold text-lg text-navy">{game.sport}</h3>
              {game.skill_level && (
                <span className="text-sm text-gray-500">{game.skill_level}</span>
              )}
            </div>
          </div>
          
          {/* Spots Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            spotsLeft === 0 
              ? 'bg-red-100 text-red-700'
              : spotsLeft <= 2
              ? 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <span>📅</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-700">
            <span>🕐</span>
            <span className="font-medium">{game.time}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-700">
            <span>📍</span>
            <span className="font-medium truncate">{game.location}</span>
          </div>
        </div>

        {/* Description */}
        {game.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {game.description}
          </p>
        )}

        {/* Players Count */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">
              {game.current_players} / {game.players_needed} players
            </span>
          </div>
          <div className="text-sky-blue font-semibold text-sm">
            View Details →
          </div>
        </div>
      </div>
    </Link>
  )
}

