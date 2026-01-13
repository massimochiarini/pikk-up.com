'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InstructorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user is an instructor
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_instructor')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Profile might not exist yet, redirect anyway and let instructor page handle it
        window.location.href = '/instructor'
        return
      }

      if (!profile?.is_instructor) {
        setError('This account is not registered as an instructor. Please sign up as an instructor first.')
        await supabase.auth.signOut()
        return
      }

      window.location.href = '/instructor'
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-sage-700 inline-block">
            Pikk<span className="text-terracotta-500">Up</span>
          </Link>
          <div className="inline-block ml-2 px-3 py-1 bg-sage-100 text-sage-700 text-sm font-medium rounded-full">
            Instructor
          </div>
          <p className="text-sand-600 mt-3">Welcome back! Sign in to your instructor account.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sand-600 text-sm">
              New instructor?{' '}
              <Link href="/instructor/auth/signup" className="text-sage-600 hover:text-sage-700 font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/auth/login" 
            className="text-sand-500 hover:text-sage-600 text-sm transition-colors"
          >
            ← Back to student login
          </Link>
        </div>
      </div>
    </div>
  )
}
