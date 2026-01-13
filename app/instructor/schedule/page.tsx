'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type TimeSlot } from '@/lib/supabase'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'

const TIME_SLOTS = ['07:00:00', '09:00:00', '11:00:00', '13:00:00', '17:00:00', '19:00:00']

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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-sand-600 mb-4">Please sign in to view the schedule.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  const days = getDaysOfWeek()

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Schedule</h1>
            <p className="text-sand-600 mt-1">
              Select an available slot to create your class.
            </p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="btn-secondary px-4 py-2"
            >
              ← Prev
            </button>
            <div className="px-4 py-2 bg-white rounded-xl border border-sand-200 font-medium text-charcoal">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </div>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="btn-secondary px-4 py-2"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sage-100 border border-sage-300"></div>
            <span className="text-sand-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sage-200 border border-sage-400"></div>
            <span className="text-sand-600">Your Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sand-200"></div>
            <span className="text-sand-600">Other Instructor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sand-100"></div>
            <span className="text-sand-600">Past</span>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="card overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="text-sm font-medium text-sand-500">Time</div>
                {days.map((day) => (
                  <div key={day.toISOString()} className="text-center">
                    <div className="text-sm font-medium text-sand-500">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-lg font-bold ${
                      isSameDay(day, new Date()) ? 'text-sage-600' : 'text-charcoal'
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              {TIME_SLOTS.map((time) => (
                <div key={time} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="flex items-center text-sm font-medium text-sand-600">
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
                          className="h-16 rounded-lg bg-sand-100 flex items-center justify-center"
                        >
                          <span className="text-sand-400 text-xs">Past</span>
                        </div>
                      )
                    }

                    if (!slot) {
                      return (
                        <div
                          key={`${day.toISOString()}-${time}`}
                          className="h-16 rounded-lg bg-sand-50 border border-dashed border-sand-200 flex items-center justify-center"
                        >
                          <span className="text-sand-300 text-xs">—</span>
                        </div>
                      )
                    }

                    if (slot.status === 'claimed') {
                      const classInfo = getClassForSlot(slot.id)
                      const isMyClass = classInfo?.instructor?.email === profile?.email
                      
                      return (
                        <div
                          key={slot.id}
                          className={`h-16 rounded-lg flex flex-col items-center justify-center p-1 ${
                            isMyClass 
                              ? 'bg-sage-200 border border-sage-400' 
                              : 'bg-sand-200'
                          }`}
                          title={classInfo ? `${classInfo.title} by ${classInfo.instructor?.first_name}` : 'Booked'}
                        >
                          <span className={`text-xs font-medium ${isMyClass ? 'text-sage-700' : 'text-sand-500'}`}>
                            {isMyClass ? 'Your Class' : 'Booked'}
                          </span>
                          {classInfo?.instructor && (
                            <span className={`text-xs truncate max-w-full px-1 ${isMyClass ? 'text-sage-600' : 'text-sand-400'}`}>
                              {classInfo.instructor.first_name}
                            </span>
                          )}
                        </div>
                      )
                    }

                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleClaimSlot(slot)}
                        disabled={claiming === slot.id}
                        className="h-16 rounded-lg bg-sage-100 border border-sage-300 hover:bg-sage-200 hover:border-sage-400 transition-colors flex items-center justify-center group"
                      >
                        {claiming === slot.id ? (
                          <div className="w-5 h-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-sage-600 text-xs font-medium group-hover:text-sage-700">
                            + Claim
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
