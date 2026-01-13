'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type YogaClass, type TimeSlot, type Booking } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  bookings: Booking[]
}

export default function InstructorClassDetailPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const classId = params.classId as string

  const [yogaClass, setYogaClass] = useState<ClassWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !classId) return
    
    let isCancelled = false

    const fetchClass = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        time_slot:time_slots(*),
        bookings(*)
      `)
      .eq('id', classId)
      .single()

    if (isCancelled) return

    if (!error && data) {
      // Verify ownership
        if (data.instructor_id !== user.id) {
        router.push('/instructor/my-classes')
        return
      }
      setYogaClass(data as ClassWithDetails)
    }
    setLoading(false)
    }

    fetchClass()
    
    return () => {
      isCancelled = true
    }
  }, [user, classId, router])

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

  const getBookingUrl = () => {
    // Hardcoded production URL to avoid preview deployment URLs
    return `https://pikk-up-com.vercel.app/book/${classId}`
  }

  const copyBookingLink = () => {
    navigator.clipboard.writeText(getBookingUrl())
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleDeleteClass = async () => {
    if (!yogaClass) return
    
    setDeleting(true)
    try {
      // Delete the class
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (error) throw error

      // Update time slot back to available
      await supabase
        .from('time_slots')
        .update({ status: 'available' })
        .eq('id', yogaClass.time_slot_id)

      // Redirect to my classes
      router.push('/instructor/my-classes')
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('Failed to delete class. Please try again.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
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
          <p className="text-sand-600 mb-4">Please sign in to view class details.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  if (!yogaClass) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-sand-600 mb-4">Class not found or you don&apos;t have access.</p>
            <a href="/instructor/my-classes" className="btn-primary">Back to My Classes</a>
          </div>
        </div>
      </div>
    )
  }

  const confirmedBookings = getConfirmedBookings(yogaClass.bookings)
  const spotsLeft = yogaClass.max_capacity - confirmedBookings.length

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link 
          href="/instructor/my-classes" 
          className="text-sage-600 hover:text-sage-700 text-sm font-medium inline-flex items-center gap-1 mb-6"
        >
          ← Back to My Classes
        </Link>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-sage-300 to-sage-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🧘</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">{yogaClass.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-sand-600">
                  <span>📅 {format(parseISO(yogaClass.time_slot.date), 'EEE, MMM d, yyyy')}</span>
                  <span>🕐 {formatTime(yogaClass.time_slot.start_time)}</span>
                  <span>💰 {formatPrice(yogaClass.price_cents)}</span>
                </div>
                {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                  <span className="inline-block mt-2 px-2 py-1 bg-sage-100 text-sage-700 text-xs font-medium rounded-full capitalize">
                    {yogaClass.skill_level}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={copyBookingLink}
                className="btn-primary whitespace-nowrap"
              >
                {copiedLink ? '✓ Copied!' : '🔗 Copy Booking Link'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Booking Link */}
          <div className="mt-6 pt-6 border-t border-sand-200">
            <div className="text-sm text-sand-600 mb-2">Share this link with your students:</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={getBookingUrl()}
                readOnly
                className="input-field text-sm bg-sand-50"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-sage-600">{confirmedBookings.length}</div>
            <div className="text-sm text-sand-600">Registered</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-charcoal">{yogaClass.max_capacity}</div>
            <div className="text-sm text-sand-600">Capacity</div>
          </div>
          <div className="card text-center">
            <div className={`text-3xl font-bold ${spotsLeft <= 3 ? 'text-terracotta-600' : 'text-sage-600'}`}>
              {spotsLeft}
            </div>
            <div className="text-sm text-sand-600">Spots Left</div>
          </div>
        </div>

        {/* Description */}
        {yogaClass.description && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-charcoal mb-2">Description</h2>
            <p className="text-sand-700 whitespace-pre-wrap">{yogaClass.description}</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-charcoal mb-2">Delete Class?</h2>
                <p className="text-sand-600">
                  Are you sure you want to delete &quot;{yogaClass.title}&quot;? 
                  {confirmedBookings.length > 0 && (
                    <span className="block mt-2 text-red-600 font-medium">
                      Warning: {confirmedBookings.length} student{confirmedBookings.length !== 1 ? 's have' : ' has'} already registered!
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClass}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Class'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registered Students */}
        <div className="card">
          <h2 className="text-lg font-semibold text-charcoal mb-4">
            Registered Students ({confirmedBookings.length})
          </h2>
          
          {confirmedBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-sand-600">No students registered yet.</p>
              <p className="text-sand-500 text-sm mt-1">Share your booking link to get signups!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmedBookings.map((booking, index) => (
                <div 
                  key={booking.id}
                  className="flex items-center justify-between py-3 px-4 bg-sage-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sage-200 rounded-full flex items-center justify-center text-sage-700 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-charcoal">
                        {booking.guest_first_name} {booking.guest_last_name}
                      </div>
                      {booking.guest_phone && (
                        <div className="text-sm text-sand-600">
                          {booking.guest_phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-sand-500">
                    {format(parseISO(booking.created_at), 'MMM d, h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
