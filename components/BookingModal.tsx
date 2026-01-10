'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  selectedTime: string
  onClaim: (eventName: string, description: string, skillLevel: string, imageUrl: string | null, latitude: number | null, longitude: number | null, costCents: number) => Promise<void>
}

export function BookingModal({ isOpen, onClose, selectedDate, selectedTime, onClaim }: BookingModalProps) {
  const [eventName, setEventName] = useState('')
  const [description, setDescription] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [cost, setCost] = useState<string>('0')
  const [loading, setLoading] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationAddress, setLocationAddress] = useState('2500 South Miami Avenue')

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

  const getCoordinatesFromAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Use browser's Geocoding API if available
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      )
      const data = await response.json()
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get coordinates if not manually set
      let finalLat = latitude
      let finalLng = longitude
      if (!finalLat || !finalLng) {
        const coords = await getCoordinatesFromAddress(locationAddress)
        if (coords) {
          finalLat = coords.lat
          finalLng = coords.lng
        }
      }

      // Convert dollars to cents
      const costCents = Math.round(parseFloat(cost || '0') * 100)

      await onClaim(eventName, description, skillLevel, null, finalLat, finalLng, costCents)
      
      // Reset form
      setEventName('')
      setDescription('')
      setSkillLevel('')
      setCost('0')
      setLatitude(null)
      setLongitude(null)
    } catch (error) {
      console.error('Error claiming session:', error)
      // Let the error propagate to the parent
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEventName('')
      setDescription('')
      setSkillLevel('')
      setCost('0')
      setLatitude(null)
      setLongitude(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto modal-inputs">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Claim Time Slot</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-700 text-2xl disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Time Display */}
            <div className="bg-gradient-to-br from-black to-gray-800 rounded-lg p-4 text-white">
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
              <label className="block text-sm font-semibold text-black mb-2">
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
              <label className="block text-sm font-semibold text-black mb-2">
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

            {/* Cost */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Class Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="input-field pl-7"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter 0 for free classes
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
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

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Location
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="input-field"
                placeholder="Enter address to adjust pin location"
              />
              <p className="text-xs text-gray-500 mt-1">
                Update the address to adjust the pin location on the map
              </p>
              
              {/* Coordinate display */}
              {(latitude && longitude) && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  📍 Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-black hover:bg-gray-50 font-semibold py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {uploadingImage ? 'Uploading...' : loading ? 'Claiming...' : 'Claim Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
