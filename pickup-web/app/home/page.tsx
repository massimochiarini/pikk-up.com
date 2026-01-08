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
  { time: '08:45:00', display: '8:45 AM', duration: '1.25h' },
  { time: '10:15:00', display: '10:15 AM', duration: '1.25h' },
  { time: '11:30:00', display: '11:30 AM', duration: '1.25h' },
  { time: '16:00:00', display: '4:00 PM', duration: '1.25h' },
  { time: '18:15:00', display: '6:15 PM', duration: '1.25h' },
  { time: '19:30:00', display: '7:30 PM', duration: '1.25h' },
]

const CATEGORIES = ['All', 'Breathe', 'Move', 'Meditate']

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
  const [selectedCategory, setSelectedCategory] = useState('All')

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
    longitude: number | null
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
          cost_cents: 0,
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white text-xl tracking-wider">Loading...</div>
      </div>
    )
  }

  const weekDays = getWeekDays()
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.game_date)
    return isSameDay(sessionDate, new Date()) && s.instructor_id
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center transform scale-105 animate-slow-zoom"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2400)',
            filter: 'brightness(0.7)'
          }}
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-7xl md:text-8xl font-light tracking-wide mb-4">
              {profile?.sport_preference === 'yoga' ? 'Be Present' : 'Find Your Flow'}
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide max-w-2xl mx-auto">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Categories */}
      <div className="sticky top-16 z-30 bg-black/95 backdrop-blur-sm border-b border-gray-800 py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-light tracking-wide transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <section className="py-16 px-6 border-b border-gray-900">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12">
              <h2 className="text-4xl font-light tracking-wide mb-3">Today</h2>
              <p className="text-gray-400 text-lg font-light">Your practice awaits</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="group relative overflow-hidden rounded-2xl bg-gray-900 hover:scale-[1.02] transition-all duration-500 cursor-pointer"
                  onClick={() => router.push(`/game/${session.id}`)}
                >
                  <div className="aspect-[16/10] relative overflow-hidden">
                    {session.image_url ? (
                      <img
                        src={session.image_url}
                        alt={session.custom_title || session.venue_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <h3 className="text-3xl font-light mb-3 tracking-wide">
                        {session.custom_title || session.venue_name}
                      </h3>
                      <div className="flex items-center gap-6 text-gray-300">
                        <span className="text-lg font-light">
                          {format(new Date(`2000-01-01T${session.start_time}`), 'h:mm a')}
                        </span>
                        {session.instructor_id && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-lg font-light">
                              w/ {instructorProfiles.get(session.instructor_id)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Week Schedule Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-light tracking-wide mb-3">This Week</h2>
              <p className="text-gray-400 text-lg font-light">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={goToPreviousWeek}
                className="p-3 rounded-full border border-gray-700 hover:border-gray-500 hover:bg-gray-900 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextWeek}
                className="p-3 rounded-full border border-gray-700 hover:border-gray-500 hover:bg-gray-900 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {gamesLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-pulse text-gray-500 text-xl tracking-wider">Loading schedule...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row with Day Names */}
                <div className="grid grid-cols-8 gap-3 mb-3">
                  <div className="text-sm text-gray-400 font-light tracking-wide"></div>
                  {weekDays.map((day) => (
                    <div key={day.toISOString()} className="text-center">
                      <div className="text-lg font-light tracking-wide mb-1">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-sm text-gray-400 font-light">
                        {format(day, 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows */}
                {TIME_SLOTS.map((slot) => (
                  <div key={slot.time} className="grid grid-cols-8 gap-3 mb-3">
                    {/* Time Label */}
                    <div className="flex items-center justify-end pr-4">
                      <span className="text-sm text-gray-400 font-light tracking-wide">
                        {slot.display}
                      </span>
                    </div>

                    {/* Day Cells */}
                    {weekDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const session = getSessionForSlot(dateStr, slot.time)
                      const isAvailable = isSlotAvailable(dateStr, slot.time)
                      const isPast = isSlotPast(dateStr, slot.time)
                      const instructorName = session?.instructor_id 
                        ? instructorProfiles.get(session.instructor_id) 
                        : undefined

                      return (
                        <TimeSlotCard
                          key={`${dateStr}-${slot.time}`}
                          date={dateStr}
                          time={slot.time}
                          timeDisplay={slot.display}
                          session={session}
                          isAvailable={isAvailable}
                          isPast={isPast}
                          instructorName={instructorName}
                          onClick={() => handleSlotClick(dateStr, slot.time)}
                        />
                      )
                    })}
                  </div>
                ))}
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
