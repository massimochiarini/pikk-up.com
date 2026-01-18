'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type YogaClass, type TimeSlot, type Booking } from '@/lib/supabase'
import { format, parseISO, isPast } from 'date-fns'
import Link from 'next/link'
import { CalendarDaysIcon, ClockIcon, UsersIcon, LinkIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  bookings: Booking[]
}

export default function MyClassesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    
    let isCancelled = false

    const fetchClasses = async () => {
      try {
        // Use direct REST API for reliability
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/classes?select=*,time_slot:time_slots(*),bookings(*)&instructor_id=eq.${user.id}&order=created_at.desc`,
          {
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            signal: controller.signal,
          }
        )
        
        clearTimeout(timeoutId)
        
        if (isCancelled) return
        
        if (response.ok) {
          const data = await response.json()
          setClasses(data as ClassWithDetails[])
        }
      } catch (err) {
        console.error('Error fetching classes:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchClasses()
    
    return () => {
      isCancelled = true
    }
  }, [user])

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

  const getBookingUrl = (classId: string) => {
    // Hardcoded production URL to avoid preview deployment URLs
    return `https://pikk-up-com.vercel.app/book/${classId}`
  }

  const copyBookingLink = (classId: string) => {
    navigator.clipboard.writeText(getBookingUrl(classId))
    setCopiedId(classId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getConfirmedBookings = (bookings: Booking[]) => {
    return bookings.filter(b => b.status === 'confirmed')
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
          <p className="text-neutral-500 font-light mb-4">Please sign in to view your classes.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  // Combine date and start_time to get the actual class datetime
  const getClassDateTime = (slot: TimeSlot) => {
    return parseISO(`${slot.date}T${slot.start_time}`)
  }

  const upcomingClasses = classes.filter(c => 
    c.time_slot && !isPast(getClassDateTime(c.time_slot))
  )
  const pastClasses = classes.filter(c => 
    c.time_slot && isPast(getClassDateTime(c.time_slot))
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-10 border-b border-neutral-100">
          <div>
            <h1 className="text-3xl font-light text-charcoal">My Classes</h1>
            <p className="text-neutral-500 font-light mt-1">
              View and manage your scheduled classes
            </p>
          </div>
          <Link href="/instructor/schedule" className="btn-primary">
            Schedule New Class
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="border border-neutral-200 p-12 text-center">
            <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-light text-charcoal mb-2">No classes yet</h3>
            <p className="text-neutral-500 font-light mb-6">
              Start by claiming a time slot and creating your first class.
            </p>
            <Link href="/instructor/schedule" className="btn-primary">
              View Available Slots
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Classes */}
            {upcomingClasses.length > 0 && (
              <section>
                <h2 className="text-lg font-medium text-charcoal mb-6">Upcoming</h2>
                <div className="space-y-4">
                  {upcomingClasses.map((yogaClass) => {
                    const confirmedBookings = getConfirmedBookings(yogaClass.bookings)
                    const spotsLeft = yogaClass.max_capacity - confirmedBookings.length
                    
                    return (
                      <div key={yogaClass.id} className="border border-neutral-200 p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-light">{confirmedBookings.length}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-charcoal">
                                  {yogaClass.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
                                  <span className="flex items-center gap-1 font-light">
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    {format(parseISO(yogaClass.time_slot.date), 'EEE, MMM d')}
                                  </span>
                                  <span className="flex items-center gap-1 font-light">
                                    <ClockIcon className="w-4 h-4" />
                                    {formatTime(yogaClass.time_slot.start_time)}
                                  </span>
                                  <span className="font-light">
                                    {formatPrice(yogaClass.price_cents)}
                                  </span>
                                  <span className={`flex items-center gap-1 font-light ${spotsLeft <= 3 ? 'text-amber-600' : ''}`}>
                                    <UsersIcon className="w-4 h-4" />
                                    {confirmedBookings.length}/{yogaClass.max_capacity}
                                  </span>
                                </div>
                                {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                                  <span className="inline-block mt-2 text-xs uppercase tracking-wider text-neutral-400">
                                    {yogaClass.skill_level}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                              onClick={() => copyBookingLink(yogaClass.id)}
                              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-sm font-light hover:border-charcoal transition-colors"
                            >
                              <LinkIcon className="w-4 h-4" />
                              {copiedId === yogaClass.id ? 'Copied!' : 'Copy Link'}
                            </button>
                            <Link 
                              href={`/instructor/class/${yogaClass.id}`}
                              className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white text-sm font-light hover:bg-neutral-800 transition-colors"
                            >
                              Details
                              <ArrowRightIcon className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>

                        {/* Bookings Preview */}
                        {confirmedBookings.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-neutral-100">
                            <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
                              Registered ({confirmedBookings.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {confirmedBookings.slice(0, 6).map((booking) => (
                                <div 
                                  key={booking.id}
                                  className="px-3 py-1 bg-neutral-50 text-neutral-600 text-sm font-light"
                                >
                                  {booking.guest_first_name || 'Guest'} {booking.guest_last_name?.[0] || ''}.
                                </div>
                              ))}
                              {confirmedBookings.length > 6 && (
                                <div className="px-3 py-1 bg-neutral-100 text-neutral-500 text-sm font-light">
                                  +{confirmedBookings.length - 6} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Past Classes */}
            {pastClasses.length > 0 && (
              <section>
                <h2 className="text-lg font-medium text-charcoal mb-6">Past</h2>
                <div className="space-y-2">
                  {pastClasses.map((yogaClass) => {
                    const confirmedBookings = getConfirmedBookings(yogaClass.bookings)
                    
                    return (
                      <div key={yogaClass.id} className="border border-neutral-100 p-4 bg-neutral-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center bg-white">
                            <span className="text-sm font-light text-neutral-400">{confirmedBookings.length}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-neutral-600">{yogaClass.title}</h3>
                            <div className="text-sm text-neutral-400 font-light">
                              {format(parseISO(yogaClass.time_slot.date), 'MMM d, yyyy')} · {confirmedBookings.length} attended
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
