'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import PasswordInput from '@/components/PasswordInput'

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign up the user
      const phoneNormalized = phone.replace(/\D/g, '')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phoneNormalized || null,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile via API route (uses service role to bypass RLS)
        const response = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authData.user.id,
            email,
            firstName,
            lastName,
            isInstructor: false,
            phone: phone.replace(/\D/g, '') || null,
          }),
        })

        const result = await response.json()
        
        if (!response.ok) {
          console.error('Profile creation failed:', result.error)
          // Don't throw - user is created, they can try logging in
        }
      }

      window.location.href = '/classes'
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="text-2xl font-light tracking-tight text-charcoal inline-block mb-8">
              PickUp
            </Link>
            <h1 className="text-3xl font-light text-charcoal mb-2">Create account</h1>
            <p className="text-neutral-500 font-light">Start booking yoga classes today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label htmlFor="phone" className="label">
                Phone <span className="text-neutral-400 font-normal lowercase">(optional)</span>
              </label>
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
              <label htmlFor="password" className="label">Password</label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4"
            >
              {loading ? 'Creating account...' : 'Create Account'}
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
              href="/instructor/auth/signup" 
              className="text-neutral-400 hover:text-charcoal text-sm font-light transition-colors"
            >
              Want to teach? Create an instructor account
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Artwork */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/gallery/2.jpg"
          alt="Untitled 02"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
      </div>
    </div>
  )
}
