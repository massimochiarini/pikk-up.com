'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDaysIcon, RectangleStackIcon, MapPinIcon, ArrowRightIcon, TicketIcon } from '@heroicons/react/24/outline'

export default function InstructorDashboardPage() {
  const { user, profile, loading } = useAuth()
  const [showContent, setShowContent] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('=== INSTRUCTOR PAGE STATE ===')
    console.log('Loading:', loading)
    console.log('User:', user?.email || 'null')
    console.log('Profile:', profile ? `${profile.email} (instructor: ${profile.is_instructor})` : 'null')
    console.log('localStorage supabase-auth:', localStorage.getItem('supabase-auth') ? 'EXISTS' : 'EMPTY')
    console.log('=============================')
  }, [loading, user, profile])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 3000) // Show content after 3 seconds max

    if (!loading) {
      setShowContent(true)
      clearTimeout(timer)
    }

    return () => clearTimeout(timer)
  }, [loading])

  // Still loading auth
  if (loading && !showContent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  // Not logged in - show login/signup options
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
              <CalendarDaysIcon className="w-8 h-8 text-charcoal" />
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-4">Instructor Portal</h1>
            <p className="text-neutral-500 font-light mb-8">
              Sign in to access your dashboard and start teaching classes.
            </p>
            <div className="space-y-3">
              <Link href="/instructor/auth/login" className="btn-primary w-full block text-center py-4">
                Sign In
              </Link>
              <Link href="/instructor/auth/signup" className="btn-secondary w-full block text-center py-4">
                Create Instructor Account
              </Link>
            </div>
            <Link href="/" className="text-neutral-400 hover:text-charcoal text-sm mt-8 inline-block transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logged in but profile not loaded yet or not an instructor
  if (!profile || !profile.is_instructor) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">+</span>
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-4">Become an Instructor</h1>
            <p className="text-neutral-500 font-light mb-2">
              {profile ? `Hi ${profile.first_name}! Your current account is set up for booking classes.` : 'Welcome!'}
            </p>
            <p className="text-neutral-500 font-light mb-8">
              To teach classes at PikkUp, you need an instructor account.
            </p>
            <div className="space-y-3">
              <Link href="/instructor/auth/signup" className="btn-primary w-full block text-center py-4">
                Create Instructor Account
              </Link>
              <Link href="/instructor/auth/login" className="btn-secondary w-full block text-center py-4">
                Sign In as Instructor
              </Link>
            </div>
            <Link href="/classes" className="text-neutral-400 hover:text-charcoal text-sm mt-8 inline-block transition-colors">
              Browse classes instead
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Instructor dashboard
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero with Artwork */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/gallery/4.jpg"
          alt="Untitled 04"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-3xl md:text-4xl font-light text-charcoal">
              Welcome back, {profile.first_name}
            </h1>
            <p className="text-neutral-500 mt-2 font-light">
              Manage your classes and schedule
            </p>
          </div>
        </div>
        <div className="absolute bottom-4 right-4">
          <span className="text-sm text-charcoal/50 tracking-wide">Untitled 04</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link href="/instructor/schedule" className="group block border border-neutral-200 p-6 hover:border-charcoal transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center group-hover:border-charcoal transition-colors">
                <CalendarDaysIcon className="w-6 h-6 text-charcoal" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-charcoal mb-1">
                  View Schedule
                </h3>
                <p className="text-neutral-500 text-sm font-light">
                  Browse and claim available time slots
                </p>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-neutral-300 group-hover:text-charcoal transition-colors" />
            </div>
          </Link>

          <Link href="/instructor/my-classes" className="group block border border-neutral-200 p-6 hover:border-charcoal transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center group-hover:border-charcoal transition-colors">
                <RectangleStackIcon className="w-6 h-6 text-charcoal" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-charcoal mb-1">
                  My Classes
                </h3>
                <p className="text-neutral-500 text-sm font-light">
                  View and manage your scheduled classes
                </p>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-neutral-300 group-hover:text-charcoal transition-colors" />
            </div>
          </Link>

          <Link href="/instructor/packages" className="group block border border-neutral-200 p-6 hover:border-charcoal transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center group-hover:border-charcoal transition-colors">
                <TicketIcon className="w-6 h-6 text-charcoal" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-charcoal mb-1">
                  Class Packages
                </h3>
                <p className="text-neutral-500 text-sm font-light">
                  Create bundles for your students to save
                </p>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-neutral-300 group-hover:text-charcoal transition-colors" />
            </div>
          </Link>
        </div>

        {/* Studio Info */}
        <div className="border border-neutral-200 p-8 mb-16">
          <h2 className="text-lg font-medium text-charcoal mb-6">Studio Location</h2>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center">
              <MapPinIcon className="w-6 h-6 text-charcoal" />
            </div>
            <div>
              <h3 className="font-medium text-charcoal">PikkUp Studio</h3>
              <p className="text-neutral-500 font-light">2500 South Miami Avenue</p>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal hover:underline text-sm mt-2 inline-block"
              >
                View on Maps
              </a>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h2 className="text-lg font-medium text-charcoal mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-10 h-10 bg-charcoal text-white flex items-center justify-center mx-auto mb-4 font-light">
                1
              </div>
              <h3 className="font-medium text-charcoal mb-2">Claim a Time Slot</h3>
              <p className="text-neutral-500 text-sm font-light">
                Browse the schedule and pick an available slot that works for you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-charcoal text-white flex items-center justify-center mx-auto mb-4 font-light">
                2
              </div>
              <h3 className="font-medium text-charcoal mb-2">Create Your Class</h3>
              <p className="text-neutral-500 text-sm font-light">
                Add your class details: title, description, price, and capacity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-charcoal text-white flex items-center justify-center mx-auto mb-4 font-light">
                3
              </div>
              <h3 className="font-medium text-charcoal mb-2">Share & Teach</h3>
              <p className="text-neutral-500 text-sm font-light">
                Get a booking link to share with students. We handle the rest.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
