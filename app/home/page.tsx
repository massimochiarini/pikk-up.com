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
  
  const getWeekStart = (date: Date) => {
    return startOfWeek(date, { weekStartsOn: 1 })
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
      
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(weekEnd, 'yyyy-MM-dd')

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

  const handleClaimSession = async (
    eventName: string, 
    description: string, 
    skillLevel: string,
    imageUrl: string | null,
    latitude: number | null,
    longitude: number | null,
    costCents: number
  ) => {
    if (!user || !selectedSlot) return

    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          created_by: user.id,
          instructor_id: user.id,
          sport: 'yoga',
          venue_name: 'Pick Up Studio',
          address: '2500 South Miami Avenue',
          custom_title: eventName,
          game_date: selectedSlot.date,
          start_time: selectedSlot.time,
          max_players: 15,
          cost_cents: costCents,
          description: description || null,
          image_url: imageUrl,
          latitude: latitude,
          longitude: longitude,
          skill_level: skillLevel || null,
          is_private: false,
          status: 'booked',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (gameError) throw gameError

      const { error: rsvpError } = await supabase
        .from('rsvps')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })

      if (rsvpError) throw rsvpError

      const { data: groupChatData, error: groupChatError } = await supabase
        .from('group_chats')
        .insert({
          game_id: gameData.id,
          name: eventName || 'Class Session',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (groupChatError) throw groupChatError

      const { error: memberError } = await supabase
        .from('group_chat_members')
        .insert({
          group_chat_id: groupChatData.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        })

      if (memberError) throw memberError

      await fetchWeekSessions()
      setIsModalOpen(false)
      setSelectedSlot(null)
    } catch (error: any) {
      console.error('Error claiming session:', error)
      const errorMessage = error?.message || error?.error_description || 'Unknown error'
      alert(`Failed to claim session: ${errorMessage}`)
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-black text-xl tracking-wider font-semibold">Loading...</div>
      </div>
    )
  }

  const weekDays = getWeekDays()

  return (
    <div className="h-screen bg-white text-black overflow-hidden flex flex-col">
      <Navbar />

      {/* Week Schedule - Calendar Grid */}
      <section className="flex-1 pt-20 pb-4 px-6 overflow-hidden">
        <div className="container mx-auto max-w-7xl h-full flex flex-col">
          <div className="mb-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-3xl font-semibold tracking-wide mb-2">This Week</h2>
              <p className="text-gray-600 text-base font-normal">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={goToPreviousWeek}
                className="p-2 rounded-full border-2 border-gray-300 hover:border-black hover:bg-gray-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 rounded-full border-2 border-gray-300 hover:border-black hover:bg-gray-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {gamesLoading ? (
            <div className="flex justify-center items-center flex-1">
              <div className="animate-pulse text-gray-500 text-lg tracking-wider font-semibold">Loading schedule...</div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg flex-1 flex flex-col min-h-0">
              {/* Calendar Grid */}
              <div className="flex-1 overflow-auto">
                <div className="min-w-[900px] h-full">
                  {/* Header Row - Days of Week */}
                  <div className="grid grid-cols-8 border-b-2 border-gray-200 bg-white sticky top-0 z-10">
                    <div className="p-3 text-gray-500 font-semibold text-sm">Time</div>
                    {weekDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const isToday = isSameDay(day, new Date())
                      return (
                        <div 
                          key={dateStr} 
                          className={`p-3 text-center border-l-2 border-gray-200 ${
                            isToday ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className={`text-xs font-semibold mb-1 ${
                            isToday ? 'text-black' : 'text-gray-600'
                          }`}>
                            {format(day, 'EEE')}
                          </div>
                          <div className={`text-base ${
                            isToday ? 'text-black font-bold' : 'text-gray-700'
                          }`}>
                            {format(day, 'd')}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Time Slot Rows */}
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot.time} className="grid grid-cols-8 border-b-2 border-gray-200 last:border-b-0">
                      {/* Time Label */}
                      <div className="p-3 flex items-center">
                        <div>
                          <div className="text-black font-semibold text-sm">{slot.display}</div>
                          <div className="text-xs text-gray-500">{slot.duration}</div>
                        </div>
                      </div>

                      {/* Day Cells */}
                      {weekDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const session = getSessionForSlot(dateStr, slot.time)
                        const isAvailable = isSlotAvailable(dateStr, slot.time)
                        const isPastSlot = isSlotPast(dateStr, slot.time)
                        const isToday = isSameDay(day, new Date())
                        const instructorName = session?.instructor_id 
                          ? instructorProfiles.get(session.instructor_id) 
                          : undefined

                        return (
                          <div 
                            key={`${dateStr}-${slot.time}`}
                            className={`p-2 border-l-2 border-gray-200 ${
                              isToday ? 'bg-gray-50' : ''
                            }`}
                          >
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
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="px-4 py-3 bg-gray-50 border-t-2 border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500/20 border-2 border-green-500"></div>
                    <span className="text-gray-600 font-semibold">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/20 border-2 border-red-500"></div>
                    <span className="text-gray-600 font-semibold">Claimed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-500/20 border-2 border-gray-500"></div>
                    <span className="text-gray-600 font-semibold">Past</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

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
