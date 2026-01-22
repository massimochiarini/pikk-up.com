'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function InstructorSignupPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Pre-fill form if user is already logged in
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
      setBio(profile.bio || '')
      setInstagram(profile.instagram || '')
    }
  }, [profile])

  // Handle form submission for NEW users (not logged in)
  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign up the user - they'll get is_instructor=false, instructor_status='pending'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            is_instructor: true, // This triggers 'pending' status in the trigger
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile with pending status
        const response = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authData.user.id,
            email,
            firstName,
            lastName,
            isInstructor: false, // Not approved yet
            instructorStatus: 'pending',
            phone: phone.replace(/\D/g, '') || null,
            instagram: instagram || null,
            bio: bio || null,
          }),
        })

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create profile')
        }
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission for EXISTING users (already logged in)
  const handleExistingUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      const response = await fetch('/api/instructor/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          bio: bio || null,
          instagram: instagram || null,
          phone: phone.replace(/\D/g, '') || null,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request')
      }

      await refreshProfile()
      setSubmitted(true)
    } catch (err: any) {
      console.error('Request error:', err)
      setError(err.message || 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  // Already an instructor
  if (profile?.is_instructor) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 border border-green-200 bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-4">You Are Already an Instructor</h1>
            <p className="text-neutral-500 font-light mb-8">
              Your instructor account is active. You can start creating classes.
            </p>
            <Link href="/instructor" className="btn-primary inline-block px-8 py-3">
              Go to Dashboard
            </Link>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/gallery/3.jpg"
            alt="Untitled 03"
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </div>
      </div>
    )
  }

  // Request already pending
  if (profile?.instructor_status === 'pending') {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 border border-yellow-200 bg-yellow-50 flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-4">Request Pending</h1>
            <p className="text-neutral-500 font-light mb-8">
              Your instructor request is being reviewed. We will notify you once it is approved.
            </p>
            <Link href="/classes" className="btn-secondary inline-block px-8 py-3">
              Browse Classes
            </Link>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/gallery/3.jpg"
            alt="Untitled 03"
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </div>
      </div>
    )
  }

  // Request was rejected
  if (profile?.instructor_status === 'rejected') {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-neutral-400">×</span>
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-4">Request Not Approved</h1>
            <p className="text-neutral-500 font-light mb-8">
              Unfortunately, your instructor request was not approved at this time. 
              Please contact us if you have questions.
            </p>
            <Link href="/classes" className="btn-secondary inline-block px-8 py-3">
              Browse Classes
            </Link>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/gallery/3.jpg"
            alt="Untitled 03"
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </div>
      </div>
    )
  }

  // Success state after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 border border-green-200 bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-4">Request Submitted</h1>
            <p className="text-neutral-500 font-light mb-4">
              Thank you for your interest in teaching at PikkUp!
            </p>
            <p className="text-neutral-500 font-light mb-8">
              We will review your application and get back to you soon. In the meantime, 
              you can browse and book classes as a student.
            </p>
            <Link href="/classes" className="btn-primary inline-block px-8 py-3">
              Browse Classes
            </Link>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/gallery/3.jpg"
            alt="Untitled 03"
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </div>
      </div>
    )
  }

  // Show request form for logged-in users
  if (user && profile) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <Link href="/" className="text-2xl font-light tracking-tight text-charcoal inline-block mb-2">
                PikkUp
              </Link>
              <span className="ml-3 text-xs uppercase tracking-wider text-neutral-400 border border-neutral-200 px-2 py-1">
                Instructor
              </span>
              <h1 className="text-3xl font-light text-charcoal mt-8 mb-2">Request to Teach</h1>
              <p className="text-neutral-500 font-light">
                Hi {profile.first_name}! Submit your request to become an instructor.
              </p>
            </div>

            <form onSubmit={handleExistingUserSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="bg-neutral-50 border border-neutral-200 p-4">
                <div className="text-sm text-neutral-500 font-light">Logged in as</div>
                <div className="font-medium text-charcoal">{profile.email}</div>
              </div>

              <div>
                <label htmlFor="phone" className="label">Phone</label>
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
                <label htmlFor="instagram" className="label">
                  Instagram <span className="text-neutral-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="input-field"
                  placeholder="@yourusername"
                />
              </div>

              <div>
                <label htmlFor="bio" className="label">
                  Tell us about yourself
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Share your yoga experience, certifications, and teaching style..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-neutral-100 text-center">
              <Link 
                href="/classes" 
                className="text-neutral-400 hover:text-charcoal text-sm font-light transition-colors"
              >
                Browse classes instead
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/gallery/3.jpg"
            alt="Untitled 03"
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
          <div className="absolute bottom-8 right-8">
            <span className="text-sm text-white/80 tracking-wide">Untitled 03</span>
          </div>
        </div>
      </div>
    )
  }

  // Show signup form for new users
  return (
    <div className="min-h-screen bg-white flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="text-2xl font-light tracking-tight text-charcoal inline-block mb-2">
              PikkUp
            </Link>
            <span className="ml-3 text-xs uppercase tracking-wider text-neutral-400 border border-neutral-200 px-2 py-1">
              Instructor
            </span>
            <h1 className="text-3xl font-light text-charcoal mt-8 mb-2">Apply to Teach</h1>
            <p className="text-neutral-500 font-light">
              Create an account and submit your instructor application.
            </p>
          </div>

          <form onSubmit={handleNewUserSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone</label>
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
              <label htmlFor="instagram" className="label">
                Instagram <span className="text-neutral-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="input-field"
                placeholder="@yourusername"
              />
            </div>

            <div>
              <label htmlFor="bio" className="label">
                Tell us about yourself
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Share your yoga experience, certifications, and teaching style..."
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            <div className="bg-neutral-50 border border-neutral-200 p-4 text-sm text-neutral-500 font-light">
              Your application will be reviewed by our team. Once approved, you will be able to create and manage classes.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <p className="text-neutral-500 text-sm font-light text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-charcoal hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/signup" 
              className="text-neutral-400 hover:text-charcoal text-sm font-light transition-colors"
            >
              Looking to book classes instead?
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/gallery/3.jpg"
          alt="Untitled 03"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute bottom-8 right-8">
          <span className="text-sm text-white/80 tracking-wide">Untitled 03</span>
        </div>
      </div>
    </div>
  )
}
