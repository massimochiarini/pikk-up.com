'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { format, addDays } from 'date-fns'
import Link from 'next/link'
import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon, CheckIcon, LinkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

const TIME_OPTIONS = (() => {
  const times = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = String(hour).padStart(2, '0')
      const m = String(minute).padStart(2, '0')
      times.push({ value: `${h}:${m}`, label: formatTimeLabel(hour, minute) })
    }
  }
  return times
})()

function formatTimeLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  const displayMinute = minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`
  return `${displayHour}${displayMinute} ${period}`
}

export default function CreateClassPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdClasses, setCreatedClasses] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('15')
  const [skillLevel, setSkillLevel] = useState('all')
  
  // New fields for date/time/duration/recurrence
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [duration, setDuration] = useState(60)
  const [recurring, setRecurring] = useState(false)
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, authLoading, router])

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = addDays(new Date(), 1)
    setDate(format(tomorrow, 'yyyy-MM-dd'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submitting) return

    setSubmitting(true)
    setError('')

    try {
      const priceCents = Math.round(parseFloat(price || '0') * 100)

      const response = await fetch('/api/create-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: user.id,
          title: title.trim(),
          description: description.trim() || null,
          priceCents,
          maxCapacity: parseInt(maxCapacity),
          skillLevel,
          date,
          startTime: time,
          durationMinutes: duration,
          recurring,
          recurrenceWeeks: recurring ? recurrenceWeeks : 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class')
      }

      setCreatedClasses(data.classes)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to create class')
      setSubmitting(false)
    }
  }

  const getBookingUrl = (classId: string) => {
    return `https://pikk-up-com.vercel.app/book/${classId}`
  }

  const copyBookingLink = (classId: string) => {
    navigator.clipboard.writeText(getBookingUrl(classId))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  if (authLoading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 font-light mb-4">Please sign in to create a class.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  if (success && createdClasses.length > 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="border border-neutral-200 p-8 text-center">
            <div className="w-16 h-16 border border-charcoal flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="w-8 h-8 text-charcoal" />
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-2">
              {createdClasses.length === 1 ? 'Class Created' : `${createdClasses.length} Classes Created`}
            </h1>
            <p className="text-neutral-500 font-light mb-8">
              {createdClasses.length === 1 
                ? 'Your class is now live. Share the booking link with your students.'
                : 'Your recurring classes are now live. Share the booking links with your students.'}
            </p>

            <div className="space-y-4 mb-8">
              {createdClasses.map((cls, index) => (
                <div key={cls.id} className="border border-neutral-100 p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDaysIcon className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-charcoal">
                      {format(new Date(cls.date), 'EEEE, MMM d, yyyy')} at {formatTime(cls.start_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={getBookingUrl(cls.id)}
                      readOnly
                      className="input-field text-xs bg-neutral-50 flex-1"
                    />
                    <button
                      onClick={() => copyBookingLink(cls.id)}
                      className="btn-secondary text-sm px-3 py-2 flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/instructor/my-classes" className="btn-secondary py-4">
                View My Classes
              </Link>
              <button 
                onClick={() => {
                  setSuccess(false)
                  setCreatedClasses([])
                  setTitle('')
                  setDescription('')
                  setPrice('')
                  setRecurring(false)
                }}
                className="btn-primary py-4"
              >
                Create Another Class
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <Link 
            href="/instructor/schedule" 
            className="text-neutral-400 hover:text-charcoal text-sm font-light inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-light text-charcoal mt-6">Create Class</h1>
          <p className="text-neutral-500 font-light mt-1">
            Set up your class details and schedule
          </p>
        </div>

        {/* Create Form */}
        <div className="border border-neutral-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="label">Class Title</label>
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
                Description <span className="text-neutral-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Describe what students can expect from your class..."
              />
            </div>

            {/* Date and Time Section */}
            <div className="border border-neutral-100 p-4 bg-neutral-50 space-y-4">
              <h3 className="text-sm font-medium text-charcoal flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4" />
                Schedule
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="label">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="time" className="label">Start Time</label>
                  <select
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input-field"
                    required
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="label">Duration</label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="input-field"
                  required
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Recurrence Section */}
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className="w-4 h-4 border-neutral-300 rounded text-charcoal focus:ring-charcoal"
                  />
                  <label htmlFor="recurring" className="text-sm text-charcoal flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4" />
                    Repeat weekly
                  </label>
                </div>
                
                {recurring && (
                  <div className="ml-7">
                    <label htmlFor="recurrenceWeeks" className="label">For how many weeks?</label>
                    <select
                      id="recurrenceWeeks"
                      value={recurrenceWeeks}
                      onChange={(e) => setRecurrenceWeeks(parseInt(e.target.value))}
                      className="input-field"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 10, 12].map((weeks) => (
                        <option key={weeks} value={weeks}>{weeks} weeks</option>
                      ))}
                    </select>
                    <p className="text-neutral-400 text-xs mt-2 font-light">
                      This will create {recurrenceWeeks} classes, one each week on {date ? format(new Date(date), 'EEEE') : 'the selected day'}
                    </p>
                  </div>
                )}
              </div>
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
                  placeholder="0"
                />
                <p className="text-neutral-400 text-xs mt-2 font-light">Leave empty for free</p>
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

            <div className="flex gap-3 pt-4">
              <Link href="/instructor/schedule" className="btn-secondary flex-1 text-center py-4">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !date}
                className="btn-primary flex-1 py-4"
              >
                {submitting ? 'Creating...' : recurring ? `Create ${recurrenceWeeks} Classes` : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
