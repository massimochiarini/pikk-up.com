'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import PasswordInput from '@/components/PasswordInput'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      // The reset link will have hash parameters that Supabase uses
      // to automatically create a session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        // Check if there's a hash with tokens (Supabase handles this)
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          // Wait a moment for Supabase to process the tokens
          setTimeout(async () => {
            const { data: { session: newSession } } = await supabase.auth.getSession()
            if (newSession) {
              setSessionReady(true)
            } else {
              setSessionError(true)
            }
          }, 1000)
        } else {
          setSessionError(true)
        }
      } else {
        setSessionReady(true)
      }
    }

    checkSession()

    // Listen for auth state changes (when Supabase processes the reset token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
        setSessionError(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setSuccess(true)
    } catch (err: any) {
      console.error('Password update error:', err)
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Artwork */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/gallery/4.jpg"
          alt="Untitled 04"
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
              PikkUp
            </Link>
            <h1 className="text-3xl font-light text-charcoal mb-2">Set new password</h1>
            <p className="text-neutral-500 font-light">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 text-sm">
                <p className="font-medium mb-1">Password updated</p>
                <p className="font-light">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </div>

              <Link href="/auth/login" className="btn-primary w-full block text-center py-4">
                Sign In
              </Link>
            </div>
          ) : sessionError ? (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 text-sm">
                <p className="font-medium mb-1">Invalid or expired link</p>
                <p className="font-light">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>

              <Link href="/auth/forgot-password" className="btn-primary w-full block text-center py-4">
                Request New Link
              </Link>
            </div>
          ) : !sessionReady ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="label">New Password</label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                />
                <p className="text-neutral-400 text-xs mt-2 font-light">
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4"
              >
                {loading ? 'Updating...' : 'Update Password'}
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
