'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isPast } from 'date-fns'
import Link from 'next/link'
import { CalendarDaysIcon, ClockIcon, MapPinIcon, CheckIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function StudentMyClassesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)

  useEffect(() => {
    // Only redirect if we've finished loading and there's no user
    if (!authLoading && !user) {
      window.location.href = '/auth/login'
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    
    const fetchBookings = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        const allBookings: any[] = []
        const seenIds = new Set<string>()

        const selectQuery = 'id,class_id,status,created_at,guest_first_name,guest_last_name,guest_phone,class:classes(id,title,description,price_cents,skill_level,max_capacity,time_slot:time_slots(date,start_time,end_time),instructor:profiles!instructor_id(first_name,last_name,instagram,bio))'

        // Fetch bookings by user_id
        const userRes = await fetch(
          `${supabaseUrl}/rest/v1/bookings?select=${selectQuery}&user_id=eq.${user.id}&status=eq.confirmed&order=created_at.desc`,
          {
            headers: {
              'apikey': supabaseKey || '',
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        )
        
        if (userRes.ok) {
          const userBookings = await userRes.json()
          for (const b of userBookings) {
            if (!seenIds.has(b.id)) {
              seenIds.add(b.id)
              allBookings.push(b)
            }
          }
        }

        // Also fetch by phone number if profile has phone
        if (profile?.phone) {
          const phoneNormalized = profile.phone.replace(/\D/g, '')
          const phoneRes = await fetch(
            `${supabaseUrl}/rest/v1/bookings?select=${selectQuery}&guest_phone=eq.${phoneNormalized}&status=eq.confirmed&order=created_at.desc`,
            {
              headers: {
                'apikey': supabaseKey || '',
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          )

          if (phoneRes.ok) {
            const phoneBookings = await phoneRes.json()
            for (const b of phoneBookings) {
              if (!seenIds.has(b.id)) {
                seenIds.add(b.id)
                allBookings.push(b)
              }
            }
          }
        }

        // Filter out any bookings where class data is missing
        const validBookings = allBookings.filter((b: any) => 
          b.class !== null && b.class.time_slot !== null
        )
        setBookings(validBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, profile])

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

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) {
        console.error('Error cancelling booking:', error)
        alert('Failed to cancel booking. Please try again.')
        return
      }

      // Remove the cancelled booking from the list
      setBookings(prev => prev.filter(b => b.id !== bookingId))
      setShowCancelConfirm(null)
      setExpandedId(null)
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const upcomingClasses = bookings.filter(b => 
    b.class?.time_slot && !isPast(parseISO(b.class.time_slot.date))
  )
  
  const pastClasses = bookings.filter(b => 
    b.class?.time_slot && isPast(parseISO(b.class.time_slot.date))
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-10 border-b border-neutral-100">
          <div>
            <h1 className="text-3xl font-light text-charcoal">My Classes</h1>
            <p className="text-neutral-500 font-light mt-1">
              View your upcoming and past sessions
            </p>
          </div>
          <Link href="/classes" className="btn-primary">
            Browse Classes
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="border border-neutral-200 p-12 text-center">
            <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-light text-charcoal mb-2">No classes booked yet</h3>
            <p className="text-neutral-500 font-light mb-6">
              Find a class that interests you and reserve your spot.
            </p>
            <Link href="/classes" className="btn-primary">
              Explore Classes
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Upcoming Classes Column */}
            <section>
              <h2 className="text-lg font-medium text-charcoal mb-6 flex items-center gap-3">
                <div className="w-8 h-8 border border-charcoal flex items-center justify-center">
                  <CalendarDaysIcon className="w-4 h-4" />
                </div>
                Upcoming
              </h2>
              
              {upcomingClasses.length === 0 ? (
                <div className="border border-neutral-200 p-8 text-center bg-neutral-50">
                  <p className="text-neutral-500 font-light mb-4">No upcoming classes</p>
                  <Link href="/classes" className="text-charcoal hover:underline text-sm">
                    Find a class
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingClasses.map((booking) => {
                    const isExpanded = expandedId === booking.id
                    
                    return (
                      <div 
                        key={booking.id} 
                        className="border border-neutral-200 cursor-pointer hover:border-charcoal transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-light">{format(parseISO(booking.class.time_slot.date), 'd')}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-lg text-charcoal">
                                {booking.class.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-500 font-light">
                                <span className="flex items-center gap-1">
                                  <CalendarDaysIcon className="w-4 h-4" />
                                  {format(parseISO(booking.class.time_slot.date), 'EEE, MMM d')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                  {formatTime(booking.class.time_slot.start_time)}
                                </span>
                              </div>
                              <div className="mt-2 text-sm text-neutral-400 font-light">
                                with {booking.class.instructor.first_name} {booking.class.instructor.last_name}
                              </div>
                            </div>
                            <ChevronDownIcon className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-0 border-t border-neutral-100 mt-0">
                            <div className="pt-6 space-y-6">
                              {/* Class Description */}
                              {booking.class.description && (
                                <div>
                                  <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-2">About</h4>
                                  <p className="text-sm text-neutral-600 font-light">{booking.class.description}</p>
                                </div>
                              )}
                              
                              {/* Class Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-xs uppercase tracking-wider text-neutral-400">Date</span>
                                  <p className="text-sm text-charcoal font-light mt-1">
                                    {format(parseISO(booking.class.time_slot.date), 'EEEE, MMMM d, yyyy')}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs uppercase tracking-wider text-neutral-400">Time</span>
                                  <p className="text-sm text-charcoal font-light mt-1">
                                    {formatTime(booking.class.time_slot.start_time)} - {formatTime(booking.class.time_slot.end_time)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs uppercase tracking-wider text-neutral-400">Price</span>
                                  <p className="text-sm text-charcoal font-light mt-1">
                                    {formatPrice(booking.class.price_cents)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs uppercase tracking-wider text-neutral-400">Location</span>
                                  <p className="text-sm text-charcoal font-light mt-1 flex items-center gap-1">
                                    <MapPinIcon className="w-4 h-4" /> PikkUp Studio
                                  </p>
                                </div>
                              </div>
                              
                              {/* Instructor Info */}
                              <div className="border border-neutral-100 p-4">
                                <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-3">Instructor</h4>
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center text-charcoal font-light">
                                    {booking.class.instructor.first_name?.[0] || 'I'}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-charcoal">
                                      {booking.class.instructor.first_name} {booking.class.instructor.last_name}
                                    </p>
                                    {booking.class.instructor.instagram && (
                                      <a 
                                        href={`https://instagram.com/${booking.class.instructor.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-neutral-500 hover:text-charcoal"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        @{booking.class.instructor.instagram.replace('@', '')}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Confirmation Status */}
                              <div className="flex items-center gap-2 text-sm text-charcoal bg-neutral-50 px-4 py-3">
                                <CheckIcon className="w-4 h-4" />
                                <span className="font-light">Booking Confirmed</span>
                              </div>

                              {/* Cancel Booking Section */}
                              {showCancelConfirm === booking.id ? (
                                <div className="border border-red-200 bg-red-50 p-4 mt-4">
                                  <p className="text-sm text-red-800 mb-4">
                                    Are you sure you want to cancel this booking? Your spot will be released and available for others to book.
                                  </p>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleCancelBooking(booking.id)
                                      }}
                                      disabled={cancellingId === booking.id}
                                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                      {cancellingId === booking.id ? 'Cancelling...' : 'Yes, Cancel Booking'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowCancelConfirm(null)
                                      }}
                                      className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-600 text-sm font-medium hover:bg-neutral-50 transition-colors"
                                    >
                                      Keep Booking
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowCancelConfirm(booking.id)
                                  }}
                                  className="w-full mt-4 px-4 py-3 border border-neutral-200 text-neutral-500 text-sm font-light hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Past Classes Column */}
            <section>
              <h2 className="text-lg font-medium text-charcoal mb-6 flex items-center gap-3">
                <div className="w-8 h-8 border border-neutral-300 flex items-center justify-center bg-neutral-50">
                  <CheckIcon className="w-4 h-4 text-neutral-400" />
                </div>
                Attended
              </h2>
              
              {pastClasses.length === 0 ? (
                <div className="border border-neutral-100 p-8 text-center bg-neutral-50">
                  <p className="text-neutral-400 font-light">No past classes yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pastClasses.map((booking) => (
                    <div key={booking.id} className="border border-neutral-100 p-4 bg-neutral-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center bg-white">
                          <CheckIcon className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-600 truncate">
                            {booking.class.title}
                          </h3>
                          <div className="text-sm text-neutral-400 font-light">
                            {format(parseISO(booking.class.time_slot.date), 'MMM d, yyyy')} · 
                            {booking.class.instructor.first_name} {booking.class.instructor.last_name}
                          </div>
                        </div>
                        <div className="text-sm text-neutral-400 font-light">
                          {formatPrice(booking.class.price_cents)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
