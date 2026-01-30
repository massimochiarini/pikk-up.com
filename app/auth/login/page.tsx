'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
      setError(err.message || 'failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
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
          <h1 className="text-3xl font-normal text-stone-800 tracking-tight mb-3">welcome back</h1>
          <p className="text-stone-500 tracking-wide">sign in to continue</p>
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm text-stone-500 tracking-wide">
                password
              </label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors duration-300 tracking-wide"
              >
                forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'signing in...' : 'sign in'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-stone-100 text-center">
          <p className="text-stone-400 text-sm tracking-wide">
            don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-stone-600 hover:text-stone-800 transition-colors duration-300">
              create one
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/instructor/auth/login" 
            className="text-stone-400 hover:text-stone-600 text-sm tracking-wide transition-colors duration-300"
          >
            are you an instructor? sign in here
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
