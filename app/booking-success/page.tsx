'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, type YogaClass, type TimeSlot } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDaysIcon, ClockIcon, MapPinIcon, CheckIcon } from '@heroicons/react/24/outline'

type ClassWithSlot = YogaClass & {
  time_slot: TimeSlot
}

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [loading, setLoading] = useState(true)
  const [yogaClass, setYogaClass] = useState<ClassWithSlot | null>(null)

  const fetchBookingDetails = useCallback(async () => {
    try {
      // Fetch payment by session ID to get class details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('class_id')
        .eq('stripe_checkout_session_id', sessionId)
        .single()

      if (paymentError || !payment) {
        // Payment might not be recorded yet, show generic success
        setLoading(false)
        return
      }

      // Fetch class details
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          time_slot:time_slots(*)
        `)
        .eq('id', payment.class_id)
        .single()

      if (!classError && classData) {
        setYogaClass(classData as ClassWithSlot)
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      // Give webhook time to process
      setTimeout(() => {
        fetchBookingDetails()
      }, 1500)
    } else {
      setLoading(false)
    }
  }, [sessionId, fetchBookingDetails])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 font-light">Confirming your booking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with artwork */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src="/gallery/8.jpg"
          alt="Untitled 08"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-white/60" />
      </div>

      <div className="max-w-md mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 border border-charcoal flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-8 h-8 text-charcoal" />
          </div>
          
          <h1 className="text-2xl font-light text-charcoal mb-2">
            Payment Successful
          </h1>
          <p className="text-neutral-500 font-light mb-8">
            Your spot has been reserved. Check your phone for a confirmation text.
          </p>

          {yogaClass && yogaClass.time_slot && (
            <div className="border border-neutral-100 p-6 text-left space-y-4 mb-8">
              <div className="font-medium text-charcoal text-lg">
                {yogaClass.title}
              </div>
              <div className="space-y-3">
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
            </div>
          )}

          <div className="space-y-3">
            <a
              href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full block py-4"
            >
              Get Directions
            </a>
            <Link href="/classes" className="btn-secondary w-full block py-4">
              Browse More Classes
            </Link>
          </div>

          <p className="text-neutral-400 text-xs mt-8 font-light">
            See you there! For questions, contact the instructor through the class details.
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500 font-light">Loading...</p>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BookingSuccessContent />
    </Suspense>
  )
}
