'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
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

      // Use window.location for cleaner navigation after login
      window.location.href = '/classes'
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Artwork */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/gallery/1.jpg"
          alt="Untitled 01"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute bottom-8 left-8">
          <span className="text-sm text-white/80 tracking-wide">Untitled 01</span>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="text-2xl font-light tracking-tight text-charcoal inline-block mb-8">
              PikkUp
            </Link>
            <h1 className="text-3xl font-light text-charcoal mb-2">Welcome back</h1>
            <p className="text-neutral-500 font-light">Sign in to continue to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

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
              <label htmlFor="password" className="label">Password</label>
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
              className="btn-primary w-full py-4"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <p className="text-neutral-500 text-sm font-light text-center">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-charcoal hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/instructor/auth/login" 
              className="text-neutral-400 hover:text-charcoal text-sm font-light transition-colors"
            >
              Are you an instructor? Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
