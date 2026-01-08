'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  selectedTime: string
  onClaim: (eventName: string, description: string, skillLevel: string) => Promise<void>
}

export function BookingModal({ isOpen, onClose, selectedDate, selectedTime, onClaim }: BookingModalProps) {
  const [eventName, setEventName] = useState('')
  const [description, setDescription] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'EEEE, MMMM d, yyyy')
    } catch {
      return date
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onClaim(eventName, description, skillLevel)
      // Reset form
      setEventName('')
      setDescription('')
      setSkillLevel('')
    } catch (error) {
      console.error('Error claiming session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEventName('')
      setDescription('')
      setSkillLevel('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-navy">Claim Time Slot</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Time Display */}
            <div className="bg-gradient-to-br from-neon-green to-sky-blue rounded-lg p-4 text-navy">
              <div className="font-semibold text-lg mb-1">
                {formatDate(selectedDate)}
              </div>
              <div className="text-xl font-bold">
                {formatTime(selectedTime)}
              </div>
              <div className="text-sm mt-1 opacity-90">
                Duration: 1.5 hours
              </div>
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="input-field"
                placeholder="e.g., Morning Vinyasa Flow"
                required
              />
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="input-field"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Add details about your class..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn-outline flex-1 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? 'Claiming...' : 'Claim Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
