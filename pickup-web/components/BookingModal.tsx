'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  selectedTime: string
  onClaim: (eventName: string, description: string, skillLevel: string, imageUrl: string | null, latitude: number | null, longitude: number | null) => Promise<void>
}

export function BookingModal({ isOpen, onClose, selectedDate, selectedTime, onClaim }: BookingModalProps) {
  const [eventName, setEventName] = useState('')
  const [description, setDescription] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationAddress, setLocationAddress] = useState('2500 South Miami Avenue')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setCoverImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setCoverImage(null)
    setCoverImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadCoverImage = async (userId: string): Promise<string | null> => {
    if (!coverImage) return null

    setUploadingImage(true)
    try {
      const fileExt = coverImage.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('game-images')
        .upload(fileName, coverImage, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('game-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload cover image. Please try again.')
      return null
    } finally {
      setUploadingImage(false)
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

      // Upload cover image if present
      let imageUrl: string | null = null
      if (coverImage) {
        imageUrl = await uploadCoverImage(user.id)
        if (!imageUrl && coverImage) {
          // Image upload failed
          setLoading(false)
          return
        }
      }

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

      await onClaim(eventName, description, skillLevel, imageUrl, finalLat, finalLng)
      
      // Reset form
      setEventName('')
      setDescription('')
      setSkillLevel('')
      setCoverImage(null)
      setCoverImagePreview(null)
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
    if (!loading && !uploadingImage) {
      setEventName('')
      setDescription('')
      setSkillLevel('')
      setCoverImage(null)
      setCoverImagePreview(null)
      setLatitude(null)
      setLongitude(null)
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

            {/* Cover Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Photo (Optional)
              </label>
              
              {coverImagePreview ? (
                <div className="relative">
                  <img 
                    src={coverImagePreview} 
                    alt="Cover preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-neon-green transition-colors"
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Click to upload cover photo</p>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
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

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
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
                className="btn-outline flex-1 disabled:opacity-50"
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
