'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon, CheckIcon, LinkIcon, ChevronDownIcon, ChevronUpIcon, TicketIcon } from '@heroicons/react/24/outline'
import type { InstructorPackage } from '@/lib/supabase'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
}

function PublicBookingContent() {
  const params = useParams()
  const classId = params.classId as string
  const { user, profile } = useAuth()
  
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
  const [donationAmount, setDonationAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [profileFieldsSet, setProfileFieldsSet] = useState(false)
  
  // Pre-fill form fields from profile when logged in
  useEffect(() => {
    if (profile && !profileFieldsSet) {
      if (profile.first_name) setFirstName(profile.first_name)
      if (profile.last_name) setLastName(profile.last_name)
      if (profile.phone) setPhone(profile.phone)
      setProfileFieldsSet(true)
    }
  }, [profile, profileFieldsSet])
  
  // Optional account creation
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  
  // Participants list
  const [showParticipants, setShowParticipants] = useState(false)
  const [participants, setParticipants] = useState<{ first_name: string; last_initial: string }[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  
  // Package credits
  const [availableCredits, setAvailableCredits] = useState(0)
  const [instructorPackages, setInstructorPackages] = useState<InstructorPackage[]>([])
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null)
  const [useCredit, setUseCredit] = useState(false)
  
  // Already booked check
  const [isAlreadyBooked, setIsAlreadyBooked] = useState(false)
  const [checkingBooking, setCheckingBooking] = useState(true)

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

  // Check if user is already booked for this class
  useEffect(() => {
    if (!classId) {
      setCheckingBooking(false)
      return
    }

    const checkIfBooked = async () => {
      setCheckingBooking(true)
      try {
        // Check by user_id if logged in
        if (user?.id) {
          const { data: userBooking } = await supabase
            .from('bookings')
            .select('id')
            .eq('class_id', classId)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .single()
          
          if (userBooking) {
            setIsAlreadyBooked(true)
            setCheckingBooking(false)
            return
          }
        }
        
        // Check by phone if profile has one
        if (profile?.phone) {
          const { data: phoneBooking } = await supabase
            .from('bookings')
            .select('id')
            .eq('class_id', classId)
            .eq('guest_phone', profile.phone)
            .eq('status', 'confirmed')
            .single()
          
          if (phoneBooking) {
            setIsAlreadyBooked(true)
            setCheckingBooking(false)
            return
          }
        }
        
        setIsAlreadyBooked(false)
      } catch (err) {
        // No booking found is fine
        setIsAlreadyBooked(false)
      } finally {
        setCheckingBooking(false)
      }
    }

    checkIfBooked()
  }, [classId, user?.id, profile?.phone])

  const fetchParticipants = async () => {
    if (loadingParticipants || participants.length > 0) return
    
    setLoadingParticipants(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('guest_first_name, guest_last_name')
        .eq('class_id', classId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true })

      if (!error && data) {
        setParticipants(
          data.map(b => ({
            first_name: b.guest_first_name || 'Guest',
            last_initial: b.guest_last_name?.[0] || ''
          }))
        )
      }
    } catch (err) {
      console.error('Error fetching participants:', err)
    } finally {
      setLoadingParticipants(false)
    }
  }

  const toggleParticipants = () => {
    if (!showParticipants && participants.length === 0) {
      fetchParticipants()
    }
    setShowParticipants(!showParticipants)
  }

  // Fetch instructor packages when class loads
  useEffect(() => {
    if (!yogaClass?.instructor_id) return

    const fetchPackages = async () => {
      try {
        const response = await fetch(`/api/packages/${yogaClass.instructor_id}`)
        const data = await response.json()
        if (response.ok) {
          setInstructorPackages(data.packages || [])
        }
      } catch (err) {
        console.error('Error fetching packages:', err)
      }
    }

    fetchPackages()
  }, [yogaClass?.instructor_id])

  // Check for credits when user is logged in or phone number changes
  useEffect(() => {
    if (!yogaClass?.instructor_id) {
      return
    }

    // Need either a logged-in user OR a phone number with at least 10 chars
    const enteredPhone = phone && phone.replace(/\D/g, '').length >= 10 ? phone : null
    // Also use the user's profile phone if available
    const profilePhone = profile?.phone || null
    const phoneToCheck = enteredPhone || profilePhone
    
    if (!user?.id && !phoneToCheck) {
      setAvailableCredits(0)
      setUseCredit(false)
      setLoadingCredits(false)
      return
    }

    const checkCredits = async () => {
      setLoadingCredits(true)
      try {
        const response = await fetch('/api/my-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorId: yogaClass.instructor_id,
            userId: user?.id || null,
            phone: phoneToCheck,
          }),
        })
        const data = await response.json()
        if (response.ok) {
          setAvailableCredits(data.credits || 0)
        }
      } catch (err) {
        console.error('Error checking credits:', err)
      } finally {
        setLoadingCredits(false)
      }
    }

    // Debounce the credit check
    const timer = setTimeout(checkCredits, 500)
    return () => clearTimeout(timer)
  }, [yogaClass?.instructor_id, phone, user?.id, profile?.phone])

  const handlePurchasePackage = async (pkg: InstructorPackage) => {
    if (!firstName || !lastName || !phone) {
      setErrorMessage('Please fill in your name and phone number first')
      return
    }

    setPurchasingPackage(pkg.id)
    setErrorMessage('')

    try {
      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          userId: user?.id || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start purchase')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to purchase package')
    } finally {
      setPurchasingPackage(null)
    }
  }

  const handleBookWithCredit = async () => {
    if (!yogaClass || !firstName || !lastName || !phone) {
      setErrorMessage('Please fill in all required fields')
      return
    }

    if (availableCredits < 1) {
      setErrorMessage('No credits available')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/book-with-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          userId: user?.id || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book with credit')
      }

      // Success!
      setBookingState('success')
      setAvailableCredits(data.creditsRemaining)

      // Reload booking count
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'confirmed')
      setBookingCount(count || 0)

      // If user is not logged in, offer to create account
      if (!user && data.booking) {
        setBookingId(data.booking.id)
        setShowAccountPrompt(true)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to book with credit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    
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

      // Donation-based class
      if (yogaClass.is_donation) {
        const donationCents = Math.round(parseFloat(donationAmount || '0') * 100)
        if (donationCents === 0) {
          // $0 donation - book directly as free
          await handleFreeBooking()
        } else {
          // Positive donation - redirect to Stripe
          await handlePaidBooking(donationCents, true)
        }
        return
      }

      // Free class - book directly
      if (yogaClass.price_cents === 0) {
        await handleFreeBooking()
        return
      }

      // Paid class - redirect to Stripe
      await handlePaidBooking(yogaClass.price_cents, false)
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
          .select('id, phone')
          .eq('id', user.id)
          .single()
        
        // Only set user_id if profile exists
        if (profile) {
          userId = user.id
          
          // Update profile phone if not already set
          if (!profile.phone && phone) {
            await supabase
              .from('profiles')
              .update({ phone: phone.replace(/\D/g, '') })
              .eq('id', user.id)
          }
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
            venueName: 'PickUp Studio',
            venueAddress: '2500 South Miami Avenue',
            cost: 0,
            bookingId: bookingData.id,
          }
        })
      } catch (smsError) {
        console.error('SMS error:', smsError)
      }

      // Send email confirmation (if user is logged in and has email)
      console.log('Checking for email confirmation. Profile email:', profile?.email)
      if (profile?.email) {
        try {
          console.log('Sending email confirmation to:', profile.email)
          const { data: emailResult, error: emailFuncError } = await supabase.functions.invoke('send-email-confirmation', {
            body: {
              to: profile.email,
              guestName: `${firstName.trim()} ${lastName.trim()}`,
              sessionTitle: yogaClass!.title,
              sessionDate: format(parseISO(yogaClass!.time_slot.date), 'EEEE, MMM d, yyyy'),
              sessionTime: formatTime(yogaClass!.time_slot.start_time),
              venueName: 'PickUp Studio',
              venueAddress: '2500 South Miami Avenue',
              cost: 0,
              bookingId: bookingData.id,
            }
          })
          if (emailFuncError) {
            console.error('Email function error:', emailFuncError)
          } else {
            console.log('Email confirmation result:', emailResult)
          }
        } catch (emailError) {
          console.error('Email error:', emailError)
        }
      } else {
        console.log('No email in profile, skipping email confirmation')
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

  const handlePaidBooking = async (priceCents: number, isDonation: boolean) => {
    try {
      // Check if user has a profile before associating booking
      let userId = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, phone')
          .eq('id', user.id)
          .single()
        
        // Only set user_id if profile exists
        if (profile) {
          userId = user.id
          
          // Update profile phone if not already set
          if (!profile.phone && phone) {
            await supabase
              .from('profiles')
              .update({ phone: phone.replace(/\D/g, '') })
              .eq('id', user.id)
          }
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
          priceCents,
          isDonation,
          sessionTitle: yogaClass!.title,
          sessionDate: format(parseISO(yogaClass!.time_slot.date), 'EEEE, MMM d, yyyy'),
          sessionTime: formatTime(yogaClass!.time_slot.start_time),
          venueName: 'PickUp Studio',
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

  const formatPrice = (cents: number, isDonation?: boolean) => {
    if (isDonation) return 'Donation'
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
                PickUp Studio, 2500 South Miami Ave
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
            PickUp
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
          {/* Left side - Image + Class Details */}
          <div>
            {/* Event Image (only show if one is set) */}
            {yogaClass.image_url && (
              <>
                <div className="relative aspect-[4/3] mb-6 overflow-hidden bg-neutral-100">
                  <Image
                    src={yogaClass.image_url}
                    alt={yogaClass.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </>
            )}

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
                    <div className="text-charcoal">PickUp Studio</div>
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

{/* Only show spots/capacity to instructor who created the class or admin */}
                {(profile?.is_admin || user?.id === yogaClass.instructor_id) ? (
                  <div className="flex items-start gap-4">
                    <UsersIcon className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div className="flex-1">
                      <div className={`${isFull ? 'text-red-500' : 'text-charcoal'}`}>
                        {isFull ? 'Class Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                      </div>
                      <button
                        onClick={toggleParticipants}
                        className="text-neutral-500 text-sm font-light hover:text-charcoal transition-colors flex items-center gap-1"
                      >
                        {bookingCount} / {yogaClass.max_capacity} registered
                        {bookingCount > 0 && (
                          showParticipants ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )
                        )}
                      </button>
                      
                      {/* Participants list */}
                      {showParticipants && bookingCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          {loadingParticipants ? (
                            <div className="flex items-center gap-2 text-sm text-neutral-400">
                              <div className="w-4 h-4 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
                              Loading...
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {participants.map((p, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-neutral-50 text-neutral-600 text-sm font-light"
                                >
                                  {p.first_name} {p.last_initial}.
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <UsersIcon className="w-5 h-5 text-neutral-400" />
                    <div className="text-charcoal">Group class</div>
                  </div>
                )}
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
                  <div className="text-3xl font-light text-charcoal">{formatPrice(yogaClass.price_cents, yogaClass.is_donation)}</div>
                  <div className="text-neutral-500 text-sm font-light mt-1">per person</div>
                </div>

                {isAlreadyBooked ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border border-green-200 bg-green-50 flex items-center justify-center mx-auto mb-6">
                      <CheckIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-light text-charcoal mb-2">You&apos;re Registered</h3>
                    <p className="text-neutral-500 font-light mb-6">
                      You&apos;re already signed up for this class. We&apos;ll see you there!
                    </p>
                    
                    <div className="border border-neutral-200 p-4 text-left mb-6">
                      <div className="flex items-center gap-3 text-sm mb-2">
                        <CalendarDaysIcon className="w-5 h-5 text-neutral-400" />
                        <span className="text-charcoal font-light">
                          {format(parseISO(yogaClass.time_slot.date), 'EEEE, MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm mb-2">
                        <ClockIcon className="w-5 h-5 text-neutral-400" />
                        <span className="text-charcoal font-light">
                          {formatTime(yogaClass.time_slot.start_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPinIcon className="w-5 h-5 text-neutral-400" />
                        <span className="text-charcoal font-light">
                          PickUp Studio, 2500 South Miami Ave
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Link href="/my-classes" className="btn-primary w-full block text-center">
                        View My Classes
                      </Link>
                      <Link href="/classes" className="btn-secondary w-full block text-center">
                        Browse More Classes
                      </Link>
                    </div>
                  </div>
                ) : isFull ? (
                  <div className="text-center py-8">
                    <h3 className="text-xl font-light text-charcoal mb-2">Class Full</h3>
                    <p className="text-neutral-500 font-light mb-6">
                      All spots have been filled for this class.
                    </p>
                    <Link href="/classes" className="btn-secondary w-full">
                      Find Another Class
                    </Link>
                  </div>
                ) : user && profile && profile.first_name && profile.last_name && profile.phone ? (
                  /* Logged-in user with complete profile - simplified booking view */
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

                    {/* Show user info */}
                    <div className="border border-neutral-100 p-4 mb-6 bg-neutral-50">
                      <div className="text-sm text-neutral-500 font-light mb-1">Booking as</div>
                      <div className="font-medium text-charcoal">
                        {profile.first_name} {profile.last_name}
                      </div>
                      <div className="text-sm text-neutral-500 font-light">{profile.phone}</div>
                    </div>

                    <div className="space-y-5">
                      {/* Available Credits Display */}
                      {availableCredits > 0 && (
                        <div className="border border-green-100 p-4 bg-green-50">
                          <div className="flex items-center gap-2 mb-3">
                            <TicketIcon className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">
                              You have {availableCredits} credit{availableCredits !== 1 ? 's' : ''} with {yogaClass.instructor.first_name}
                            </span>
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useCredit}
                              onChange={(e) => setUseCredit(e.target.checked)}
                              className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-charcoal">Use 1 credit for this class (instead of paying)</span>
                          </label>
                        </div>
                      )}

                      {/* Loading credits indicator */}
                      {loadingCredits && (
                        <div className="flex items-center gap-2 text-neutral-400 text-sm py-2">
                          <div className="w-4 h-4 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
                          Checking for package credits...
                        </div>
                      )}

                      {/* Donation Amount Input for donation-based classes */}
                      {yogaClass.is_donation && !useCredit && (
                        <div className="border border-neutral-100 p-4 bg-neutral-50">
                          <label htmlFor="donation" className="label">Donation Amount (Optional)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                            <input
                              type="number"
                              id="donation"
                              min="0"
                              step="1"
                              value={donationAmount}
                              onChange={(e) => setDonationAmount(e.target.value)}
                              className="input-field pl-7"
                              placeholder="0"
                            />
                          </div>
                          <p className="text-neutral-400 text-xs mt-2 font-light">
                            This class is donation-based. Enter any amount you&apos;d like to contribute, or leave empty to attend for free.
                          </p>
                        </div>
                      )}

                      {/* Submit Button */}
                      {useCredit ? (
                        <button
                          type="button"
                          onClick={handleBookWithCredit}
                          disabled={submitting}
                          className="btn-primary w-full py-4"
                        >
                          {submitting ? 'Processing...' : 'Use Credit & Reserve'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="btn-primary w-full py-4"
                        >
                          {submitting
                            ? 'Processing...'
                            : yogaClass.is_donation
                              ? parseFloat(donationAmount || '0') > 0
                                ? `Donate $${parseFloat(donationAmount).toFixed(0)} & Reserve`
                                : 'Reserve My Spot'
                              : yogaClass.price_cents > 0
                                ? `Pay ${formatPrice(yogaClass.price_cents)} & Reserve`
                                : 'Reserve My Spot'}
                        </button>
                      )}

                      {!useCredit && (yogaClass.price_cents > 0 || (yogaClass.is_donation && parseFloat(donationAmount || '0') > 0)) && (
                        <p className="text-neutral-400 text-xs text-center font-light">
                          Secure payment powered by Stripe
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  /* Guest or incomplete profile - show full form */
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

                      {/* Available Credits Display */}
                      {availableCredits > 0 && (
                        <div className="border border-green-100 p-4 bg-green-50">
                          <div className="flex items-center gap-2 mb-3">
                            <TicketIcon className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">
                              You have {availableCredits} credit{availableCredits !== 1 ? 's' : ''} with {yogaClass.instructor.first_name}
                            </span>
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useCredit}
                              onChange={(e) => setUseCredit(e.target.checked)}
                              className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-charcoal">Use 1 credit for this class (instead of paying)</span>
                          </label>
                        </div>
                      )}
                      
                      {/* Loading credits indicator */}
                      {loadingCredits && (user || (phone && phone.replace(/\D/g, '').length >= 10)) && (
                        <div className="flex items-center gap-2 text-neutral-400 text-sm py-2">
                          <div className="w-4 h-4 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
                          Checking for package credits...
                        </div>
                      )}

                      {/* Donation Amount Input for donation-based classes */}
                      {yogaClass.is_donation && !useCredit && (
                        <div className="border border-neutral-100 p-4 bg-neutral-50">
                          <label htmlFor="donation" className="label">Donation Amount (Optional)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                            <input
                              type="number"
                              id="donation"
                              min="0"
                              step="1"
                              value={donationAmount}
                              onChange={(e) => setDonationAmount(e.target.value)}
                              className="input-field pl-7"
                              placeholder="0"
                            />
                          </div>
                          <p className="text-neutral-400 text-xs mt-2 font-light">
                            This class is donation-based. Enter any amount you&apos;d like to contribute, or leave empty to attend for free.
                          </p>
                        </div>
                      )}

                      {/* Submit Button */}
                      {useCredit ? (
                        <button
                          type="button"
                          onClick={handleBookWithCredit}
                          disabled={submitting}
                          className="btn-primary w-full py-4"
                        >
                          {submitting ? 'Processing...' : 'Use Credit & Reserve'}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn-primary w-full py-4"
                        >
                          {submitting
                            ? 'Processing...'
                            : yogaClass.is_donation
                              ? parseFloat(donationAmount || '0') > 0
                                ? `Donate $${parseFloat(donationAmount).toFixed(0)} & Reserve`
                                : 'Reserve My Spot'
                              : yogaClass.price_cents > 0
                                ? `Pay ${formatPrice(yogaClass.price_cents)} & Reserve`
                                : 'Reserve My Spot'}
                        </button>
                      )}

                      {!useCredit && (yogaClass.price_cents > 0 || (yogaClass.is_donation && parseFloat(donationAmount || '0') > 0)) && (
                        <p className="text-neutral-400 text-xs text-center font-light">
                          Secure payment powered by Stripe
                        </p>
                      )}
                    </form>
                  </>
                )}
              </div>

              {/* Available Packages */}
              {instructorPackages.length > 0 && !isFull && (
                <div className="border border-neutral-200 p-6 mt-6">
                  <h3 className="text-lg font-medium text-charcoal mb-4 flex items-center gap-2">
                    <TicketIcon className="w-5 h-5" />
                    Save with a Package
                  </h3>
                  <p className="text-neutral-500 text-sm font-light mb-4">
                    Buy multiple classes from {yogaClass.instructor.first_name} and save.
                  </p>
                  <div className="space-y-3">
                    {instructorPackages.map((pkg) => {
                      const perClass = pkg.price_cents / pkg.class_count
                      const regularPrice = yogaClass.price_cents || 2500 // Default to $25 for comparison
                      const savings = regularPrice > perClass 
                        ? Math.round(((regularPrice - perClass) / regularPrice) * 100)
                        : 0

                      return (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between p-4 border border-neutral-100 hover:border-neutral-200 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-charcoal">{pkg.name}</div>
                            <div className="text-sm text-neutral-500 font-light">
                              {pkg.class_count} classes · ${(perClass / 100).toFixed(0)}/class
                              {savings > 0 && (
                                <span className="ml-2 text-green-600">Save {savings}%</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handlePurchasePackage(pkg)}
                            disabled={purchasingPackage === pkg.id || !firstName || !lastName || !phone}
                            className="px-4 py-2 border border-charcoal text-charcoal text-sm font-light hover:bg-charcoal hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {purchasingPackage === pkg.id ? 'Loading...' : `$${(pkg.price_cents / 100).toFixed(0)}`}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  {(!firstName || !lastName || !phone) && (
                    <p className="text-neutral-400 text-xs mt-3 font-light">
                      Enter your details above to purchase a package.
                    </p>
                  )}
                </div>
              )}
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
