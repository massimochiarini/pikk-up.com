'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const COOKIE_NAME = 'pikkup_bio_captured'
const TOKEN_COOKIE_NAME = 'pikkup_first_class_free_token'
const COOKIE_DAYS = 365

function setCookie(name: string, value: string, days: number) {
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax`
}

export default function BioGatePage() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingCookie, setCheckingCookie] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'))
    if (match && match[2]) {
      window.location.replace('/classes')
      return
    }
    setCheckingCookie(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, first_name: firstName || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setCookie(COOKIE_NAME, '1', COOKIE_DAYS)
      if (data.token) {
        setCookie(TOKEN_COOKIE_NAME, data.token, 1) // token valid ~24h
      }
      window.location.replace(data.redirect || '/classes')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (checkingCookie) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <p className="text-stone-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="text-center mb-12">
          <Link href="/" className="text-stone-500 tracking-wide text-lg inline-block hover:text-stone-700 transition-colors">
            PikkUp
          </Link>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-normal text-stone-800 tracking-tight mb-3">Pick Up Yoga</h1>
          <p className="text-stone-500 tracking-wide">Enter your email to see classes and claim your first class free.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-600 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-stone-600 mb-1.5">
              First name <span className="text-stone-400">(optional)</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
              placeholder="Your name"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-60 transition"
          >
            {loading ? 'Sending...' : 'See classes'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-stone-400">
          By continuing you agree to receive updates from PikkUp. You can unsubscribe anytime.
        </p>
      </motion.div>
    </div>
  )
}
