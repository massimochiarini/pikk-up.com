'use client'

import { type Game } from '@/lib/supabase'

interface TimeSlotCardProps {
  date: string
  time: string
  timeDisplay: string
  session: Game | null
  isAvailable: boolean
  isPast: boolean
  instructorName?: string
  onClick: () => void
}

export function TimeSlotCard({
  date,
  time,
  timeDisplay,
  session,
  isAvailable,
  isPast,
  instructorName,
  onClick
}: TimeSlotCardProps) {
  const getCardStyles = () => {
    if (isPast) {
      return 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
    }
    if (isAvailable) {
      return 'bg-green-100 border-green-300 hover:bg-green-200 hover:shadow-md cursor-pointer transform hover:scale-105 transition-all'
    }
    // Claimed
    return 'bg-red-100 border-red-300 cursor-default'
  }

  const handleClick = () => {
    if (!isPast && isAvailable) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`rounded-lg border-2 p-3 min-h-[100px] flex flex-col justify-between ${getCardStyles()}`}
    >
      {/* Time */}
      <div className="font-bold text-sm text-navy mb-2">
        {timeDisplay}
      </div>

      {/* Status/Content */}
      <div className="flex-1 flex flex-col justify-center">
        {isPast ? (
          <div className="text-center text-gray-500 text-xs">
            Past
          </div>
        ) : isAvailable ? (
          <div className="text-center">
            <div className="text-green-700 font-semibold text-sm">
              Available
            </div>
            <div className="text-green-600 text-xs mt-1">
              Click to claim
            </div>
          </div>
        ) : session ? (
          <div className="text-center">
            <div className="text-red-700 font-semibold text-sm mb-1">
              Claimed
            </div>
            {instructorName && (
              <div className="text-red-600 text-xs">
                👤 {instructorName}
              </div>
            )}
            {session.skill_level && (
              <div className="text-red-600 text-xs mt-1 capitalize">
                {session.skill_level}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-xs">
            Unavailable
          </div>
        )}
      </div>

      {/* Capacity indicator for claimed sessions */}
      {!isPast && !isAvailable && session && (
        <div className="text-xs text-red-600 text-center mt-2">
          {session.max_players} max
        </div>
      )}
    </div>
  )
}
