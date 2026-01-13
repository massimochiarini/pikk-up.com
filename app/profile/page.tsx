'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/login'
    }
  }, [user, authLoading])

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href="/classes" 
            className="text-sage-600 hover:text-sage-700 text-sm font-medium flex items-center gap-1 mb-4"
          >
            ← Back to Classes
          </Link>
          <h1 className="text-3xl font-bold text-charcoal">My Profile</h1>
          <p className="text-sand-600 mt-1">
            Update your personal information.
          </p>
        </div>

        <div className="card">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-sand-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white text-2xl font-semibold">
              {firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-charcoal">
                {firstName} {lastName}
              </h2>
              <p className="text-sand-500 text-sm">{user.email}</p>
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
              <p className="text-sand-500 text-xs mt-1">Used for class confirmations and reminders</p>
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

        {/* Account Info */}
        <div className="card mt-6 bg-sand-50/50">
          <h3 className="font-semibold text-charcoal mb-3">Account Type</h3>
          <p className="text-sand-600 text-sm">
            {profile?.is_instructor ? (
              <>
                <span className="inline-block px-2 py-1 bg-sage-100 text-sage-700 rounded-full text-xs font-medium mr-2">
                  Instructor
                </span>
                You can create and manage yoga classes.
              </>
            ) : (
              <>
                <span className="inline-block px-2 py-1 bg-sand-200 text-sand-700 rounded-full text-xs font-medium mr-2">
                  Student
                </span>
                You can browse and book yoga classes.
              </>
            )}
          </p>
          
          {!profile?.is_instructor && (
            <Link 
              href="/instructor/auth/signup" 
              className="text-sage-600 hover:text-sage-700 text-sm font-medium mt-3 inline-block"
            >
              Want to teach? Become an instructor →
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
