'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'
import { ParticipantsModal } from '@/components/ParticipantsModal'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDaysIcon, ClockIcon, ExclamationTriangleIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
  booking_count: number
}

export default function ClassesPage() {
  const { user, profile } = useAuth()
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'my-classes'>('all')
  const [skillFilter, setSkillFilter] = useState<string>('all')
  const [myClassIds, setMyClassIds] = useState<Set<string>>(new Set())
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [participantsModal, setParticipantsModal] = useState<{ classId: string; title: string; isOwner: boolean } | null>(null)
  
  const hasFetchedBookings = useRef<string | null>(null)

  const fetchClasses = useCallback(async () => {
    console.log('Fetching classes...')
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('classes')
        .select(`
          *,
          time_slot:time_slots(*),
          instructor:profiles!instructor_id(*)
        `)
        .eq('status', 'upcoming')

      if (fetchError) {
        console.error('Error fetching classes:', fetchError)
        setError('Failed to load classes. Please refresh the page.')
        setClasses([])
        setLoading(false)
        return
      }
      
      console.log('Classes fetched:', data?.length || 0)

      if (data) {
        const today = format(new Date(), 'yyyy-MM-dd')
        
        const filteredData = data
          .filter((c) => c.time_slot && c.time_slot.date >= today)
          .sort((a, b) => {
            const dateA = a.time_slot?.date + 'T' + a.time_slot?.start_time
            const dateB = b.time_slot?.date + 'T' + b.time_slot?.start_time
            return dateA.localeCompare(dateB)
          })

        // Fetch booking counts in parallel, with error handling for each
        const classesWithCounts = await Promise.all(
          filteredData.map(async (c) => {
            try {
              const { data: count, error: rpcError } = await supabase
                .rpc('get_booking_count', { class_uuid: c.id })
              if (rpcError) {
                console.warn(`Failed to get booking count for class ${c.id}:`, rpcError.message)
              }
              return { ...c, booking_count: count || 0 }
            } catch {
              return { ...c, booking_count: 0 }
            }
          })
        )
        setClasses(classesWithCounts as ClassWithDetails[])
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError('Failed to load classes. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  // Fetch user's bookings when logged in (for showing "Booked" badge)
  useEffect(() => {
    if (!user) return
    if (hasFetchedBookings.current === user.id) return
    hasFetchedBookings.current = user.id
    
    const fetchMyBookings = async () => {
      try {
        // Fetch by user_id
        const { data: userBookings, error: userError } = await supabase
          .from('bookings')
          .select('class_id')
          .eq('status', 'confirmed')
          .eq('user_id', user.id)
        
        let allClassIds = new Set<string>()
        
        if (!userError && userBookings) {
          userBookings.forEach(b => allClassIds.add(b.class_id))
        }
        
        // Also fetch by phone if profile has one
        if (profile?.phone) {
          const { data: phoneBookings, error: phoneError } = await supabase
            .from('bookings')
            .select('class_id')
            .eq('status', 'confirmed')
            .eq('guest_phone', profile.phone)
          
          if (!phoneError && phoneBookings) {
            phoneBookings.forEach(b => allClassIds.add(b.class_id))
          }
        }
        
        setMyClassIds(allClassIds)
      } catch (error) {
        console.error('Error fetching my bookings:', error)
      }
    }
    
    fetchMyBookings()
  }, [user, profile?.phone])

  const handleCancelBooking = async (classId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user || !confirm('Are you sure you want to cancel this booking?')) return
    
    setCancelling(classId)
    
    try {
      // Cancel booking by user_id OR phone number
      let query = supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('class_id', classId)
        .eq('status', 'confirmed')

      // Match by user_id or phone number
      if (profile?.phone) {
        const { error } = await query.or(`user_id.eq.${user.id},guest_phone.eq.${profile.phone}`)
        if (error) throw error
      } else {
        const { error } = await query.eq('user_id', user.id)
        if (error) throw error
      }

      // Reset booking fetch ref to allow refresh
      hasFetchedBookings.current = null
      
      // Refresh data
      alert('Booking cancelled successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setCancelling(null)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const formatPrice = (cents: number, isDonation?: boolean) => {
    if (isDonation) return 'Donation'
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
    
    // My Classes filter - only show classes user is registered for
    if (filter === 'my-classes' && !myClassIds.has(c.id)) return false
    
    // Skill filter
    if (skillFilter !== 'all' && c.skill_level !== skillFilter) return false
    
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Header with Artwork */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/gallery/2.jpg"
          alt="Untitled 02"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-3xl md:text-4xl font-light text-charcoal">Classes</h1>
            <p className="text-neutral-500 mt-2 font-light">
              Find and book your next session
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 pb-10 border-b border-neutral-100">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-light transition-colors ${
                filter === 'all'
                  ? 'bg-charcoal text-white'
                  : 'bg-white text-neutral-500 border border-neutral-200 hover:border-charcoal'
              }`}
            >
              All Upcoming
            </button>
            {user && (
              <button
                onClick={() => setFilter('my-classes')}
                className={`px-4 py-2 text-sm font-light transition-colors ${
                  filter === 'my-classes'
                    ? 'bg-charcoal text-white'
                    : 'bg-white text-neutral-500 border border-neutral-200 hover:border-charcoal'
                }`}
              >
                My Classes
              </button>
            )}
          </div>
          
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-200 text-sm text-neutral-600 font-light focus:outline-none focus:border-charcoal"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="card text-center py-16">
            <ExclamationTriangleIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-light text-charcoal mb-2">Something went wrong</h3>
            <p className="text-neutral-500 font-light mb-6">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                fetchClasses()
              }}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-xl font-light text-charcoal mb-2">No classes found</h3>
            <p className="text-neutral-500 font-light">
              {filter === 'my-classes'
                ? 'You haven\'t registered for any classes yet.'
                : filter !== 'all' || skillFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Check back soon for new sessions.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClasses.map((yogaClass) => {
              const spotsLeft = yogaClass.max_capacity - yogaClass.booking_count
              const isFull = spotsLeft <= 0
              const isBooked = myClassIds.has(yogaClass.id)
              
              return (
                <div key={yogaClass.id} className="relative group">
                  <Link
                    href={`/book/${yogaClass.id}`}
                    className="block"
                  >
                    {/* Card */}
                    <div className={`border p-6 transition-all duration-300 ${
                      isBooked 
                        ? 'border-green-200 bg-green-50/30' 
                        : 'border-neutral-200 hover:border-charcoal'
                    }`}>
                      {/* Booked Badge */}
                      {isBooked && (
                        <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium mb-3">
                          <CheckCircleSolidIcon className="w-5 h-5" />
                          You&apos;re registered
                        </div>
                      )}
                      
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-charcoal group-hover:text-neutral-600 transition-colors">
                            {yogaClass.title}
                          </h3>
                          {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                            <span className="inline-block mt-1 text-xs uppercase tracking-wider text-neutral-400">
                              {yogaClass.skill_level}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-charcoal">
                            {formatPrice(yogaClass.price_cents, yogaClass.is_donation)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span className="font-light">{formatDate(yogaClass.time_slot.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <ClockIcon className="w-4 h-4" />
                          <span className="font-light">{formatTime(yogaClass.time_slot.start_time)}</span>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 border border-neutral-200 flex items-center justify-center text-charcoal text-xs font-light">
                            {yogaClass.instructor.first_name?.[0] || 'I'}
                          </div>
                          <span className="text-sm text-neutral-500 font-light">
                            {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                          </span>
                        </div>
{/* Only show spots to instructor who created the class or admin */}
                        {(profile?.is_admin || user?.id === yogaClass.instructor_id) ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setParticipantsModal({
                                classId: yogaClass.id,
                                title: yogaClass.title,
                                isOwner: user?.id === yogaClass.instructor_id
                              })
                            }}
                            className={`flex items-center gap-1.5 text-sm font-light hover:underline ${isFull ? 'text-red-500' : spotsLeft <= 3 ? 'text-amber-600' : 'text-neutral-400'}`}
                          >
                            <UsersIcon className="w-4 h-4" />
                            {isFull ? 'Full' : `${spotsLeft} spots`}
                          </button>
                        ) : (
                          <span className="text-neutral-400">
                            <UsersIcon className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      {/* Full overlay */}
                      {isFull && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <span className="text-charcoal font-medium uppercase tracking-wider text-sm">Class Full</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  {/* Cancel Button for My Classes */}
                  {filter === 'my-classes' && (
                    <button
                      onClick={(e) => handleCancelBooking(yogaClass.id, e)}
                      disabled={cancelling === yogaClass.id}
                      className="w-full mt-2 px-4 py-2 border border-red-200 text-red-600 text-sm font-light transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelling === yogaClass.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Participants Modal */}
        {participantsModal && (
          <ParticipantsModal
            classId={participantsModal.classId}
            classTitle={participantsModal.title}
            isOwner={participantsModal.isOwner}
            onClose={() => setParticipantsModal(null)}
          />
        )}
      </main>
    </div>
  )
}
