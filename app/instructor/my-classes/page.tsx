'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type YogaClass, type TimeSlot, type Booking } from '@/lib/supabase'
import { format, parseISO, isPast } from 'date-fns'
import Link from 'next/link'

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
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          time_slot:time_slots(*),
          bookings(*)
        `)
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })

      if (isCancelled) return

      if (!error && data) {
        setClasses(data as ClassWithDetails[])
      }
      setLoading(false)
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

  // Show loading while auth is loading, data is loading, OR when we have a user but profile hasn't loaded
  if (authLoading || loading || (user && !profile)) {
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
          <p className="text-sand-600 mb-4">Please sign in to view your classes.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  const upcomingClasses = classes.filter(c => 
    c.time_slot && !isPast(parseISO(c.time_slot.date))
  )
  const pastClasses = classes.filter(c => 
    c.time_slot && isPast(parseISO(c.time_slot.date))
  )

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">My Classes</h1>
            <p className="text-sand-600 mt-1">
              View and manage your scheduled classes.
            </p>
          </div>
          <Link href="/instructor/schedule" className="btn-primary">
            + Schedule New Class
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-charcoal mb-2">No classes yet</h3>
            <p className="text-sand-600 mb-6">
              Start by claiming a time slot and creating your first class.
            </p>
            <Link href="/instructor/schedule" className="btn-primary">
              View Available Slots
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Classes */}
            {upcomingClasses.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-charcoal mb-4">Upcoming Classes</h2>
                <div className="grid gap-4">
                  {upcomingClasses.map((yogaClass) => {
                    const confirmedBookings = getConfirmedBookings(yogaClass.bookings)
                    const spotsLeft = yogaClass.max_capacity - confirmedBookings.length
                    
                    return (
                      <div key={yogaClass.id} className="card">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🧘</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-charcoal">
                                  {yogaClass.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-sand-600">
                                  <span>
                                    📅 {format(parseISO(yogaClass.time_slot.date), 'EEE, MMM d')}
                                  </span>
                                  <span>
                                    🕐 {formatTime(yogaClass.time_slot.start_time)}
                                  </span>
                                  <span>
                                    💰 {formatPrice(yogaClass.price_cents)}
                                  </span>
                                  <span className={spotsLeft <= 3 ? 'text-terracotta-600 font-medium' : ''}>
                                    👥 {confirmedBookings.length}/{yogaClass.max_capacity} booked
                                  </span>
                                </div>
                                {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-sage-100 text-sage-700 text-xs font-medium rounded-full capitalize">
                                    {yogaClass.skill_level}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => copyBookingLink(yogaClass.id)}
                              className="btn-secondary text-sm px-4 py-2"
                            >
                              {copiedId === yogaClass.id ? '✓ Copied!' : '🔗 Copy Link'}
                            </button>
                            <Link 
                              href={`/instructor/class/${yogaClass.id}`}
                              className="btn-outline text-sm px-4 py-2"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>

                        {/* Bookings Preview */}
                        {confirmedBookings.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-sand-200">
                            <div className="text-sm text-sand-600 mb-2">
                              Registered Students ({confirmedBookings.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {confirmedBookings.slice(0, 5).map((booking) => (
                                <div 
                                  key={booking.id}
                                  className="px-3 py-1 bg-sage-50 text-sage-700 rounded-full text-sm"
                                >
                                  {booking.guest_first_name || 'Guest'} {booking.guest_last_name?.[0] || ''}.
                                </div>
                              ))}
                              {confirmedBookings.length > 5 && (
                                <div className="px-3 py-1 bg-sand-100 text-sand-600 rounded-full text-sm">
                                  +{confirmedBookings.length - 5} more
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
                <h2 className="text-xl font-bold text-charcoal mb-4">Past Classes</h2>
                <div className="grid gap-4">
                  {pastClasses.map((yogaClass) => {
                    const confirmedBookings = getConfirmedBookings(yogaClass.bookings)
                    
                    return (
                      <div key={yogaClass.id} className="card opacity-70">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-sand-100 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🧘</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-charcoal">{yogaClass.title}</h3>
                            <div className="text-sm text-sand-500">
                              {format(parseISO(yogaClass.time_slot.date), 'MMM d, yyyy')} • 
                              {confirmedBookings.length} students attended
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
