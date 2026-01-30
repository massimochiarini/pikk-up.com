'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'
import { ParticipantsModal } from '@/components/ParticipantsModal'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import Link from 'next/link'

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

      if (data) {
        const today = format(new Date(), 'yyyy-MM-dd')
        
        const filteredData = data
          .filter((c) => c.time_slot && c.time_slot.date >= today)
          .sort((a, b) => {
            const dateA = a.time_slot?.date + 'T' + a.time_slot?.start_time
            const dateB = b.time_slot?.date + 'T' + b.time_slot?.start_time
            return dateA.localeCompare(dateB)
          })

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

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (!user) return
    if (hasFetchedBookings.current === user.id) return
    hasFetchedBookings.current = user.id
    
    const fetchMyBookings = async () => {
      try {
        const { data: userBookings, error: userError } = await supabase
          .from('bookings')
          .select('class_id')
          .eq('status', 'confirmed')
          .eq('user_id', user.id)
        
        let allClassIds = new Set<string>()
        
        if (!userError && userBookings) {
          userBookings.forEach(b => allClassIds.add(b.class_id))
        }
        
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
      let query = supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('class_id', classId)
        .eq('status', 'confirmed')

      if (profile?.phone) {
        const { error } = await query.or(`user_id.eq.${user.id},guest_phone.eq.${profile.phone}`)
        if (error) throw error
      } else {
        const { error } = await query.eq('user_id', user.id)
        if (error) throw error
      }

      hasFetchedBookings.current = null
      
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
    if (filter === 'my-classes' && !myClassIds.has(c.id)) return false
    if (skillFilter !== 'all' && c.skill_level !== skillFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Page Header - Minimal */}
      <div className="pt-12 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Classes</h1>
          <p className="text-stone-400 mt-3 tracking-wide">
            Find and book your next session
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        {/* Filters - Minimal */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 pb-8 border-b border-stone-100">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 text-sm tracking-wide transition-colors duration-300 ${
                filter === 'all'
                  ? 'bg-gray text-white'
                  : 'text-stone-400 border border-stone-200 hover:border-gray hover:text-gray'
              }`}
            >
              All Upcoming
            </button>
            {user && (
              <button
                onClick={() => setFilter('my-classes')}
                className={`px-5 py-2.5 text-sm tracking-wide transition-colors duration-300 ${
                  filter === 'my-classes'
                    ? 'bg-gray text-white'
                    : 'text-stone-400 border border-stone-200 hover:border-gray hover:text-gray'
                }`}
              >
                My Classes
              </button>
            )}
          </div>
          
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-stone-200 text-sm text-stone-500 tracking-wide focus:outline-none focus:border-gray transition-colors duration-300"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border border-stone-300 border-t-gray rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-stone-400 mb-6 tracking-wide">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                fetchClasses()
              }}
              className="btn-primary"
            >
              Try again
            </button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-24">
            <h3 className="text-xl font-normal text-gray mb-3 tracking-tight">No classes found</h3>
            <p className="text-stone-400 tracking-wide">
              {filter === 'my-classes'
                ? 'You haven\'t registered for any classes yet.'
                : filter !== 'all' || skillFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Check back soon for new sessions.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-px bg-stone-200">
            {filteredClasses.map((yogaClass) => {
              const spotsLeft = yogaClass.max_capacity - yogaClass.booking_count
              const isFull = spotsLeft <= 0
              const isBooked = myClassIds.has(yogaClass.id)
              
              return (
                <div key={yogaClass.id} className="bg-white relative">
                  <Link
                    href={`/book/${yogaClass.id}`}
                    className={`block p-8 group ${isFull ? 'opacity-50' : ''}`}
                  >
                    {/* Booked indicator */}
                    {isBooked && (
                      <div className="flex items-center gap-2 text-green-600 text-sm mb-4 tracking-wide">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Registered
                      </div>
                    )}
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-normal text-gray group-hover:text-gray-dark transition-colors duration-300 tracking-tight">
                          {yogaClass.title}
                        </h3>
                        <p className="text-stone-400 text-sm mt-1 tracking-wide">
                          {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                        </p>
                      </div>
                      <span className="text-gray font-normal">
                        {formatPrice(yogaClass.price_cents, yogaClass.is_donation)}
                      </span>
                    </div>
                    
                    {/* Details */}
                    <div className="flex items-center gap-6 text-sm text-stone-400 mb-6 tracking-wide">
                      <span>{formatDate(yogaClass.time_slot.date)}</span>
                      <span>{formatTime(yogaClass.time_slot.start_time)}</span>
                      {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                        <span className="text-stone-300">{yogaClass.skill_level}</span>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                      {!isFull && (
                        <span className="text-sm text-gray tracking-wide group-hover:border-b group-hover:border-gray transition-all duration-300">
                          Book now
                        </span>
                      )}
                      {isFull && (
                        <span className="text-sm text-stone-400 tracking-wide">Class full</span>
                      )}
                      
                      {(profile?.is_admin || user?.id === yogaClass.instructor_id) && (
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
                          className={`text-sm tracking-wide hover:underline ${
                            isFull ? 'text-red-500' : spotsLeft <= 3 ? 'text-amber-600' : 'text-stone-400'
                          }`}
                        >
                          {isFull ? 'Full' : `${spotsLeft} spots`}
                        </button>
                      )}
                    </div>
                  </Link>
                  
                  {/* Cancel Button for My Classes */}
                  {filter === 'my-classes' && isBooked && (
                    <div className="px-8 pb-8">
                      <button
                        onClick={(e) => handleCancelBooking(yogaClass.id, e)}
                        disabled={cancelling === yogaClass.id}
                        className="w-full py-3 border border-red-200 text-red-500 text-sm tracking-wide transition-colors duration-300 hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancelling === yogaClass.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </div>
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
