'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

export default function InstructorDashboardPage() {
  const { user, profile, loading } = useAuth()

  // Show loading spinner while auth is loading OR when we have a user but profile hasn't loaded yet
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Not logged in - show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🧘</span>
            </div>
            <h1 className="text-3xl font-bold text-charcoal mb-4">Instructor Portal</h1>
            <p className="text-sand-600 mb-8">
              Sign in to access your instructor dashboard and start teaching classes.
            </p>
            <div className="space-y-4">
              <Link href="/instructor/auth/login" className="btn-primary w-full block text-center">
                Sign In
              </Link>
              <Link href="/instructor/auth/signup" className="btn-secondary w-full block text-center">
                Create Instructor Account
              </Link>
            </div>
            <Link href="/" className="text-sand-500 hover:text-sage-600 text-sm mt-8 inline-block">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logged in but not an instructor - show upgrade prompt
  if (profile && !profile.is_instructor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream to-sand-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 bg-terracotta-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✨</span>
            </div>
            <h1 className="text-3xl font-bold text-charcoal mb-4">Become an Instructor</h1>
            <p className="text-sand-600 mb-4">
              Hi {profile.first_name}! Your current account is set up for booking classes as a student.
            </p>
            <p className="text-sand-600 mb-8">
              To teach classes at PikkUp, you&apos;ll need to create a separate instructor account with your teaching credentials.
            </p>
            <div className="space-y-4">
              <Link href="/instructor/auth/signup" className="btn-primary w-full block text-center">
                Create Instructor Account
              </Link>
              <Link href="/classes" className="btn-secondary w-full block text-center">
                Continue Browsing Classes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Final safety check - should never happen but satisfies TypeScript
  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
      </div>
    )
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
