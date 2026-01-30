'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Artwork */}
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

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="text-2xl font-light tracking-tight text-charcoal inline-block mb-8">
              PickUp
            </Link>
            <h1 className="text-3xl font-light text-charcoal mb-2">Reset your password</h1>
            <p className="text-neutral-500 font-light">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 text-sm">
                <p className="font-medium mb-1">Check your email</p>
                <p className="font-light">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and follow the link to reset your password.
                </p>
              </div>
              
              <p className="text-neutral-500 text-sm font-light">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button 
                  onClick={() => setSuccess(false)} 
                  className="text-charcoal hover:underline"
                >
                  try again
                </button>.
              </p>

              <Link href="/auth/login" className="btn-secondary w-full block text-center py-4">
                Back to Sign In
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <p className="text-neutral-500 text-sm font-light text-center">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-charcoal hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
