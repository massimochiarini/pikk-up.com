'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import PasswordInput from '@/components/PasswordInput'

export default function InstructorLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('=== INSTRUCTOR LOGIN START ===')
      console.log('1. Attempting login for:', email)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('2. Sign in FAILED:', signInError.message)
        throw signInError
      }

      console.log('2. Sign in SUCCESS, user:', data.user?.email)
      console.log('3. Session exists:', !!data.session)

      if (!data.user) {
        throw new Error('No user data returned')
      }

      // Verify session is stored
      const storedSession = localStorage.getItem('supabase-auth')
      console.log('4. Session in localStorage:', storedSession ? 'YES' : 'NO')

      // Check if user is an instructor
      console.log('5. Fetching profile for user ID:', data.user.id)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_instructor')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('6. Profile fetch FAILED:', profileError.message)
        console.error('   Full error:', profileError)
        await supabase.auth.signOut()
        throw new Error('Could not find your profile. Please try signing up again.')
      }

      console.log('6. Profile found, is_instructor:', profile?.is_instructor)

      if (!profile?.is_instructor) {
        console.log('7. User is NOT an instructor, signing out')
        await supabase.auth.signOut()
        setError('This account is not registered as an instructor. Please sign up as an instructor first.')
        return
      }

      // Final verification before redirect
      const { data: finalSession } = await supabase.auth.getSession()
      console.log('7. Final session check:', finalSession.session ? 'VALID' : 'NULL')
      
      console.log('8. Redirecting to /instructor...')
      console.log('=== INSTRUCTOR LOGIN END ===')
      
      window.location.href = '/instructor'
    } catch (err: any) {
      console.error('LOGIN ERROR:', err)
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
          src="/gallery/4.jpg"
          alt="Untitled 04"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute bottom-8 left-8">
          <span className="text-sm text-white/80 tracking-wide">Untitled 04</span>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="text-2xl font-light tracking-tight text-charcoal inline-block mb-2">
              PikkUp
            </Link>
            <span className="ml-3 text-xs uppercase tracking-wider text-neutral-400 border border-neutral-200 px-2 py-1">
              Instructor
            </span>
            <h1 className="text-3xl font-light text-charcoal mt-8 mb-2">Welcome back</h1>
            <p className="text-neutral-500 font-light">Sign in to your instructor account.</p>
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-charcoal hover:underline font-light"
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
              className="btn-primary w-full py-4"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <p className="text-neutral-500 text-sm font-light text-center">
              New instructor?{' '}
              <Link href="/instructor/auth/signup" className="text-charcoal hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="text-neutral-400 hover:text-charcoal text-sm font-light transition-colors"
            >
              Back to student login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
