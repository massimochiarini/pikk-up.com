'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns'
import Link from 'next/link'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
  booking_count: number
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')
  const [skillFilter, setSkillFilter] = useState<string>('all')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    // Fetch upcoming classes with instructor and time slot info
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        time_slot:time_slots(*),
        instructor:profiles!instructor_id(*)
      `)
      .eq('status', 'upcoming')
      .gte('time_slot.date', format(new Date(), 'yyyy-MM-dd'))
      .order('time_slot(date)', { ascending: true })

    if (!error && data) {
      // Fetch booking counts separately
      const classesWithCounts = await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', c.id)
            .eq('status', 'confirmed')

          return {
            ...c,
            booking_count: count || 0,
          }
        })
      )
      setClasses(classesWithCounts as ClassWithDetails[])
    }
    setLoading(false)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free'
    return `$${(cents / 100).toFixed(0)}`
  }

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  }

  const filteredClasses = classes.filter((c) => {
    if (!c.time_slot) return false
    
    const classDate = parseISO(c.time_slot.date)
    const today = new Date()
    
    // Date filter
    if (filter === 'today' && !isToday(classDate)) return false
    if (filter === 'week' && classDate > addDays(today, 7)) return false
    
    // Skill filter
    if (skillFilter !== 'all' && c.skill_level !== skillFilter) return false
    
    return true
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">Yoga Classes</h1>
          <p className="text-sand-600 mt-1">
            Find and book your next yoga session.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-sage-600 text-white'
                  : 'bg-white text-sand-600 hover:bg-sand-100'
              }`}
            >
              All Upcoming
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'today'
                  ? 'bg-sage-600 text-white'
                  : 'bg-white text-sand-600 hover:bg-sand-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'week'
                  ? 'bg-sage-600 text-white'
                  : 'bg-white text-sand-600 hover:bg-sand-100'
              }`}
            >
              This Week
            </button>
          </div>
          
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white border border-sand-200 text-sm text-sand-700 focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🧘</span>
            </div>
            <h3 className="text-xl font-semibold text-charcoal mb-2">No classes found</h3>
            <p className="text-sand-600">
              {filter !== 'all' || skillFilter !== 'all'
                ? 'Try adjusting your filters to see more classes.'
                : 'Check back soon for new yoga sessions!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((yogaClass) => {
              const spotsLeft = yogaClass.max_capacity - yogaClass.booking_count
              const isFull = spotsLeft <= 0
              
              return (
                <Link
                  key={yogaClass.id}
                  href={`/book/${yogaClass.id}`}
                  className="card-hover group block"
                >
                  {/* Header with gradient */}
                  <div className="h-32 rounded-xl bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center mb-4 relative overflow-hidden">
                    <span className="text-5xl transform group-hover:scale-110 transition-transform">🧘</span>
                    {yogaClass.price_cents === 0 && (
                      <div className="absolute top-3 right-3 bg-white/90 text-sage-700 text-xs font-bold px-2 py-1 rounded-full">
                        FREE
                      </div>
                    )}
                    {isFull && (
                      <div className="absolute inset-0 bg-charcoal/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">FULL</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-charcoal group-hover:text-sage-700 transition-colors">
                        {yogaClass.title}
                      </h3>
                      {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-sage-100 text-sage-700 text-xs font-medium rounded-full capitalize">
                          {yogaClass.skill_level}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-sand-600">
                      <span className="flex items-center gap-1">
                        📅 {formatDate(yogaClass.time_slot.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        🕐 {formatTime(yogaClass.time_slot.start_time)}
                      </span>
                    </div>
                    
                    {/* Instructor */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white text-xs font-semibold">
                        {yogaClass.instructor.first_name?.[0] || 'I'}
                      </div>
                      <span className="text-sm text-sand-600">
                        {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                      </span>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-sand-100">
                      <div className="text-lg font-bold text-sage-700">
                        {formatPrice(yogaClass.price_cents)}
                      </div>
                      <div className={`text-sm ${isFull ? 'text-red-500' : spotsLeft <= 3 ? 'text-terracotta-600' : 'text-sand-500'}`}>
                        {isFull ? 'Full' : `${spotsLeft} spots left`}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
