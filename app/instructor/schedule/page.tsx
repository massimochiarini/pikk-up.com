'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type TimeSlot } from '@/lib/supabase'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'

const TIME_SLOTS = [
  '07:00:00', '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00',
  '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00', 
  '19:00:00', '20:00:00', '21:00:00', '22:00:00'
]

type ClassWithInstructor = {
  id: string
  time_slot_id: string
  title: string
  instructor: {
    email: string
    first_name: string
    last_name: string
  }
}

export default function InstructorSchedulePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [classes, setClasses] = useState<ClassWithInstructor[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [claiming, setClaiming] = useState<string | null>(null)
  const [isPageVisible, setIsPageVisible] = useState(true)

  // Handle tab visibility to prevent fetching when not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !isPageVisible) return

    let isCancelled = false

    const fetchData = async () => {
      if (isCancelled) return
      
      setLoading(true)
      const weekEnd = addDays(weekStart, 6)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        // Fetch time slots and classes in parallel
        const [slotsRes, classesRes] = await Promise.all([
          fetch(
            `${supabaseUrl}/rest/v1/time_slots?date=gte.${format(weekStart, 'yyyy-MM-dd')}&date=lte.${format(weekEnd, 'yyyy-MM-dd')}&order=date,start_time`,
            {
              headers: {
                'apikey': supabaseKey || '',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              signal: controller.signal,
            }
          ),
          fetch(
            `${supabaseUrl}/rest/v1/classes?select=id,time_slot_id,title,instructor:profiles!instructor_id(email,first_name,last_name)`,
            {
              headers: {
                'apikey': supabaseKey || '',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              signal: controller.signal,
            }
          )
        ])
        
        clearTimeout(timeoutId)

        if (isCancelled) return

        if (slotsRes.ok) {
          const slotsData = await slotsRes.json()
          setTimeSlots(slotsData)
        }
        
        if (classesRes.ok) {
          const classesData = await classesRes.json()
          setClasses(classesData)
        }
      } catch (error) {
        console.error('Error fetching schedule data:', error)
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [user, weekStart, isPageVisible])

  const handleClaimSlot = (slot: TimeSlot) => {
    if (slot.status !== 'available' || claiming) return
    
    // Just navigate to the create form - slot will be claimed when class is created
      router.push(`/instructor/create/${slot.id}`)
  }

  const formatTime = (time: string) => {
    const [hours] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour} ${period}`
  }

  const getDaysOfWeek = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }

  const getSlotForDayAndTime = (date: Date, time: string) => {
    return timeSlots.find(slot => 
      slot.date === format(date, 'yyyy-MM-dd') && slot.start_time === time
    )
  }

  const getClassForSlot = (slotId: string) => {
    return classes.find(c => c.time_slot_id === slotId)
  }

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 font-light mb-4">Please sign in to view the schedule.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  const days = getDaysOfWeek()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-charcoal">Schedule</h1>
            <p className="text-neutral-500 text-sm font-light hidden sm:block">
              Select an available slot to create your class
            </p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-2 border border-neutral-200 hover:border-charcoal transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-charcoal" />
            </button>
            <div className="px-4 py-2 border border-neutral-200 font-light text-charcoal text-sm">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </div>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-2 border border-neutral-200 hover:border-charcoal transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-charcoal" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 sm:gap-6 mb-4 text-xs overflow-x-auto pb-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 border border-charcoal bg-white"></div>
            <span className="text-neutral-500 font-light">Available</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 bg-charcoal"></div>
            <span className="text-neutral-500 font-light">Your Class</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 bg-neutral-200"></div>
            <span className="text-neutral-500 font-light">Taken</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 bg-neutral-100"></div>
            <span className="text-neutral-500 font-light">Past</span>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="flex-1 overflow-auto border border-neutral-200 p-2 sm:p-4">
          <div className="min-w-[320px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-0.5 sm:gap-2 mb-1 sm:mb-2">
              <div className="text-[10px] sm:text-xs font-light text-neutral-400 uppercase tracking-wider"></div>
              {days.map((day) => (
                <div key={day.toISOString()} className="text-center">
                  <div className="text-[10px] sm:text-xs font-light text-neutral-400 uppercase tracking-wider">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-sm sm:text-lg font-light ${
                    isSameDay(day, new Date()) ? 'text-charcoal' : 'text-neutral-600'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots Grid */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 gap-0.5 sm:gap-2 mb-0.5 sm:mb-1">
                <div className="flex items-center text-[10px] sm:text-xs font-light text-neutral-400 pr-1">
                  {formatTime(time)}
                </div>
                {days.map((day) => {
                  const slot = getSlotForDayAndTime(day, time)
                  const isPast = day < new Date() && !isSameDay(day, new Date())
                  const isToday = isSameDay(day, new Date())
                  const currentHour = new Date().getHours()
                  const slotHour = parseInt(time.split(':')[0])
                  const isPastToday = isToday && slotHour <= currentHour

                  if (isPast || isPastToday) {
                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className="h-7 sm:h-10 bg-neutral-50 flex items-center justify-center"
                      >
                        <span className="text-neutral-300 text-[8px] sm:text-xs font-light">-</span>
                      </div>
                    )
                  }

                  if (!slot) {
                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className="h-7 sm:h-10 border border-dashed border-neutral-200 flex items-center justify-center"
                      >
                        <span className="text-neutral-200 text-[8px] sm:text-xs">-</span>
                      </div>
                    )
                  }

                  if (slot.status === 'claimed') {
                    const classInfo = getClassForSlot(slot.id)
                    const isMyClass = classInfo?.instructor?.email === profile?.email
                    
                    return (
                      <div
                        key={slot.id}
                        className={`h-7 sm:h-10 flex items-center justify-center ${
                          isMyClass 
                            ? 'bg-charcoal text-white' 
                            : 'bg-neutral-200 text-neutral-500'
                        }`}
                        title={classInfo ? `${classInfo.title} by ${classInfo.instructor?.first_name}` : 'Booked'}
                      >
                        <span className="text-[7px] sm:text-xs font-light">
                          {isMyClass ? 'Yours' : 'Taken'}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleClaimSlot(slot)}
                      disabled={claiming === slot.id}
                      className="h-7 sm:h-10 border border-charcoal hover:bg-charcoal hover:text-white transition-colors flex items-center justify-center group"
                    >
                      {claiming === slot.id ? (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border border-neutral-300 border-t-charcoal rounded-full animate-spin"></div>
                      ) : (
                        <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 text-charcoal group-hover:text-white" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
