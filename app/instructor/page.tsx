'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

export default function InstructorDashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">
            Welcome back, {profile.first_name}!
          </h1>
          <p className="text-sand-600 mt-1">
            Manage your classes and view your schedule.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/instructor/schedule" className="card-hover group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center group-hover:bg-sage-200 transition-colors">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal group-hover:text-sage-700 transition-colors">
                  View Schedule
                </h3>
                <p className="text-sand-600 text-sm mt-1">
                  Browse and claim available time slots
                </p>
              </div>
            </div>
          </Link>

          <Link href="/instructor/my-classes" className="card-hover group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-terracotta-100 rounded-xl flex items-center justify-center group-hover:bg-terracotta-200 transition-colors">
                <span className="text-2xl">🧘</span>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal group-hover:text-sage-700 transition-colors">
                  My Classes
                </h3>
                <p className="text-sand-600 text-sm mt-1">
                  View and manage your scheduled classes
                </p>
              </div>
            </div>
          </Link>

          <div className="card bg-gradient-to-br from-sage-500 to-sage-600 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h3 className="font-semibold">Quick Tip</h3>
                <p className="text-sage-100 text-sm mt-1">
                  Claim a time slot to create your next class!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Info */}
        <div className="card bg-gradient-to-r from-sand-100 to-sage-50">
          <h2 className="text-xl font-bold text-charcoal mb-4">Studio Location</h2>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-2xl">📍</span>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal">PikkUp Studio</h3>
              <p className="text-sand-600">2500 South Miami Avenue</p>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage-600 hover:text-sage-700 text-sm font-medium mt-2 inline-block"
              >
                View on Maps →
              </a>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-charcoal mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-sage-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Claim a Time Slot</h3>
              <p className="text-sand-600 text-sm">
                Browse the schedule and pick an available slot that works for you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-sage-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Create Your Class</h3>
              <p className="text-sand-600 text-sm">
                Add your class details: title, description, price, and capacity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-sage-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Share & Teach</h3>
              <p className="text-sand-600 text-sm">
                Get a booking link to share with students. We handle the rest!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
