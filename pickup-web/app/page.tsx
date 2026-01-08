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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-sky-blue">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Book Your Next<br />
            <span className="text-neon-green">Studio Session</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-12">
            Schedule, teach, and manage studio sessions.<br />
            Connect with students and grow your practice.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup" className="btn-primary text-lg px-8 py-4">
              Get Started
            </Link>
            <Link href="/auth/login" className="bg-white hover:bg-gray-100 text-navy font-semibold text-lg px-8 py-4 rounded-lg transition-colors duration-200">
              Sign In
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-2">Find Sessions Nearby</h3>
              <p className="text-gray-200">Discover studio sessions happening near you</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white">
              <div className="text-4xl mb-4">🎾</div>
              <h3 className="text-xl font-bold mb-2">Book Your Own</h3>
              <p className="text-gray-200">Schedule and manage your own sessions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Connect & Teach</h3>
              <p className="text-gray-200">Meet students and build your community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

