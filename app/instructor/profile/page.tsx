'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function InstructorProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/instructor/auth/login'
    }
    if (!authLoading && profile && !profile.is_instructor) {
      window.location.href = '/profile'
    }
  }, [user, profile, authLoading])

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
      setInstagram(profile.instagram || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.replace(/\D/g, '') || null,
          instagram: instagram.trim().replace('@', '') || null,
          bio: bio.trim() || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Profile update error:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !profile?.is_instructor) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href="/instructor" 
            className="text-sage-600 hover:text-sage-700 text-sm font-medium flex items-center gap-1 mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-charcoal">Instructor Profile</h1>
          <p className="text-sand-600 mt-1">
            Update your profile information. Your bio will be visible to students.
          </p>
        </div>

        <div className="card">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-sand-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white text-3xl font-semibold">
              {firstName?.[0] || user.email?.[0]?.toUpperCase() || 'I'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-charcoal">
                {firstName} {lastName}
              </h2>
              <p className="text-sand-500 text-sm">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-sage-100 text-sage-700 text-xs font-medium rounded-full">
                Instructor
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                ✓ Profile updated successfully!
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="label">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={user.email || ''}
                className="input-field bg-sand-50 cursor-not-allowed"
                disabled
              />
              <p className="text-sand-500 text-xs mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="instagram" className="label">Instagram Handle</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400">@</span>
                <input
                  id="instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                  className="input-field pl-8"
                  placeholder="yourusername"
                />
              </div>
              <p className="text-sand-500 text-xs mt-1">Shown on class listings so students can follow you</p>
            </div>

            <div>
              <label htmlFor="bio" className="label">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field min-h-[120px] resize-y"
                placeholder="Tell students about yourself, your teaching style, certifications, and what they can expect from your classes..."
                maxLength={500}
              />
              <p className="text-sand-500 text-xs mt-1">{bio.length}/500 characters • Visible to students on class pages</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        <div className="card mt-6 bg-sage-50/50">
          <h3 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
            👀 Student Preview
          </h3>
          <p className="text-sand-600 text-sm mb-4">This is how students will see your profile on class pages:</p>
          
          <div className="bg-white rounded-xl p-4 border border-sand-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {firstName?.[0] || 'I'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-charcoal">
                  {firstName || 'First'} {lastName || 'Last'}
                </p>
                {instagram && (
                  <span className="text-sage-600 text-sm">@{instagram.replace('@', '')}</span>
                )}
                {bio ? (
                  <p className="text-sand-600 text-sm mt-2">{bio}</p>
                ) : (
                  <p className="text-sand-400 text-sm mt-2 italic">No bio added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
