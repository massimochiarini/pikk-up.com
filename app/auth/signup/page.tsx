'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
          console.error('Profile creation failed:', result.error, result.hint)
          // Supabase trigger already creates a profile on signup, so the user can still use the app.
          // Redirect anyway and show a brief notice so they're not stuck.
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('signup_profile_pending', 'true')
          }
          window.location.href = '/classes'
          return
        }
      }

      window.location.href = '/classes'
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-16">
          <Link href="/" className="text-stone-500 tracking-wide text-lg inline-block hover:text-stone-700 transition-colors duration-300">
            PickUp
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-normal text-stone-800 tracking-tight mb-3">create account</h1>
          <p className="text-stone-500 tracking-wide">start booking yoga classes today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm tracking-wide"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">
                first name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                placeholder="jane"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label">
                last name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                placeholder="doe"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label">
              email
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
            <label htmlFor="phone" className="label">
              phone <span className="text-stone-300">(optional)</span>
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
            <label htmlFor="password" className="label">
              password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'creating account...' : 'create account'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-stone-100 text-center">
          <p className="text-stone-400 text-sm tracking-wide">
            already have an account?{' '}
            <Link href="/auth/login" className="text-stone-600 hover:text-stone-800 transition-colors duration-300">
              sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/instructor/auth/signup" 
            className="text-stone-400 hover:text-stone-600 text-sm tracking-wide transition-colors duration-300"
          >
            want to teach? create an instructor account
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
