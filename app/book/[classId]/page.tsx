'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon, CheckIcon, LinkIcon } from '@heroicons/react/24/outline'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
}

function PublicBookingContent() {
  const params = useParams()
  const classId = params.classId as string
  const { user } = useAuth()
  
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
  
  // Optional account creation
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

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
      // Check if user has a profile before associating booking
      let userId = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        // Only set user_id if profile exists
        if (profile) {
          userId = user.id
        }
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          class_id: classId,
          user_id: userId,
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

      // If user is not logged in, offer to create account
      if (!user && bookingData) {
        setBookingId(bookingData.id)
        setShowAccountPrompt(true)
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
      // Check if user has a profile before associating booking
      let userId = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        // Only set user_id if profile exists
        if (profile) {
          userId = user.id
        }
      }

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
          userId: userId,
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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingAccount(true)
    setErrorMessage('')

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountEmail,
        password: accountPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile via API route
        const response = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authData.user.id,
            email: accountEmail,
            firstName,
            lastName,
            isInstructor: false,
            phone: phone.replace(/\D/g, '') || null,
          }),
        })

        if (response.ok && bookingId) {
          // Associate the booking with the new user
          await supabase
            .from('bookings')
            .update({ user_id: authData.user.id })
            .eq('id', bookingId)
        }

        // Success! Hide the prompt
        setShowAccountPrompt(false)
        alert('Account created! You can now view and manage your bookings in "My Classes".')
      }
    } catch (error: any) {
      console.error('Account creation error:', error)
      setErrorMessage(error.message || 'Failed to create account')
    } finally {
      setCreatingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!yogaClass || bookingState === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-neutral-400">?</span>
          </div>
          <h1 className="text-2xl font-light text-charcoal mb-2">Class Not Found</h1>
          <p className="text-neutral-500 font-light mb-8">
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 border border-charcoal flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-8 h-8 text-charcoal" />
          </div>
          <h1 className="text-2xl font-light text-charcoal mb-2">You&apos;re All Set</h1>
          <p className="text-neutral-500 font-light mb-8">
            Your spot has been reserved. Check your phone for a confirmation text.
          </p>
          
          <div className="border border-neutral-200 p-6 text-left space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm">
              <CalendarDaysIcon className="w-5 h-5 text-neutral-400" />
              <span className="text-charcoal font-light">
                {format(parseISO(yogaClass.time_slot.date), 'EEEE, MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ClockIcon className="w-5 h-5 text-neutral-400" />
              <span className="text-charcoal font-light">
                {formatTime(yogaClass.time_slot.start_time)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPinIcon className="w-5 h-5 text-neutral-400" />
              <span className="text-charcoal font-light">
                PikkUp Studio, 2500 South Miami Ave
              </span>
            </div>
          </div>

          {/* Optional Account Creation */}
          {showAccountPrompt && !user && (
            <div className="border border-neutral-200 p-6 mb-8 text-left">
              <h3 className="font-medium text-charcoal mb-2">Save your bookings</h3>
              <p className="text-sm text-neutral-500 font-light mb-4">
                Create an account to view and manage all your classes.
              </p>
              
              <form onSubmit={handleCreateAccount} className="space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                    {errorMessage}
                  </div>
                )}
                
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="input-field"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="input-field"
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creatingAccount}
                    className="btn-primary flex-1"
                  >
                    {creatingAccount ? 'Creating...' : 'Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAccountPrompt(false)}
                    className="btn-secondary flex-1"
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-light tracking-tight text-charcoal">
            PikkUp
          </Link>
          <button
            onClick={copyBookingLink}
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-charcoal transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            {linkCopied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left side - Artwork + Class Details */}
          <div>
            {/* Artwork Header */}
            <div className="relative aspect-[4/3] mb-6 overflow-hidden bg-neutral-100">
              <Image
                src="/gallery/3.jpg"
                alt="Untitled 03"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <p className="gallery-caption text-center mb-8">Untitled 03</p>

            {/* Class Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-light text-charcoal mb-2">{yogaClass.title}</h1>
                {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                  <span className="text-xs uppercase tracking-wider text-neutral-400">
                    {yogaClass.skill_level}
                  </span>
                )}
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4 py-6 border-y border-neutral-100">
                <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center text-charcoal font-light">
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
                      className="text-neutral-500 text-sm hover:text-charcoal transition-colors"
                    >
                      @{yogaClass.instructor.instagram.replace('@', '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <CalendarDaysIcon className="w-5 h-5 text-neutral-400" />
                  <div>
                    <div className="text-charcoal">
                      {format(parseISO(yogaClass.time_slot.date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-neutral-500 text-sm font-light">
                      {formatTime(yogaClass.time_slot.start_time)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <MapPinIcon className="w-5 h-5 text-neutral-400" />
                  <div>
                    <div className="text-charcoal">PikkUp Studio</div>
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 text-sm hover:text-charcoal transition-colors"
                    >
                      2500 South Miami Avenue
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <UsersIcon className="w-5 h-5 text-neutral-400" />
                  <div>
                    <div className={`${isFull ? 'text-red-500' : 'text-charcoal'}`}>
                      {isFull ? 'Class Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                    </div>
                    <div className="text-neutral-500 text-sm font-light">
                      {bookingCount} / {yogaClass.max_capacity} registered
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {yogaClass.description && (
                <div className="pt-6 border-t border-neutral-100">
                  <p className="text-neutral-600 font-light leading-relaxed whitespace-pre-wrap">
                    {yogaClass.description}
                  </p>
                </div>
              )}

              {yogaClass.instructor.bio && (
                <div className="pt-6 border-t border-neutral-100">
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 mb-3">About the instructor</h3>
                  <p className="text-neutral-600 font-light leading-relaxed">
                    {yogaClass.instructor.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Booking Form */}
          <div>
            <div className="lg:sticky lg:top-8">
              <div className="border border-neutral-200 p-8">
                {/* Price */}
                <div className="text-center mb-8 pb-8 border-b border-neutral-100">
                  <div className="text-3xl font-light text-charcoal">{formatPrice(yogaClass.price_cents)}</div>
                  <div className="text-neutral-500 text-sm font-light mt-1">per person</div>
                </div>

                {isFull ? (
                  <div className="text-center py-8">
                    <h3 className="text-xl font-light text-charcoal mb-2">Class Full</h3>
                    <p className="text-neutral-500 font-light mb-6">
                      All spots have been filled for this class.
                    </p>
                    <Link href="/classes" className="btn-secondary w-full">
                      Find Another Class
                    </Link>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-medium text-charcoal mb-6">Reserve Your Spot</h2>

                    {paymentCancelled && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 mb-6 text-sm font-light">
                        Payment was cancelled. You can try again when you&apos;re ready.
                      </div>
                    )}

                    {errorMessage && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
                        {errorMessage}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label htmlFor="firstName" className="label">First Name</label>
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
                        <label htmlFor="lastName" className="label">Last Name</label>
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
                        <label htmlFor="phone" className="label">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="input-field"
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                        <p className="text-neutral-400 text-xs mt-2 font-light">
                          We&apos;ll send your confirmation via text.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full py-4"
                      >
                        {submitting
                          ? 'Processing...'
                          : yogaClass.price_cents > 0
                            ? `Pay ${formatPrice(yogaClass.price_cents)} & Reserve`
                            : 'Reserve My Spot'}
                      </button>

                      {yogaClass.price_cents > 0 && (
                        <p className="text-neutral-400 text-xs text-center font-light">
                          Secure payment powered by Stripe
                        </p>
                      )}
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
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
