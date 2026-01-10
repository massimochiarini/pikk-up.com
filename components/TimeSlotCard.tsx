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
      return 'bg-gray-200 border-gray-300 opacity-50 cursor-not-allowed'
    }
    if (isAvailable) {
      return 'bg-green-50 border-green-500 hover:bg-green-100 hover:shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300'
    }
    // Claimed
    return 'bg-red-50 border-red-500 cursor-default hover:bg-red-100 transition-all duration-300'
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
        <div className="text-center text-gray-500 text-xs font-semibold">
          Past
        </div>
      ) : isAvailable ? (
        <div className="text-center">
          <div className="text-green-600 font-semibold text-sm mb-1">
            Available
          </div>
          <div className="text-green-600/70 text-xs font-medium">
            Click to claim
          </div>
        </div>
      ) : session ? (
        <div className="text-center">
          {session.custom_title && (
            <div className="text-red-600 text-sm font-semibold mb-1 line-clamp-2">
              {session.custom_title}
            </div>
          )}
          {instructorName && (
            <div className="text-red-500 text-xs font-medium">
              w/ {instructorName}
            </div>
          )}
          {!session.custom_title && !instructorName && (
            <div className="text-red-600 text-xs font-semibold">
              Claimed
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-xs font-semibold">
          Unavailable
        </div>
      )}
    </div>
  )
}
