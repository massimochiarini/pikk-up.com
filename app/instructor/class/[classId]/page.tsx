'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type YogaClass, type TimeSlot, type Booking } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon, LinkIcon, UsersIcon, ExclamationTriangleIcon, TrashIcon, PencilSquareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  bookings: Booking[]
}

export default function InstructorClassDetailPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const classId = params.classId as string
  const shouldAutoEdit = searchParams.get('edit') === 'true'

  const [yogaClass, setYogaClass] = useState<ClassWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editMaxCapacity, setEditMaxCapacity] = useState('')
  const [editSkillLevel, setEditSkillLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)

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

  const formatPrice = (cents: number, isDonation?: boolean) => {
    if (isDonation) return 'Donation'
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

  const startEditing = () => {
    if (!yogaClass) return
    setEditTitle(yogaClass.title)
    setEditDescription(yogaClass.description || '')
    setEditPrice(yogaClass.price_cents ? (yogaClass.price_cents / 100).toString() : '')
    setEditMaxCapacity(yogaClass.max_capacity.toString())
    setEditSkillLevel(yogaClass.skill_level || 'all')
    setEditError('')
    setEditSuccess(false)
    setIsEditing(true)
  }

  // Auto-open edit modal if ?edit=true is in the URL
  useEffect(() => {
    if (shouldAutoEdit && yogaClass && !isEditing) {
      startEditing()
      // Remove the edit param from URL to prevent re-opening on refresh
      router.replace(`/instructor/class/${classId}`, { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoEdit, yogaClass])

  const cancelEditing = () => {
    setIsEditing(false)
    setEditError('')
    setEditSuccess(false)
  }

  const handleSaveChanges = async () => {
    if (!yogaClass || !user) return
    
    setSaving(true)
    setEditError('')
    setEditSuccess(false)

    try {
      const priceCents = Math.round(parseFloat(editPrice || '0') * 100)
      
      const response = await fetch('/api/update-class', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: yogaClass.id,
          instructorId: user.id,
          title: editTitle,
          description: editDescription,
          priceCents,
          maxCapacity: parseInt(editMaxCapacity),
          skillLevel: editSkillLevel,
          isDonation: priceCents === 0,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update class')
      }

      // Update local state with the new values
      setYogaClass({
        ...yogaClass,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        price_cents: priceCents,
        max_capacity: parseInt(editMaxCapacity),
        skill_level: editSkillLevel as YogaClass['skill_level'],
        is_donation: priceCents === 0,
      })

      setEditSuccess(true)
      setTimeout(() => {
        setIsEditing(false)
        setEditSuccess(false)
      }, 1500)
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Show loading while auth is loading, data is loading, OR when we have a user but profile hasn't loaded
  if (authLoading || loading || (user && !profile)) {
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
          <p className="text-neutral-500 font-light mb-4">Please sign in to view class details.</p>
          <a href="/instructor/auth/login" className="btn-primary">Sign In</a>
        </div>
      </div>
    )
  }

  if (!yogaClass) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-neutral-500 font-light mb-4">Class not found or you don&apos;t have access.</p>
            <a href="/instructor/my-classes" className="btn-primary">Back to My Classes</a>
          </div>
        </div>
      </div>
    )
  }

  const confirmedBookings = getConfirmedBookings(yogaClass.bookings)
  const spotsLeft = yogaClass.max_capacity - confirmedBookings.length

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link 
          href="/instructor/my-classes" 
          className="text-neutral-400 hover:text-charcoal text-sm font-light inline-flex items-center gap-2 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to My Classes
        </Link>

        {/* Header */}
        <div className="border border-neutral-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-light">{confirmedBookings.length}</span>
              </div>
              <div>
                <h1 className="text-2xl font-light text-charcoal">{yogaClass.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500 font-light">
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    {format(parseISO(yogaClass.time_slot.date), 'EEE, MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {formatTime(yogaClass.time_slot.start_time)}
                  </span>
                  <span>{formatPrice(yogaClass.price_cents, yogaClass.is_donation)}</span>
                </div>
                {yogaClass.skill_level && yogaClass.skill_level !== 'all' && (
                  <span className="inline-block mt-3 text-xs uppercase tracking-wider text-neutral-400">
                    {yogaClass.skill_level}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={startEditing}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit Class
              </button>
              <button
                onClick={copyBookingLink}
                className="px-4 py-3 border border-neutral-200 text-charcoal hover:bg-neutral-50 font-light text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <LinkIcon className="w-4 h-4" />
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-3 border border-red-200 text-red-600 hover:bg-red-50 font-light text-sm transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Booking Link */}
          <div className="mt-8 pt-8 border-t border-neutral-100">
            <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3">Share this link with students</div>
            <input
              type="text"
              value={getBookingUrl()}
              readOnly
              className="input-field text-sm bg-neutral-50"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-neutral-200 p-6 text-center">
            <div className="text-3xl font-light text-charcoal">{confirmedBookings.length}</div>
            <div className="text-xs uppercase tracking-wider text-neutral-400 mt-1">Registered</div>
          </div>
          <div className="border border-neutral-200 p-6 text-center">
            <div className="text-3xl font-light text-charcoal">{yogaClass.max_capacity}</div>
            <div className="text-xs uppercase tracking-wider text-neutral-400 mt-1">Capacity</div>
          </div>
          <div className="border border-neutral-200 p-6 text-center">
            <div className={`text-3xl font-light ${spotsLeft <= 3 ? 'text-amber-600' : 'text-charcoal'}`}>
              {spotsLeft}
            </div>
            <div className="text-xs uppercase tracking-wider text-neutral-400 mt-1">Spots Left</div>
          </div>
        </div>

        {/* Description */}
        {yogaClass.description && (
          <div className="border border-neutral-200 p-6 mb-6">
            <h2 className="text-xs uppercase tracking-wider text-neutral-400 mb-3">Description</h2>
            <p className="text-neutral-600 font-light whitespace-pre-wrap">{yogaClass.description}</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-neutral-200 max-w-md w-full p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 border border-red-200 flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-light text-charcoal mb-2">Delete Class?</h2>
                <p className="text-neutral-500 font-light">
                  Are you sure you want to delete &quot;{yogaClass.title}&quot;? 
                  {confirmedBookings.length > 0 && (
                    <span className="block mt-2 text-red-600">
                      Warning: {confirmedBookings.length} student{confirmedBookings.length !== 1 ? 's have' : ' has'} already registered.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 btn-secondary py-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClass}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white px-6 py-4 font-light hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Class'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Class Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-neutral-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-neutral-100 p-6 flex items-center justify-between">
                <h2 className="text-xl font-light text-charcoal">Edit Class</h2>
                <button
                  onClick={cancelEditing}
                  className="p-2 hover:bg-neutral-100 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {editError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {editError}
                  </div>
                )}

                {editSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" />
                    Changes saved successfully!
                  </div>
                )}

                <div>
                  <label htmlFor="editTitle" className="label">Class Title</label>
                  <input
                    id="editTitle"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Sunrise Vinyasa Flow"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="editDescription" className="label">
                    Description <span className="text-neutral-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="input-field resize-none"
                    rows={4}
                    placeholder="Describe what students can expect from your class..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editPrice" className="label">Price ($)</label>
                    <input
                      id="editPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                    <p className="text-neutral-400 text-xs mt-2 font-light">Leave empty for free/donation</p>
                  </div>
                  <div>
                    <label htmlFor="editCapacity" className="label">Max Capacity</label>
                    <input
                      id="editCapacity"
                      type="number"
                      min="1"
                      max="50"
                      value={editMaxCapacity}
                      onChange={(e) => setEditMaxCapacity(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="editSkillLevel" className="label">Skill Level</label>
                  <select
                    id="editSkillLevel"
                    value={editSkillLevel}
                    onChange={(e) => setEditSkillLevel(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-100">
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="flex-1 btn-secondary py-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving || !editTitle.trim()}
                    className="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registered Students */}
        <div className="border border-neutral-200 p-6">
          <h2 className="text-lg font-medium text-charcoal mb-6">
            Registered Students ({confirmedBookings.length})
          </h2>
          
          {confirmedBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500 font-light">No students registered yet.</p>
              <p className="text-neutral-400 text-sm font-light mt-1">Share your booking link to get signups.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {confirmedBookings.map((booking, index) => (
                <div 
                  key={booking.id}
                  className="flex items-center justify-between py-4 px-4 bg-neutral-50 border border-neutral-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 border border-neutral-200 flex items-center justify-center text-neutral-500 text-sm font-light bg-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-charcoal">
                        {booking.guest_first_name} {booking.guest_last_name}
                      </div>
                      {booking.guest_phone && (
                        <div className="text-sm text-neutral-400 font-light">
                          {booking.guest_phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 font-light">
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
