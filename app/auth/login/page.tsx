'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      window.location.href = '/classes'
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-16">
          <Link href="/" className="text-gray tracking-wide text-lg inline-block">
            PickUp
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-normal text-gray tracking-tight mb-3">Welcome back</h1>
          <p className="text-stone-400 tracking-wide">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm tracking-wide">
              {error}
            </div>
          )}

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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm text-stone-500 tracking-wide">
                Password
              </label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-stone-400 hover:text-gray transition-colors duration-300 tracking-wide"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-stone-100 text-center">
          <p className="text-stone-400 text-sm tracking-wide">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-gray hover:text-gray-dark transition-colors duration-300">
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/instructor/auth/login" 
            className="text-stone-400 hover:text-gray text-sm tracking-wide transition-colors duration-300"
          >
            Are you an instructor? Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
