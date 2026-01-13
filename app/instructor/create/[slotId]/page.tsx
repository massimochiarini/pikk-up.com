'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type TimeSlot } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

export default function CreateClassPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slotId = params.slotId as string

  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdClassId, setCreatedClassId] = useState<string | null>(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('15')
  const [skillLevel, setSkillLevel] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !slotId) return

    const fetchTimeSlot = async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', slotId)
      .single()

    if (error || !data) {
      setError('Time slot not found')
    } else {
      setTimeSlot(data)
    }
    setLoading(false)
    }

    fetchTimeSlot()
  }, [user, slotId])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !timeSlot || submitting) return

    setSubmitting(true)
    setError('')

    try {
      // Check if a class already exists for this time slot
      const { data: existingClass } = await supabase
        .from('classes')
        .select('id')
        .eq('time_slot_id', timeSlot.id)
        .single()

      if (existingClass) {
        throw new Error('A class already exists for this time slot')
      }

      const priceCents = Math.round(parseFloat(price || '0') * 100)

      const { data, error: createError } = await supabase
        .from('classes')
        .insert({
          instructor_id: user.id,
          time_slot_id: timeSlot.id,
          title: title.trim(),
          description: description.trim() || null,
          price_cents: priceCents,
          max_capacity: parseInt(maxCapacity),
          skill_level: skillLevel,
          status: 'upcoming',
        })
        .select()
        .single()

      if (createError) throw createError

      setCreatedClassId(data.id)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to create class')
      setSubmitting(false)
    }
  }

  const getBookingUrl = () => {
    if (!createdClassId) return ''
    // Hardcoded production URL to avoid preview deployment URLs
    return `https://pikk-up-com.vercel.app/book/${createdClassId}`
  }

  const copyBookingLink = () => {
    navigator.clipboard.writeText(getBookingUrl())
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
          <p className="text-sand-600 mb-4">Please sign in to create a class.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  if (success && createdClassId) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card text-center">
            <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-charcoal mb-2">Class Created!</h1>
            <p className="text-sand-600 mb-8">
              Your class is now live on the marketplace. Share the booking link with your students!
            </p>

            <div className="bg-sage-50 rounded-xl p-6 mb-6">
              <div className="text-sm text-sage-600 mb-2">Booking Link</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={getBookingUrl()}
                  readOnly
                  className="input-field text-sm bg-white"
                />
                <button
                  onClick={copyBookingLink}
                  className="btn-primary whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/instructor/my-classes" className="btn-secondary">
                View My Classes
              </Link>
              <Link href="/instructor/schedule" className="btn-outline">
                Schedule Another
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href="/instructor/schedule" 
            className="text-sage-600 hover:text-sage-700 text-sm font-medium inline-flex items-center gap-1"
          >
            ← Back to Schedule
          </Link>
          <h1 className="text-3xl font-bold text-charcoal mt-4">Create Your Class</h1>
          <p className="text-sand-600 mt-1">
            Fill in the details for your yoga session.
          </p>
        </div>

        {/* Time Slot Info */}
        {timeSlot && (
          <div className="card mb-8 bg-gradient-to-r from-sage-50 to-sand-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="font-semibold text-charcoal">
                  {format(parseISO(timeSlot.date), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-sand-600">
                  {formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="label">Class Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Sunrise Vinyasa Flow"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="label">
                Description <span className="text-sand-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Describe what students can expect from your class..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="label">Price ($)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field"
                  placeholder="0 for free"
                />
                <p className="text-sand-500 text-xs mt-1">Leave empty or 0 for free class</p>
              </div>
              <div>
                <label htmlFor="capacity" className="label">Max Capacity</label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  max="50"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="skillLevel" className="label">Skill Level</label>
              <select
                id="skillLevel"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="input-field"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/instructor/schedule" className="btn-outline flex-1 text-center">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="btn-primary flex-1"
              >
                {submitting ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
