'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type Profile, type TimeSlot } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

export default function AdminCreateClassPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  // Form state
  const [instructors, setInstructors] = useState<Profile[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceCents, setPriceCents] = useState(0)
  const [maxCapacity, setMaxCapacity] = useState(15)
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all'>('all')
  const [isDonation, setIsDonation] = useState(false)

  // UI state
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch instructors and available time slots
  useEffect(() => {
    if (!user || !profile?.is_admin) return

    const fetchData = async () => {
      setLoadingData(true)
      try {
        // Fetch approved instructors
        const { data: instructorData, error: instructorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_instructor', true)
          .order('first_name', { ascending: true })

        if (instructorError) {
          console.error('Error fetching instructors:', instructorError)
        } else {
          setInstructors(instructorData || [])
        }

        // Fetch available time slots (future dates only)
        const today = format(new Date(), 'yyyy-MM-dd')
        const { data: slotData, error: slotError } = await supabase
          .from('time_slots')
          .select('*')
          .eq('status', 'available')
          .gte('date', today)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (slotError) {
          console.error('Error fetching time slots:', slotError)
        } else {
          setTimeSlots(slotData || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [user, profile?.is_admin])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedInstructor || !selectedSlot || !title.trim()) {
      setError('Please select an instructor, a time slot, and enter a class title.')
      return
    }

    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('No session found. Please sign in again.')
        return
      }

      const response = await fetch('/api/admin/create-class', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorId: selectedInstructor,
          timeSlotId: selectedSlot,
          title: title.trim(),
          description: description.trim() || null,
          priceCents: isDonation ? 0 : priceCents,
          maxCapacity,
          skillLevel,
          isDonation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class')
      }

      setSuccess(data.message || 'Class created successfully!')

      // Reset form
      setSelectedSlot('')
      setTitle('')
      setDescription('')
      setPriceCents(0)
      setMaxCapacity(15)
      setSkillLevel('all')
      setIsDonation(false)

      // Remove the claimed slot from the list
      setTimeSlots((prev) => prev.filter((s) => s.id !== selectedSlot))

      // Redirect after a brief moment
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
    } catch (err: any) {
      console.error('Create class error:', err)
      setError(err.message || 'Failed to create class')
    } finally {
      setSubmitting(false)
    }
  }

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  // Not admin
  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-light text-charcoal mb-4">Admin Access Required</h1>
            <p className="text-neutral-500 font-light">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Group time slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {}
  timeSlots.forEach((slot) => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = []
    }
    slotsByDate[slot.date].push(slot)
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-charcoal transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-light text-charcoal">Create Class</h1>
          <p className="text-neutral-500 font-light mt-1">
            Create a new class and assign it to an instructor
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm mb-6 flex items-center gap-2">
            <CheckIcon className="w-4 h-4" />
            {success}
          </div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Instructor Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Instructor
              </label>
              {instructors.length === 0 ? (
                <p className="text-neutral-500 text-sm font-light">
                  No approved instructors found. Approve an instructor first.
                </p>
              ) : (
                <div className="space-y-2">
                  {instructors.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setSelectedInstructor(inst.id)}
                      className={`w-full text-left p-4 border transition-colors ${
                        selectedInstructor === inst.id
                          ? 'border-charcoal bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 flex items-center justify-center text-sm font-light ${
                          selectedInstructor === inst.id
                            ? 'bg-charcoal text-white'
                            : 'border border-neutral-200 text-charcoal'
                        }`}>
                          {inst.first_name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-charcoal">
                            {inst.first_name} {inst.last_name}
                          </div>
                          <div className="text-sm text-neutral-500">{inst.email}</div>
                        </div>
                        {selectedInstructor === inst.id && (
                          <CheckIcon className="w-5 h-5 text-charcoal ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Time Slot
              </label>
              {timeSlots.length === 0 ? (
                <p className="text-neutral-500 text-sm font-light">
                  No available time slots found.
                </p>
              ) : (
                <div className="space-y-6 max-h-80 overflow-y-auto border border-neutral-100 p-4">
                  {Object.entries(slotsByDate).map(([date, slots]) => (
                    <div key={date}>
                      <div className="text-xs uppercase tracking-wider text-neutral-400 mb-2 sticky top-0 bg-white py-1">
                        {format(parseISO(date), 'EEEE, MMM d')}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`p-3 border text-sm text-center transition-colors ${
                              selectedSlot === slot.id
                                ? 'border-charcoal bg-charcoal text-white'
                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                            }`}
                          >
                            {formatTime(slot.start_time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Class Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-charcoal mb-2">
                Class Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Vinyasa Flow, Gentle Yoga, Power Hour"
                className="w-full px-4 py-3 border border-neutral-200 text-charcoal placeholder-neutral-400 font-light focus:outline-none focus:border-charcoal transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-2">
                Description <span className="text-neutral-400 font-light">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the class..."
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 text-charcoal placeholder-neutral-400 font-light focus:outline-none focus:border-charcoal transition-colors resize-none"
              />
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Pricing
              </label>
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDonation}
                    onChange={(e) => {
                      setIsDonation(e.target.checked)
                      if (e.target.checked) setPriceCents(0)
                    }}
                    className="w-4 h-4 accent-stone-800"
                  />
                  <span className="text-sm text-neutral-600 font-light">Donation-based</span>
                </label>
              </div>
              {!isDonation && (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                  <input
                    type="number"
                    value={priceCents / 100 || ''}
                    onChange={(e) => setPriceCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="w-full pl-8 pr-4 py-3 border border-neutral-200 text-charcoal placeholder-neutral-400 font-light focus:outline-none focus:border-charcoal transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-charcoal mb-2">
                Max Capacity
              </label>
              <input
                id="capacity"
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 15)}
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-neutral-200 text-charcoal font-light focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Skill Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSkillLevel(level)}
                    className={`px-4 py-2.5 border text-sm transition-colors capitalize ${
                      skillLevel === level
                        ? 'border-charcoal bg-charcoal text-white'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedInstructor && selectedSlot && title && (
              <div className="border border-neutral-200 bg-neutral-50 p-6">
                <h3 className="text-sm font-medium text-charcoal mb-4">Summary</h3>
                <div className="space-y-2 text-sm text-neutral-600 font-light">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-neutral-400" />
                    <span>
                      {instructors.find((i) => i.id === selectedInstructor)?.first_name}{' '}
                      {instructors.find((i) => i.id === selectedInstructor)?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-neutral-400" />
                    <span>
                      {(() => {
                        const slot = timeSlots.find((s) => s.id === selectedSlot)
                        if (!slot) return 'Unknown slot'
                        return `${format(parseISO(slot.date), 'EEE, MMM d')} at ${formatTime(slot.start_time)}`
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-neutral-400" />
                    <span>
                      {title} · {isDonation ? 'Donation' : priceCents === 0 ? 'Free' : `$${(priceCents / 100).toFixed(0)}`} · {maxCapacity} spots
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !selectedInstructor || !selectedSlot || !title.trim()}
              className="w-full py-3 bg-charcoal text-white text-sm font-light tracking-wide hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Create Class'
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
