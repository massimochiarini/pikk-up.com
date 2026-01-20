'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isPast } from 'date-fns'
import Link from 'next/link'
import { PlusIcon, CalendarDaysIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline'

type ClassWithDetails = {
  id: string
  title: string
  price_cents: number
  max_capacity: number
  time_slot: {
    date: string
    start_time: string
    end_time: string
  }
  booking_count?: number
}

export default function InstructorSchedulePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [upcomingClasses, setUpcomingClasses] = useState<ClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return

    const fetchUpcomingClasses = async () => {
      setLoading(true)
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        
        // Fetch upcoming classes for this instructor
        const { data: classes, error } = await supabase
          .from('classes')
          .select(`
            id,
            title,
            price_cents,
            max_capacity,
            time_slot:time_slots(date, start_time, end_time)
          `)
          .eq('instructor_id', user.id)
          .eq('status', 'upcoming')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching classes:', error)
          return
        }

        // Filter to only upcoming classes and fetch booking counts
        const upcomingWithCounts = await Promise.all(
          (classes || [])
            .filter((c: any) => c.time_slot && c.time_slot.date >= today)
            .slice(0, 5) // Show only next 5
            .map(async (c: any) => {
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

        // Sort by date
        upcomingWithCounts.sort((a, b) => {
          const dateA = new Date(`${a.time_slot.date}T${a.time_slot.start_time}`)
          const dateB = new Date(`${b.time_slot.date}T${b.time_slot.start_time}`)
          return dateA.getTime() - dateB.getTime()
        })

        setUpcomingClasses(upcomingWithCounts)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingClasses()
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-charcoal mb-2">Schedule</h1>
          <p className="text-neutral-500 font-light">
            Create and manage your yoga classes
          </p>
        </div>

        {/* Create Class Button */}
        <Link
          href="/instructor/create"
          className="block border-2 border-dashed border-neutral-300 hover:border-charcoal p-8 text-center transition-colors group mb-12"
        >
          <div className="w-16 h-16 border border-neutral-300 group-hover:border-charcoal flex items-center justify-center mx-auto mb-4 transition-colors">
            <PlusIcon className="w-8 h-8 text-neutral-400 group-hover:text-charcoal transition-colors" />
          </div>
          <h2 className="text-xl font-medium text-charcoal mb-2">Create a Class</h2>
          <p className="text-neutral-500 font-light text-sm">
            Set up a new class with your preferred date, time, and duration
          </p>
        </Link>

        {/* Upcoming Classes Preview */}
        {upcomingClasses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-charcoal">Upcoming Classes</h3>
              <Link href="/instructor/my-classes" className="text-sm text-neutral-500 hover:text-charcoal transition-colors">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {upcomingClasses.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/instructor/class/${cls.id}`}
                  className="block border border-neutral-200 p-4 hover:border-charcoal transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-charcoal">{cls.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-500 font-light">
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-4 h-4" />
                          {format(parseISO(cls.time_slot.date), 'EEE, MMM d')}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {formatTime(cls.time_slot.start_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-4 h-4" />
                          {cls.booking_count} / {cls.max_capacity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-charcoal font-light">{formatPrice(cls.price_cents)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {upcomingClasses.length === 0 && !loading && (
          <div className="text-center py-8 border border-neutral-100 bg-neutral-50">
            <CalendarDaysIcon className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-light">No upcoming classes</p>
            <p className="text-neutral-400 text-sm font-light mt-1">
              Create your first class to get started
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
