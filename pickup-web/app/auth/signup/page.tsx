'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SportPreference } from '@/lib/theme'
import { useTheme } from '@/components/ThemeProvider'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const { setSportPreference } = useTheme()
  const [step, setStep] = useState<'credentials' | 'sport' | 'profile'>('credentials')
  const [userId, setUserId] = useState('')
  
  // Credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Sport preference
  const [selectedSport, setSelectedSport] = useState<SportPreference>('pickleball')
  
  // Profile
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error('Failed to create account')

      setUserId(data.user.id)
      setStep('sport')
    } catch (error: any) {
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleSportSelection = (sport: SportPreference) => {
    setSelectedSport(sport)
    setSportPreference(sport)
    setStep('profile')
  }

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          username: username || null,
          bio: bio || null,
          sport_preference: selectedSport,
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      router.push('/home')
    } catch (error: any) {
      setError(error.message || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-sky-blue flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {step === 'credentials' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-navy mb-2">Create Account</h1>
              <p className="text-gray-600">Join our community</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-sky-blue/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Continue'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-sky-blue font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </>
        ) : step === 'sport' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-navy mb-2">Choose Your Sport</h1>
              <p className="text-gray-600">Select your primary interest</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Pickleball Option */}
              <button
                onClick={() => handleSportSelection('pickleball')}
                className="relative group p-6 rounded-xl border-3 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  borderColor: selectedSport === 'pickleball' ? '#D3FD00' : '#E5E7EB',
                  backgroundColor: selectedSport === 'pickleball' ? '#F0FFF4' : 'white',
                }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-colors"
                    style={{ backgroundColor: '#D3FD00' }}
                  >
                    🏓
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Pickleball</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Join the fastest growing sport
                  </p>
                  {selectedSport === 'pickleball' && (
                    <div className="absolute top-3 right-3">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {/* Yoga Option */}
              <button
                onClick={() => handleSportSelection('yoga')}
                className="relative group p-6 rounded-xl border-3 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  borderColor: selectedSport === 'yoga' ? '#C4B5FD' : '#E5E7EB',
                  backgroundColor: selectedSport === 'yoga' ? '#FAF5FF' : 'white',
                }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-colors"
                    style={{ backgroundColor: '#C4B5FD' }}
                  >
                    🧘
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Yoga</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Find your inner peace
                  </p>
                  {selectedSport === 'yoga' && (
                    <div className="absolute top-3 right-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {/* Both Option */}
              <button
                onClick={() => handleSportSelection('both')}
                className="relative group p-6 rounded-xl border-3 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                  borderColor: selectedSport === 'both' ? '#D3FD00' : '#E5E7EB',
                  background: selectedSport === 'both' 
                    ? 'linear-gradient(135deg, #F0FFF4 0%, #FAF5FF 100%)' 
                    : 'white',
                }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-colors"
                    style={{ background: 'linear-gradient(135deg, #D3FD00 0%, #C4B5FD 100%)' }}
                  >
                    ✨
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Both</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Enjoy the best of both worlds
                  </p>
                  {selectedSport === 'both' && (
                    <div className="absolute top-3 right-3">
                      <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setStep('credentials')}
                className="text-gray-500 text-sm hover:underline"
              >
                ← Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-navy mb-2">Complete Your Profile</h1>
              <p className="text-gray-600">Tell us a bit about yourself</p>
            </div>

            <form onSubmit={handleProfileSetup} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-sky-blue/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating profile...' : 'Complete Signup'}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setStep('sport')}
                  className="text-gray-500 text-sm hover:underline"
                >
                  ← Back
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'credentials' && (
          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-500 text-sm hover:underline">
              ← Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

