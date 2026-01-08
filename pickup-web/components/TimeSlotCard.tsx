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
      return 'bg-gray-900/30 border-gray-800 opacity-40 cursor-not-allowed'
    }
    if (isAvailable) {
      return 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5 transition-all duration-300'
    }
    // Claimed
    return 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 cursor-default'
  }

  const handleClick = () => {
    if (!isPast && isAvailable) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl border p-4 h-24 flex flex-col justify-center ${getCardStyles()}`}
    >
      {/* Status/Content */}
      {isPast ? (
        <div className="text-center text-gray-600 text-xs font-light tracking-wide">
          Past
        </div>
      ) : isAvailable ? (
        <div className="text-center">
          <div className="text-white font-light text-sm tracking-wide mb-1">
            Available
          </div>
          <div className="text-gray-400 text-xs font-light tracking-wide">
            Click to book
          </div>
        </div>
      ) : session ? (
        <div className="text-center">
          {session.custom_title && (
            <div className="text-white text-sm font-light mb-1 line-clamp-2 tracking-wide">
              {session.custom_title}
            </div>
          )}
          {instructorName && (
            <div className="text-gray-400 text-xs font-light tracking-wide">
              w/ {instructorName}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 text-xs font-light tracking-wide">
          Unavailable
        </div>
      )}
    </div>
  )
}
