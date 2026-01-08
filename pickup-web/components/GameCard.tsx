'use client'

import Link from 'next/link'
import { type Game } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const gameDate = parseISO(game.game_date)
  const formattedDate = format(gameDate, 'MMM d, yyyy')
  const isBooked = game.status === 'booked' || !!game.instructor_id

  // Format time (HH:mm:ss to h:mm AM/PM)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  // Get emoji based on sport
  const getSportEmoji = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'yoga':
        return '🧘'
      case 'pickleball':
        return '🏓'
      default:
        return '🎾'
    }
  }

  return (
    <Link href={`/game/${game.id}`}>
      <div className="game-card cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-3xl">{getSportEmoji(game.sport)}</div>
            <div>
              <h3 className="font-bold text-lg text-navy capitalize">{game.sport} Session</h3>
              {game.skill_level && (
                <span className="text-sm text-gray-500 capitalize">{game.skill_level}</span>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isBooked 
              ? 'bg-purple-100 text-purple-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {isBooked ? 'Booked' : 'Available'}
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
            <span className="font-medium">{formatTime(game.start_time)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-700">
            <span>📍</span>
            <span className="font-medium truncate">{game.venue_name}</span>
          </div>
        </div>

        {/* Description */}
        {game.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {game.description}
          </p>
        )}

        {/* Capacity Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">
              Capacity: {game.max_players} students
            </span>
          </div>
          <div className="text-sky-blue font-semibold text-sm">
            {isBooked ? 'View Details' : 'Claim Session'} →
          </div>
        </div>
      </div>
    </Link>
  )
}
