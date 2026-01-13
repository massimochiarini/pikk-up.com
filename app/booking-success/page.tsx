'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, type YogaClass, type TimeSlot } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sand-600">Confirming your booking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full card text-center">
        <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        
        <h1 className="text-2xl font-bold text-charcoal mb-2">
          Payment Successful!
        </h1>
        <p className="text-sand-600 mb-6">
          Your spot has been reserved. Check your phone for a text confirmation with all the details.
        </p>

        {yogaClass && yogaClass.time_slot && (
          <div className="bg-sage-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="font-semibold text-charcoal text-lg mb-3">
              {yogaClass.title}
            </div>
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
        )}

        <div className="bg-sand-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-sand-700">
            📸 <strong>Pro tip:</strong> Screenshot this page to save your class details!
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full block"
          >
            📍 Get Directions
          </a>
          <Link href="/classes" className="btn-secondary w-full block">
            Browse More Classes
          </Link>
        </div>

        <p className="text-sand-500 text-xs mt-6">
          See you there! For questions, contact the instructor through the class details.
        </p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sand-600">Loading...</p>
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
