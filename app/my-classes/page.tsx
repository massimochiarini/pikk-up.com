'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isPast } from 'date-fns'
import Link from 'next/link'

export default function StudentMyClassesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        const allBookings: any[] = []
        const seenIds = new Set<string>()

        // Fetch bookings by user_id
        const { data: userBookings } = await supabase
          .from('bookings')
          .select(`
            id,
            class_id,
            status,
            created_at,
            guest_first_name,
            guest_last_name,
            class:classes(
              id,
              title,
              description,
              price_cents,
              skill_level,
              time_slot:time_slots(date, start_time, end_time),
              instructor:profiles!instructor_id(first_name, last_name, instagram)
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })

        if (userBookings) {
          for (const b of userBookings) {
            if (!seenIds.has(b.id)) {
              seenIds.add(b.id)
              allBookings.push(b)
            }
          }
        }

        // Also fetch by phone number if profile has phone
        if (profile?.phone) {
          const { data: phoneBookings } = await supabase
            .from('bookings')
            .select(`
              id,
              class_id,
              status,
              created_at,
              guest_first_name,
              guest_last_name,
              class:classes(
                id,
                title,
                description,
                price_cents,
                skill_level,
                time_slot:time_slots(date, start_time, end_time),
                instructor:profiles!instructor_id(first_name, last_name, instagram)
              )
            `)
            .eq('guest_phone', profile.phone)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })

          if (phoneBookings) {
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">My Classes</h1>
            <p className="text-sand-600 mt-1">
              View your upcoming and past yoga sessions.
            </p>
          </div>
          <Link href="/classes" className="btn-primary">
            Browse Classes
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🧘</span>
            </div>
            <h3 className="text-xl font-semibold text-charcoal mb-2">No classes booked yet</h3>
            <p className="text-sand-600 mb-6">
              Find a class that interests you and reserve your spot!
            </p>
            <Link href="/classes" className="btn-primary">
              Explore Classes
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upcoming Classes Column */}
            <section>
              <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-sage-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </span>
                Upcoming Classes
              </h2>
              
              {upcomingClasses.length === 0 ? (
                <div className="card text-center py-8 bg-sage-50/50">
                  <p className="text-sand-600 mb-4">No upcoming classes</p>
                  <Link href="/classes" className="text-sage-600 hover:text-sage-700 font-medium text-sm">
                    Find a class →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingClasses.map((booking) => (
                    <div key={booking.id} className="card border-l-4 border-l-sage-500">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🧘</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-charcoal truncate">
                            {booking.class.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-sand-600">
                            <span>
                              📅 {format(parseISO(booking.class.time_slot.date), 'EEE, MMM d')}
                            </span>
                            <span>
                              🕐 {formatTime(booking.class.time_slot.start_time)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-sand-500">
                            with {booking.class.instructor.first_name} {booking.class.instructor.last_name}
                          </div>
                          {booking.class.skill_level && booking.class.skill_level !== 'all' && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-sage-100 text-sage-700 text-xs font-medium rounded-full capitalize">
                              {booking.class.skill_level}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-sand-200 flex items-center justify-between">
                        <div className="text-sm text-sand-500">
                          📍 PikkUp Studio
                        </div>
                        <Link 
                          href={`/book/${booking.class_id}`}
                          className="text-sage-600 hover:text-sage-700 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Classes Column */}
            <section>
              <h2 className="text-xl font-bold text-charcoal mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-sand-200 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </span>
                Previously Attended
              </h2>
              
              {pastClasses.length === 0 ? (
                <div className="card text-center py-8 bg-sand-50/50">
                  <p className="text-sand-500">No past classes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastClasses.map((booking) => (
                    <div key={booking.id} className="card bg-sand-50/50 opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-sand-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">✓</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-charcoal truncate">
                            {booking.class.title}
                          </h3>
                          <div className="text-sm text-sand-500">
                            {format(parseISO(booking.class.time_slot.date), 'MMM d, yyyy')} • 
                            with {booking.class.instructor.first_name} {booking.class.instructor.last_name}
                          </div>
                        </div>
                        <div className="text-sm text-sand-400">
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
