'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const email = searchParams.get('email')
  const error = searchParams.get('error')
  
  const [manualEmail, setManualEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (success === 'true' && email) {
      setResult({ success: true, message: `You've been unsubscribed. We're sorry to see you go!` })
    } else if (error === 'missing_email') {
      setResult({ success: false, message: 'No email address provided.' })
    }
  }, [success, email, error])

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualEmail) return

    setLoading(true)
    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualEmail })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: `You've been unsubscribed. We're sorry to see you go!` })
      } else {
        setResult({ success: false, message: data.error || 'Failed to unsubscribe' })
      }
    } catch {
      setResult({ success: false, message: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-neutral-900 mb-2">PikkUp</h1>
          <p className="text-neutral-500 text-sm uppercase tracking-widest">Newsletter</p>
        </div>

        {result ? (
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.success ? (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <p className="text-lg text-neutral-700 mb-6">{result.message}</p>
            {result.success && (
              <p className="text-sm text-neutral-500 mb-8">
                Changed your mind? You can always sign up again by creating an account or booking a class.
              </p>
            )}
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Back to Pick Up Yoga
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-medium text-neutral-900 mb-4 text-center">
              Unsubscribe from Newsletter
            </h2>
            <p className="text-neutral-600 text-center mb-6">
              Enter your email address to unsubscribe from our weekly newsletter.
            </p>
            <form onSubmit={handleUnsubscribe}>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={loading || !manualEmail}
                className="w-full px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
