'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InstructorSignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Update profile as instructor
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            is_instructor: true,
            phone: phone.replace(/\D/g, '') || null,
            instagram: instagram || null,
            bio: bio || null,
          })
          .eq('id', authData.user.id)

        if (updateError) throw updateError
      }

      router.push('/instructor')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-sage-700 inline-block">
            Pikk<span className="text-terracotta-500">Up</span>
          </Link>
          <div className="inline-block ml-2 px-3 py-1 bg-sage-100 text-sage-700 text-sm font-medium rounded-full">
            Instructor
          </div>
          <p className="text-sand-600 mt-3">Join our community of yoga instructors.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="label">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

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
              <label htmlFor="phone" className="label">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="instagram" className="label">
                Instagram <span className="text-sand-400 font-normal">(optional)</span>
              </label>
              <input
                id="instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="input-field"
                placeholder="@yourusername"
              />
            </div>

            <div>
              <label htmlFor="bio" className="label">
                Bio <span className="text-sand-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Tell students about your teaching style and experience..."
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
                minLength={6}
                required
              />
              <p className="text-sand-500 text-xs mt-1">At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Instructor Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sand-600 text-sm">
              Already have an account?{' '}
              <Link href="/instructor/auth/login" className="text-sage-600 hover:text-sage-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/auth/signup" 
            className="text-sand-500 hover:text-sage-600 text-sm transition-colors"
          >
            ← Looking to book classes instead?
          </Link>
        </div>
      </div>
    </div>
  )
}
