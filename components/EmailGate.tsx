'use client'

import { useState } from 'react'
import Link from 'next/link'

export type RolePreference = 'student' | 'instructor' | null

export interface EmailGateProps {
  /** Short explanation (1–2 sentences) */
  intro?: string
  /** CTA above submit button */
  ctaText?: string
  /** After success, message before redirect */
  successMessage?: string
  /** Redirect path after success (default /classes?free=1) */
  redirectTo?: string
  /** Show role choice buttons */
  showRoleChoice?: boolean
  /** Optional class name for the wrapper */
  className?: string
  /** Optional link to skip email capture (e.g. "View classes without signing in") */
  skipLinkText?: string
  /** Href for skip link (default /classes) */
  skipLinkHref?: string
}

const DEFAULT_INTRO = 'PickUp is drop-in yoga at a studio in Miami. Book a class, show up, and flow.'
const DEFAULT_CTA = 'Enter your email to claim your first class free'
const DEFAULT_SUCCESS = 'Free class unlocked—book now'

export function EmailGate({
  intro = DEFAULT_INTRO,
  ctaText = DEFAULT_CTA,
  successMessage = DEFAULT_SUCCESS,
  redirectTo = '/classes?free=1',
  showRoleChoice = true,
  className = '',
  skipLinkText,
  skipLinkHref = '/classes',
}: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [rolePreference, setRolePreference] = useState<RolePreference>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUnsubscribed(false)

    try {
      const res = await fetch('/api/welcome/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          role_preference: rolePreference === 'instructor' ? 'teacher' : rolePreference === 'student' ? 'student' : undefined,
          resubscribe: unsubscribed,
        }),
      })
      const data = await res.json()

      if (data.code === 'UNSUBSCRIBED') {
        setUnsubscribed(true)
        setError(data.message || 'You previously unsubscribed—resubscribe to get offers')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = data.redirect || redirectTo
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-stone-700 text-lg font-light mb-2">{successMessage}</p>
        <p className="text-stone-500 text-sm">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="text-stone-600 text-base font-light leading-relaxed mb-6 max-w-md">
        {intro}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
            {error}
            {unsubscribed && (
              <button
                type="button"
                onClick={async () => {
                  setError('')
                  setLoading(true)
                  try {
                    const res = await fetch('/api/welcome/claim', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        email: email.trim(),
                        role_preference: rolePreference === 'instructor' ? 'teacher' : rolePreference === 'student' ? 'student' : undefined,
                        resubscribe: true,
                      }),
                    })
                    const data = await res.json()
                    if (!res.ok) {
                      setError(data.error || 'Something went wrong')
                      setLoading(false)
                      return
                    }
                    setUnsubscribed(false)
                    setSuccess(true)
                    setTimeout(() => { window.location.href = data.redirect || redirectTo }, 1500)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Something went wrong')
                  } finally {
                    setLoading(false)
                  }
                }}
                className="mt-2 block text-amber-900 underline font-medium"
              >
                Resubscribe and claim offer
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email-gate-email" className="sr-only">
            Email
          </label>
          <input
            id="email-gate-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full max-w-sm px-4 py-3 border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400"
            disabled={loading}
          />
        </div>

        {showRoleChoice && (
          <div className="flex flex-wrap gap-2">
            <span className="text-stone-500 text-sm font-light w-full">I&apos;m a</span>
            <button
              type="button"
              onClick={() => setRolePreference(rolePreference === 'student' ? null : 'student')}
              className={`px-4 py-2 rounded-lg text-sm font-light border transition-colors ${
                rolePreference === 'student'
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRolePreference(rolePreference === 'instructor' ? null : 'instructor')}
              className={`px-4 py-2 rounded-lg text-sm font-light border transition-colors ${
                rolePreference === 'instructor'
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
              }`}
            >
              Instructor
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Claiming...' : ctaText}
        </button>

        {skipLinkText && (
          <div className="pt-2">
            <Link
              href={skipLinkHref}
              className="text-stone-500 text-sm font-light hover:text-stone-700 underline underline-offset-2 transition-colors"
            >
              {skipLinkText}
            </Link>
          </div>
        )}
      </form>

      <p className="mt-4 text-stone-400 text-xs font-light max-w-sm">
        By continuing you agree to receive updates from PickUp. You can unsubscribe anytime.
      </p>
    </div>
  )
}
