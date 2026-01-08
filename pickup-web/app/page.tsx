'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            Pick Up<span className="text-neon-green">.</span>
          </div>
          <Link 
            href="/auth/login" 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-none">
              Book Your Next<br />
              Studio Session<br />
              <span className="text-neon-green">with Pick Up</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Schedule, teach, and manage studio sessions.<br />
              Connect with students and grow your practice.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link 
                href="/auth/signup" 
                className="bg-neon-green hover:bg-neon-green/90 text-black font-bold text-lg px-10 py-5 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </Link>
              <Link 
                href="/auth/login" 
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-10 py-5 rounded-full border border-white/20 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/5 p-10 hover:border-neon-green/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-5xl mb-6">📍</div>
                <h3 className="text-2xl font-bold mb-3">Find Sessions Nearby</h3>
                <p className="text-gray-400 leading-relaxed">
                  Discover studio sessions happening near you
                </p>
              </div>
            </div>
            
            {/* Feature 2 - Changed emoji to yoga */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/5 p-10 hover:border-neon-green/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-5xl mb-6">🧘</div>
                <h3 className="text-2xl font-bold mb-3">Book Your Own</h3>
                <p className="text-gray-400 leading-relaxed">
                  Schedule and manage your own sessions
                </p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/5 p-10 hover:border-neon-green/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-5xl mb-6">👥</div>
                <h3 className="text-2xl font-bold mb-3">Connect & Teach</h3>
                <p className="text-gray-400 leading-relaxed">
                  Meet students and build your community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            Simple. Elegant. Powerful.
          </h2>
          
          <div className="space-y-12">
            <div className="space-y-3">
              <div className="text-neon-green font-bold text-sm tracking-wider">STEP 1</div>
              <h3 className="text-2xl font-semibold">Browse Available Sessions</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Find yoga, meditation, and wellness sessions in your area
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="text-neon-green font-bold text-sm tracking-wider">STEP 2</div>
              <h3 className="text-2xl font-semibold">Reserve Your Spot</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Book instantly with just a few clicks
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="text-neon-green font-bold text-sm tracking-wider">STEP 3</div>
              <h3 className="text-2xl font-semibold">Show Up & Practice</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Connect with instructors and fellow students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-32 px-6 bg-black">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold">
            Ready to Begin?
          </h2>
          <p className="text-xl text-gray-400">
            Join instructors and students building their practice together
          </p>
          <Link 
            href="/auth/signup" 
            className="inline-block bg-neon-green hover:bg-neon-green/90 text-black font-bold text-lg px-12 py-6 rounded-full transition-all duration-200 transform hover:scale-105"
          >
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  )
}

