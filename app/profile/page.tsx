'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <Link 
            href="/classes" 
            className="text-neutral-400 hover:text-charcoal text-sm font-light flex items-center gap-2 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Classes
          </Link>
          <h1 className="text-3xl font-light text-charcoal">Profile</h1>
          <p className="text-neutral-500 font-light mt-1">
            Update your personal information
          </p>
        </div>

        <div className="border border-neutral-200 p-8">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-neutral-100">
            <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center text-charcoal text-xl font-light">
              {firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-medium text-charcoal">
                {firstName} {lastName}
              </h2>
              <p className="text-neutral-400 text-sm font-light">{user.email}</p>
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
              <p className="text-neutral-400 text-xs mt-2 font-light">Used for class confirmations</p>
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

        {/* Account Info */}
        <div className="border border-neutral-100 p-6 mt-6 bg-neutral-50">
          <h3 className="font-medium text-charcoal mb-2">Account Type</h3>
          <p className="text-neutral-500 text-sm font-light">
            {profile?.is_instructor ? (
              <>
                <span className="inline-block px-2 py-1 bg-charcoal text-white text-xs mr-2">
                  Instructor
                </span>
                You can create and manage yoga classes.
              </>
            ) : (
              <>
                <span className="inline-block px-2 py-1 border border-neutral-200 text-neutral-600 text-xs mr-2">
                  Student
                </span>
                You can browse and book yoga classes.
              </>
            )}
          </p>
          
          {!profile?.is_instructor && (
            <Link 
              href="/instructor/auth/signup" 
              className="text-charcoal hover:underline text-sm mt-4 inline-block"
            >
              Want to teach? Become an instructor
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
