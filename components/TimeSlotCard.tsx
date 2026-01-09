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
      return 'bg-gray-800/30 border-gray-700 opacity-40 cursor-not-allowed'
    }
    if (isAvailable) {
      return 'bg-green-500/10 border-green-500 hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer transform hover:scale-105 transition-all duration-300'
    }
    // Claimed
    return 'bg-red-500/10 border-red-500 cursor-default hover:bg-red-500/20 transition-all duration-300'
  }

  const handleClick = () => {
    if (!isPast && isAvailable) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`rounded-lg border-2 p-3 min-h-[80px] flex flex-col justify-center ${getCardStyles()}`}
    >
      {/* Status/Content */}
      {isPast ? (
        <div className="text-center text-gray-600 text-xs font-light">
          Past
        </div>
      ) : isAvailable ? (
        <div className="text-center">
          <div className="text-green-400 font-medium text-sm mb-1">
            Available
          </div>
          <div className="text-green-500/70 text-xs font-light">
            Click to claim
          </div>
        </div>
      ) : session ? (
        <div className="text-center">
          {session.custom_title && (
            <div className="text-red-400 text-sm font-medium mb-1 line-clamp-2">
              {session.custom_title}
            </div>
          )}
          {instructorName && (
            <div className="text-red-300/70 text-xs font-light">
              w/ {instructorName}
            </div>
          )}
          {!session.custom_title && !instructorName && (
            <div className="text-red-400 text-xs font-light">
              Claimed
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 text-xs font-light">
          Unavailable
        </div>
      )}
    </div>
  )
}
