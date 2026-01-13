'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
}

function PublicBookingContent() {
  const params = useParams()
  const classId = params.classId as string
  
  // Check for payment cancelled using window.location instead of useSearchParams to avoid Suspense issues
  const [paymentCancelled, setPaymentCancelled] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setPaymentCancelled(urlParams.get('payment') === 'cancelled')
    }
  }, [])

  const [yogaClass, setYogaClass] = useState<ClassWithDetails | null>(null)
  const [bookingCount, setBookingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookingState, setBookingState] = useState<'form' | 'success' | 'error'>('form')
  
  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  const copyBookingLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  useEffect(() => {
    if (!classId) {
      console.log('No classId provided')
      return
    }

    let isCancelled = false

    const fetchClassDetails = async () => {
      try {
        console.log('Fetching class details for:', classId)
        setLoading(true)

        // Fetch class first
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single()

        if (isCancelled) return

        if (classError) {
          console.error('Class fetch error:', classError)
          throw classError
        }

        if (!classData) {
          throw new Error('Class not found')
        }

        // Fetch time slot
        const { data: timeSlotData, error: timeSlotError } = await supabase
          .from('time_slots')
          .select('*')
          .eq('id', classData.time_slot_id)
          .single()

        if (isCancelled) return

        if (timeSlotError) {
          console.error('Time slot fetch error:', timeSlotError)
          throw timeSlotError
        }

        // Fetch instructor profile
        const { data: instructorData, error: instructorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', classData.instructor_id)
          .single()

        if (isCancelled) return

        if (instructorError) {
          console.error('Instructor fetch error:', instructorError)
          throw instructorError
        }

        setYogaClass({
          ...classData,
          time_slot: timeSlotData,
          instructor: instructorData,
        } as ClassWithDetails)

        // Count bookings using RPC function (accessible to anonymous users)
        try {
          const { data: count, error: rpcError } = await supabase
            .rpc('get_booking_count', { class_uuid: classId })
          
          if (isCancelled) return

          if (rpcError) {
            console.error('RPC error:', rpcError)
            setBookingCount(0)
          } else {
            setBookingCount(count || 0)
          }
        } catch (countError) {
          console.error('Error counting bookings:', countError)
          setBookingCount(0)
        }

        console.log('Class details loaded successfully')
      } catch (error) {
        console.error('Error fetching class details:', error)
        if (!isCancelled) {
          setBookingState('error')
          setErrorMessage('Unable to load class details. This link may be invalid.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchClassDetails()

    return () => {
      isCancelled = true
    }
  }, [classId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!yogaClass || !firstName || !lastName || !phone) {
      setErrorMessage('Please fill in all required fields')
      return
    }

    // Phone validation
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
    if (!phoneRegex.test(phone)) {
      setErrorMessage('Please enter a valid phone number')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      // Check if class is full
      if (bookingCount >= yogaClass.max_capacity) {
        setErrorMessage('Sorry, this class is now full.')
        setSubmitting(false)
        return
      }

      // Check if phone already booked
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('class_id', classId)
        .eq('guest_phone', phone.replace(/\D/g, ''))
        .eq('status', 'confirmed')
        .single()

      if (existingBooking) {
        setErrorMessage('This phone number has already been registered for this class.')
        setSubmitting(false)
        return
      }

      // Free class - book directly
      if (yogaClass.price_cents === 0) {
        await handleFreeBooking()
        return
      }

      // Paid class - redirect to Stripe
      await handlePaidBooking()
    } catch (error: any) {
      console.error('Error processing booking:', error)
      setErrorMessage(error.message || 'Failed to process booking. Please try again.')
      setSubmitting(false)
    }
  }

  const handleFreeBooking = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          class_id: classId,
          user_id: null,
          guest_first_name: firstName.trim(),
          guest_last_name: lastName.trim(),
          guest_phone: phone.replace(/\D/g, ''),
          status: 'confirmed',
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Send SMS confirmation (best effort)
      try {
        await supabase.functions.invoke('send-sms-confirmation', {
          body: {
            to: phone,
            guestName: `${firstName.trim()} ${lastName.trim()}`,
            sessionTitle: yogaClass!.title,
            sessionDate: format(parseISO(yogaClass!.time_slot.date), 'EEEE, MMM d, yyyy'),
            sessionTime: formatTime(yogaClass!.time_slot.start_time),
            venueName: 'PikkUp Studio',
            venueAddress: '2500 South Miami Avenue',
            cost: 0,
            bookingId: bookingData.id,
          }
        })
      } catch (smsError) {
        console.error('SMS error:', smsError)
      }

      setBookingState('success')
      // Reload booking count
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'confirmed')
      setBookingCount(count || 0)
    } catch (error: any) {
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaidBooking = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          priceCents: yogaClass!.price_cents,
          sessionTitle: yogaClass!.title,
          sessionDate: format(parseISO(yogaClass!.time_slot.date), 'EEEE, MMM d, yyyy'),
          sessionTime: formatTime(yogaClass!.time_slot.start_time),
          venueName: 'PikkUp Studio',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      throw error
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-sand-50 to-sage-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!yogaClass || bookingState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-sand-50 to-sage-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-charcoal mb-2">Class Not Found</h1>
          <p className="text-sand-600 mb-6">
            {errorMessage || 'This booking link may be invalid or the class may have been cancelled.'}
          </p>
          <Link href="/classes" className="btn-primary">
            Browse Classes
          </Link>
        </div>
      </div>
    )
  }

  if (bookingState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card text-center">
          <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-charcoal mb-2">You&apos;re All Set!</h1>
          <p className="text-sand-600 mb-6">
            Your spot has been reserved! Check your phone for a text confirmation with all the details.
          </p>
          
          <div className="bg-sage-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span className="text-sm font-medium text-charcoal">
                {format(parseISO(yogaClass.time_slot.date), 'EEEE, MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>🕐</span>
              <span className="text-sm font-medium text-charcoal">
                {formatTime(yogaClass.time_slot.start_time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="text-sm font-medium text-charcoal">
                PikkUp Studio, 2500 South Miami Ave
              </span>
            </div>
          </div>

          <div className="bg-sand-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-sand-700">
              📸 <strong>Pro tip:</strong> Screenshot this page to save your class details!
            </p>
          </div>

          <Link href="/classes" className="btn-secondary">
            Browse More Classes
          </Link>
        </div>
      </div>
    )
  }

  const spotsLeft = yogaClass.max_capacity - bookingCount
  const isFull = spotsLeft <= 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-sand-50 to-sage-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-sand-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-sage-700">
            Pikk<span className="text-terracotta-500">Up</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Class Details */}
          <div className="card">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sage-300 to-sage-400 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🧘</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-charcoal">{yogaClass.title}</h1>
                  {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-sage-100 text-sage-700 text-xs font-medium rounded-full capitalize">
                      {yogaClass.skill_level}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={copyBookingLink}
                className="flex-shrink-0 px-3 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                {linkCopied ? '✓ Copied!' : '🔗 Share'}
              </button>
            </div>

            {/* Instructor */}
            <div className="mb-6 pb-6 border-b border-sand-200">
              <div className="text-xs uppercase font-semibold text-sand-500 mb-2">Instructor</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white font-semibold">
                  {yogaClass.instructor.first_name?.[0] || 'I'}
                </div>
                <div>
                  <div className="font-medium text-charcoal">
                    {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                  </div>
                  {yogaClass.instructor.instagram && (
                    <a
                      href={`https://instagram.com/${yogaClass.instructor.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-600 text-sm hover:underline"
                    >
                      @{yogaClass.instructor.instagram.replace('@', '')}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <div className="font-medium text-charcoal">
                    {format(parseISO(yogaClass.time_slot.date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-sand-600 text-sm">
                    {formatTime(yogaClass.time_slot.start_time)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <div className="font-medium text-charcoal">PikkUp Studio</div>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-600 text-sm hover:underline"
                  >
                    2500 South Miami Avenue
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <div className="font-medium text-sage-700">{formatPrice(yogaClass.price_cents)}</div>
                  <div className="text-sand-600 text-sm">per person</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">👥</span>
                <div>
                  <div className={`font-medium ${isFull ? 'text-red-600' : 'text-charcoal'}`}>
                    {isFull ? 'Class Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </div>
                  <div className="text-sand-600 text-sm">
                    {bookingCount} / {yogaClass.max_capacity} registered
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {yogaClass.description && (
              <div className="pt-6 border-t border-sand-200">
                <div className="text-xs uppercase font-semibold text-sand-500 mb-2">About this class</div>
                <p className="text-sand-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {yogaClass.description}
                </p>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="card">
            {isFull ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">😔</div>
                <h3 className="text-xl font-bold text-charcoal mb-2">Class Full</h3>
                <p className="text-sand-600 mb-6">
                  Sorry, all spots have been filled for this class.
                </p>
                <Link href="/classes" className="btn-secondary">
                  Find Another Class
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-charcoal mb-2">Reserve Your Spot</h2>
                <p className="text-sand-600 text-sm mb-6">
                  Fill out the form below to register for this class.
                </p>

                {paymentCancelled && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-4 text-sm">
                    ⚠️ Payment was cancelled. You can try again when you&apos;re ready.
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="label">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field"
                      placeholder="Jane"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="label">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field"
                      placeholder="Doe"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="label">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                    <p className="text-sand-500 text-xs mt-1">
                      We&apos;ll send your confirmation via text message.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-4 text-base"
                  >
                    {submitting
                      ? 'Processing...'
                      : yogaClass.price_cents > 0
                        ? `💳 Pay ${formatPrice(yogaClass.price_cents)} & Reserve`
                        : '✓ Reserve My Spot (Free)'}
                  </button>

                  {yogaClass.price_cents > 0 && (
                    <p className="text-sand-500 text-xs text-center">
                      🔒 Secure payment powered by Stripe
                    </p>
                  )}

                  <p className="text-sand-400 text-xs text-center">
                    By booking, you agree to receive confirmation and reminder texts about this class.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-sand-50 to-sage-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
    </div>
  )
}

export default function PublicBookingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PublicBookingContent />
    </Suspense>
  )
}
