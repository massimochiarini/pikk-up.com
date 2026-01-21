'use client'

import { useEffect, useState } from 'react'
import { supabase, type Booking } from '@/lib/supabase'
import { XMarkIcon, UsersIcon } from '@heroicons/react/24/outline'
import { format, parseISO } from 'date-fns'

type ParticipantsModalProps = {
  classId: string
  classTitle: string
  isOwner: boolean // If true, show full details (phone numbers)
  onClose: () => void
}

type BookingWithProfile = Booking & {
  profile?: {
    first_name: string
    last_name: string
  }
}

export function ParticipantsModal({ classId, classTitle, isOwner, onClose }: ParticipantsModalProps) {
  const [bookings, setBookings] = useState<BookingWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('class_id', classId)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: true })

        if (!error && data) {
          setBookings(data)
        }
      } catch (err) {
        console.error('Error fetching participants:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
  }, [classId])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    return phone
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-neutral-200 max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-medium text-charcoal">Participants</h2>
            <p className="text-sm text-neutral-500 font-light">{classTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 transition-colors rounded"
          >
            <XMarkIcon className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500 font-light">No participants yet</p>
              <p className="text-neutral-400 text-sm font-light mt-1">
                Be the first to sign up!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wider text-neutral-400 mb-4">
                {bookings.length} registered
              </div>
              {bookings.map((booking, index) => (
                <div 
                  key={booking.id}
                  className="flex items-center gap-4 py-3 px-4 bg-neutral-50 border border-neutral-100"
                >
                  <div className="w-8 h-8 border border-neutral-200 flex items-center justify-center text-neutral-500 text-sm font-light bg-white flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-charcoal truncate">
                      {isOwner ? (
                        // Full name for class owner
                        `${booking.guest_first_name} ${booking.guest_last_name}`
                      ) : (
                        // First name + last initial for others (privacy)
                        `${booking.guest_first_name} ${booking.guest_last_name?.[0] || ''}.`
                      )}
                    </div>
                    {isOwner && booking.guest_phone && (
                      <div className="text-sm text-neutral-400 font-light">
                        {formatPhone(booking.guest_phone)}
                      </div>
                    )}
                  </div>
                  {isOwner && (
                    <div className="text-xs text-neutral-400 font-light flex-shrink-0">
                      {format(parseISO(booking.created_at), 'MMM d')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="w-full btn-secondary py-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
