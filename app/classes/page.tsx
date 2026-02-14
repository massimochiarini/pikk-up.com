'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'
import { ParticipantsModal } from '@/components/ParticipantsModal'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { BOOKING_CUTOFF_DATE } from '@/lib/constants'
import Link from 'next/link'
import { RevealSection } from '@/components/ui'

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
  const [showSignupNotice, setShowSignupNotice] = useState(false)
  
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
        setError('failed to load classes. please refresh the page.')
        setClasses([])
        setLoading(false)
        return
      }

      if (data) {
        const today = format(new Date(), 'yyyy-MM-dd')
        
        const filteredData = data
          .filter((c) => c.time_slot && c.time_slot.date >= today && c.time_slot.date < BOOKING_CUTOFF_DATE)
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
      setError('failed to load classes. please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const pending = sessionStorage.getItem('signup_profile_pending')
    if (pending === 'true') {
      sessionStorage.removeItem('signup_profile_pending')
      setShowSignupNotice(true)
    }
  }, [])

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
    const period = hour >= 12 ? 'pm' : 'am'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const formatPrice = (cents: number, isDonation?: boolean) => {
    if (isDonation) return 'donation'
    if (cents === 0) return 'free'
    return `$${(cents / 100).toFixed(0)}`
  }

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'today'
    if (isTomorrow(date)) return 'tomorrow'
    return format(date, 'EEE, MMM d').toLowerCase()
  }

  const filteredClasses = classes.filter((c) => {
    if (!c.time_slot) return false
    if (filter === 'my-classes' && !myClassIds.has(c.id)) return false
    if (skillFilter !== 'all' && c.skill_level !== skillFilter) return false
    // Hide classes with 15 available spots and 0 clients
    const spotsLeft = c.max_capacity - c.booking_count
    if (spotsLeft === 15 && c.booking_count === 0) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {showSignupNotice && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-green-800 text-sm">
            Your account was created. If your name doesn’t appear in the menu, refresh the page or log out and back in.
          </p>
          <button
            type="button"
            onClick={() => setShowSignupNotice(false)}
            className="text-green-700 hover:text-green-900 text-sm font-medium shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <motion.div 
        className="pt-12 pb-8 px-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-normal text-stone-800 tracking-tight">classes</h1>
          <p className="text-stone-500 mt-3 tracking-wide">
            find and book your next session
          </p>
        </div>
      </motion.div>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        {/* Premium Segmented Filters */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-12 pb-8 border-b border-stone-100"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Segmented Control */}
          <div className="segmented-control">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'segmented-control-item-active' : 'segmented-control-item'}
            >
              all upcoming
            </button>
            {user && (
              <button
                onClick={() => setFilter('my-classes')}
                className={filter === 'my-classes' ? 'segmented-control-item-active' : 'segmented-control-item'}
              >
                my classes
              </button>
            )}
          </div>
          
          {/* Skill Filter */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-stone-200 text-sm text-stone-600 tracking-wide rounded-sm focus:outline-none focus:border-stone-400 transition-all duration-300"
          >
            <option value="all">all levels</option>
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </motion.div>

        {/* Classes Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              className="flex items-center justify-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              className="text-center py-24"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-stone-500 mb-6 tracking-wide">{error}</p>
              <button
                onClick={() => {
                  setLoading(true)
                  fetchClasses()
                }}
                className="btn-primary"
              >
                try again
              </button>
            </motion.div>
          ) : filteredClasses.length === 0 ? (
            <motion.div 
              key="empty"
              className="text-center py-24"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-normal text-stone-800 mb-3 tracking-tight">no classes found</h3>
              <p className="text-stone-500 tracking-wide">
                {filter === 'my-classes'
                  ? "you haven't registered for any classes yet."
                  : filter !== 'all' || skillFilter !== 'all'
                  ? 'try adjusting your filters.'
                  : 'check back soon for new sessions.'}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              className="grid md:grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredClasses.map((yogaClass, index) => {
                const spotsLeft = yogaClass.max_capacity - yogaClass.booking_count
                const isFull = spotsLeft <= 0
                const isBooked = myClassIds.has(yogaClass.id)
                
                return (
                  <motion.div 
                    key={yogaClass.id} 
                    className="relative"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1] 
                    }}
                  >
                    <motion.div
                      className={`surface-card group ${isFull ? 'opacity-50' : ''}`}
                      whileHover={!isFull ? { 
                        y: -2,
                        boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.08)',
                      } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Link href={`/book/${yogaClass.id}`} className="block p-8">
                        {/* Booked indicator */}
                        {isBooked && (
                          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-4 tracking-wide">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            registered
                          </div>
                        )}
                        
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-normal text-stone-800 group-hover:text-stone-900 transition-colors duration-300 tracking-tight">
                              {yogaClass.title.toLowerCase()}
                            </h3>
                            <p className="text-stone-400 text-sm mt-1 tracking-wide">
                              {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                            </p>
                          </div>
                          <span className="text-stone-700 font-normal">
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
                            <span className="link-underline text-sm text-stone-600 tracking-wide">
                              book now
                            </span>
                          )}
                          {isFull && (
                            <span className="text-sm text-stone-400 tracking-wide">class full</span>
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
                              {isFull ? 'full' : `${spotsLeft} spots`}
                            </button>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                    
                    {/* Cancel Button for My Classes */}
                    {filter === 'my-classes' && isBooked && (
                      <motion.button
                        onClick={(e) => handleCancelBooking(yogaClass.id, e)}
                        disabled={cancelling === yogaClass.id}
                        className="w-full mt-2 py-3 border border-red-200 text-red-500 text-sm tracking-wide transition-all duration-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 rounded-sm"
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0 }}
                      >
                        {cancelling === yogaClass.id ? 'cancelling...' : 'cancel booking'}
                      </motion.button>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

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
