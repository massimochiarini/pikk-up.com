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
      className={`rounded-lg border-2 p-2 h-full flex flex-col justify-center ${getCardStyles()}`}
    >

      {/* Status/Content */}
      {isPast ? (
        <div className="text-center text-gray-500 text-xs">
          Past
        </div>
      ) : isAvailable ? (
        <div className="text-center">
          <div className="text-green-700 font-semibold text-sm">
            Available
          </div>
          <div className="text-green-600 text-xs">
            Click to claim
          </div>
        </div>
      ) : session ? (
        <div className="text-center">
          {session.description && (
            <div className="text-red-700 text-xs font-semibold mb-1 line-clamp-1">
              {session.description.split('\n')[0]}
            </div>
          )}
          {instructorName && (
            <div className="text-red-600 text-xs">
              {instructorName}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-xs">
          Unavailable
        </div>
      )}
    </div>
  )
}
