'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeftIcon, CheckIcon, EyeIcon } from '@heroicons/react/24/outline'

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !profile?.is_instructor) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <Link 
            href="/instructor" 
            className="text-neutral-400 hover:text-charcoal text-sm font-light flex items-center gap-2 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-light text-charcoal">Instructor Profile</h1>
          <p className="text-neutral-500 font-light mt-1">
            Update your profile. Your bio will be visible to students.
          </p>
        </div>

        <div className="border border-neutral-200 p-8">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-neutral-100">
            <div className="w-20 h-20 border border-neutral-200 flex items-center justify-center text-charcoal text-2xl font-light">
              {firstName?.[0] || user.email?.[0]?.toUpperCase() || 'I'}
            </div>
            <div>
              <h2 className="text-xl font-medium text-charcoal">
                {firstName} {lastName}
              </h2>
              <p className="text-neutral-400 text-sm font-light">{user.email}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-charcoal text-white text-xs">
                Instructor
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-neutral-50 border border-neutral-200 text-charcoal px-4 py-3 text-sm flex items-center gap-2">
                <CheckIcon className="w-4 h-4" />
                Profile updated successfully
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
                className="input-field bg-neutral-50 cursor-not-allowed"
                disabled
              />
              <p className="text-neutral-400 text-xs mt-2 font-light">Email cannot be changed</p>
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
              <label htmlFor="instagram" className="label">Instagram</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-light">@</span>
                <input
                  id="instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                  className="input-field pl-8"
                  placeholder="yourusername"
                />
              </div>
              <p className="text-neutral-400 text-xs mt-2 font-light">Shown on class listings</p>
            </div>

            <div>
              <label htmlFor="bio" className="label">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field min-h-[120px] resize-y"
                placeholder="Tell students about yourself, your teaching style, certifications..."
                maxLength={500}
              />
              <p className="text-neutral-400 text-xs mt-2 font-light">{bio.length}/500 characters</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-4"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        <div className="border border-neutral-100 p-6 mt-6 bg-neutral-50">
          <h3 className="font-medium text-charcoal mb-4 flex items-center gap-2">
            <EyeIcon className="w-4 h-4" />
            Student Preview
          </h3>
          <p className="text-neutral-500 text-sm font-light mb-4">How students will see your profile:</p>
          
          <div className="bg-white p-6 border border-neutral-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center text-charcoal font-light flex-shrink-0">
                {firstName?.[0] || 'I'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-charcoal">
                  {firstName || 'First'} {lastName || 'Last'}
                </p>
                {instagram && (
                  <span className="text-neutral-500 text-sm font-light">@{instagram.replace('@', '')}</span>
                )}
                {bio ? (
                  <p className="text-neutral-500 text-sm font-light mt-3">{bio}</p>
                ) : (
                  <p className="text-neutral-300 text-sm font-light mt-3 italic">No bio added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
