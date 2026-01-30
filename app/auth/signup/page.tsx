'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-16">
          <Link href="/" className="text-gray tracking-wide text-lg inline-block">
            PickUp
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-normal text-gray tracking-tight mb-3">Create account</h1>
          <p className="text-stone-400 tracking-wide">Start booking yoga classes today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm tracking-wide">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm text-stone-500 mb-2 tracking-wide">
                First Name
              </label>
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
              <label htmlFor="lastName" className="block text-sm text-stone-500 mb-2 tracking-wide">
                Last Name
              </label>
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
            <label htmlFor="email" className="block text-sm text-stone-500 mb-2 tracking-wide">
              Email
            </label>
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
            <label htmlFor="phone" className="block text-sm text-stone-500 mb-2 tracking-wide">
              Phone <span className="text-stone-300">(optional)</span>
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
            <label htmlFor="password" className="block text-sm text-stone-500 mb-2 tracking-wide">
              Password
            </label>
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
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-stone-100 text-center">
          <p className="text-stone-400 text-sm tracking-wide">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gray hover:text-gray-dark transition-colors duration-300">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/instructor/auth/signup" 
            className="text-stone-400 hover:text-gray text-sm tracking-wide transition-colors duration-300"
          >
            Want to teach? Create an instructor account
          </Link>
        </div>
      </div>
    </div>
  )
}
