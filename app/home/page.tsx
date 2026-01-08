'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { TimeSlotCard } from '@/components/TimeSlotCard'
import { BookingModal } from '@/components/BookingModal'
import { useEffect, useState } from 'react'
import { supabase, type Game } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isPast, parseISO } from 'date-fns'

const TIME_SLOTS = [
  { time: '07:00:00', display: '7:00 AM', duration: '1.5h' },
  { time: '09:00:00', display: '9:00 AM', duration: '1.5h' },
  { time: '11:00:00', display: '11:00 AM', duration: '1.5h' },
  { time: '13:00:00', display: '1:00 PM', duration: '1.5h' },
  { time: '17:00:00', display: '5:00 PM', duration: '1.5h' },
  { time: '19:00:00', display: '7:00 PM', duration: '1.5h' },
]

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  // Get Monday of current week as default
  const getWeekStart = (date: Date) => {
    return startOfWeek(date, { weekStartsOn: 1 }) // 1 = Monday
  }
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [sessions, setSessions] = useState<Game[]>([])
  const [instructorProfiles, setInstructorProfiles] = useState<Map<string, string>>(new Map())
  const [gamesLoading, setGamesLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchWeekSessions()
    }
  }, [user, currentWeekStart])

  const fetchWeekSessions = async () => {
    if (!user) return

    try {
      setGamesLoading(true)
      
      // Calculate week range
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(weekEnd, 'yyyy-MM-dd')

      // Fetch all sessions for the week
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('sport', 'yoga')
        .gte('game_date', startDate)
        .lte('game_date', endDate)
        .order('game_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      setSessions(data || [])

      // Fetch instructor profiles for claimed sessions
      const instructorIds = [...new Set((data || [])
        .filter(s => s.instructor_id)
        .map(s => s.instructor_id))]

      if (instructorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name')
          .in('id', instructorIds)

        if (profiles) {
          const profileMap = new Map(
            profiles.map(p => [p.id, p.first_name])
          )
          setInstructorProfiles(profileMap)
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setGamesLoading(false)
    }
  }

  const getSessionForSlot = (date: string, time: string): Game | null => {
    return sessions.find(s => s.game_date === date && s.start_time === time) || null
  }

  const isSlotAvailable = (date: string, time: string): boolean => {
    const session = getSessionForSlot(date, time)
    return !session || (!session.instructor_id && session.status !== 'booked')
  }

  const isSlotPast = (date: string, time: string): boolean => {
    const slotDateTime = new Date(`${date}T${time}`)
    return isPast(slotDateTime)
  }

  const handleSlotClick = (date: string, time: string) => {
    if (isSlotAvailable(date, time) && !isSlotPast(date, time)) {
      setSelectedSlot({ date, time })
      setIsModalOpen(true)
    }
  }

  const handleClaimSession = async (eventName: string, description: string, skillLevel: string) => {
    if (!user || !selectedSlot) return

    try {
      // Combine event name and description
      const fullDescription = eventName + (description ? `\n\n${description}` : '')
      
      // Step 1: Create the game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          created_by: user.id,
          instructor_id: user.id,
          sport: 'yoga',
          venue_name: 'Pick Up Studio',
          address: '2500 South Miami Avenue',
          game_date: selectedSlot.date,
          start_time: selectedSlot.time,
          max_players: 15,
          cost_cents: 0,
          description: fullDescription || null,
          skill_level: skillLevel || null,
          is_private: false,
          status: 'booked',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (gameError) throw gameError

      // Step 2: Create group chat
      const { data: groupChatData, error: groupChatError } = await supabase
        .from('group_chats')
        .insert({
          game_id: gameData.id,
          name: 'Pick Up Studio',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (groupChatError) throw groupChatError

      // Step 3: Add creator as group chat member
      const { error: memberError } = await supabase
        .from('group_chat_members')
        .insert({
          group_chat_id: groupChatData.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        })

      if (memberError) throw memberError

      // Refresh sessions and close modal
      await fetchWeekSessions()
      setIsModalOpen(false)
      setSelectedSlot(null)
    } catch (error) {
      console.error('Error claiming session:', error)
      alert('Failed to claim session. Please try again.')
    }
  }

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7))
  }

  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i))
    }
    return days
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
      </div>
    )
  }

  const weekDays = getWeekDays()
  const weekEnd = weekDays[6]
  const weekRangeText = `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Studio Schedule
          </h1>
          <p className="text-gray-600">
            Click on available time slots to claim your teaching session
          </p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-sm p-4">
          <button
            onClick={goToPreviousWeek}
            className="btn-outline px-4 py-2 text-sm"
          >
            ← Previous Week
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-navy">
              Week of {weekRangeText}
            </div>
          </div>
          <button
            onClick={goToNextWeek}
            className="btn-outline px-4 py-2 text-sm"
          >
            Next Week →
          </button>
        </div>

        {/* Calendar Grid */}
        {gamesLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Scrollable container */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="inline-flex">
                {/* Fixed Time Column */}
                <div className="sticky left-0 z-10 bg-white border-r-2 border-gray-200">
                  {/* Time Header */}
                  <div className="h-24 p-4 font-semibold text-gray-600 text-sm border-b-2 border-gray-200 flex items-center justify-center">
                    Time
                  </div>
                  {/* Time Labels */}
                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={slot.time}
                      className="h-32 p-4 font-semibold text-gray-600 text-base flex items-center justify-center border-b border-gray-200 last:border-b-0"
                    >
                      {slot.display}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((day, index) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div key={index} className="flex-shrink-0 w-80 border-r border-gray-200 last:border-r-0">
                      {/* Day Header */}
                      <div
                        className={`h-24 p-4 text-center border-b-2 border-gray-200 ${
                          isToday
                            ? 'bg-neon-green text-navy'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-sm uppercase font-bold mb-1">
                          {format(day, 'EEEE')}
                        </div>
                        <div className="text-3xl font-bold">
                          {format(day, 'd')}
                        </div>
                        <div className="text-xs font-medium mt-1">
                          {format(day, 'MMM yyyy')}
                        </div>
                      </div>

                      {/* Time Slots for this day */}
                      {TIME_SLOTS.map((slot) => {
                        const session = getSessionForSlot(dateStr, slot.time)
                        const isAvailable = isSlotAvailable(dateStr, slot.time)
                        const isPastSlot = isSlotPast(dateStr, slot.time)
                        const instructorName = session?.instructor_id
                          ? instructorProfiles.get(session.instructor_id)
                          : undefined

                        return (
                          <div key={slot.time} className="h-32 p-3 border-b border-gray-200 last:border-b-0">
                            <TimeSlotCard
                              date={dateStr}
                              time={slot.time}
                              timeDisplay={slot.display}
                              session={session}
                              isAvailable={isAvailable}
                              isPast={isPastSlot}
                              instructorName={instructorName}
                              onClick={() => handleSlotClick(dateStr, slot.time)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span className="text-gray-600">Claimed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
            <span className="text-gray-600">Past</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSlot(null)
          }}
          selectedDate={selectedSlot.date}
          selectedTime={selectedSlot.time}
          onClaim={handleClaimSession}
        />
      )}
    </div>
  )
}
