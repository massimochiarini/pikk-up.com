'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

export default function InstructorDashboardPage() {
  const { user, profile, loading } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 3000)

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
        <div className="w-6 h-6 border border-stone-300 border-t-gray rounded-full animate-spin"></div>
      </div>
    )
  }

  // Not logged in - show landing for instructors
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Minimal Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="text-gray tracking-wide text-lg">
                PickUp
              </Link>
              <div className="flex items-center gap-8">
                <Link
                  href="/classes"
                  className="text-stone-400 hover:text-gray transition-colors duration-300 tracking-wide"
                >
                  Classes
                </Link>
                <Link
                  href="/instructor/auth/login"
                  className="text-stone-400 hover:text-gray transition-colors duration-300 tracking-wide"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-gray leading-[1.1] mb-8">
              Share your practice
            </h1>
            
            <p className="text-lg md:text-xl text-stone-500 max-w-lg mx-auto mb-12 leading-relaxed tracking-wide">
              Teach yoga at PickUp. Set your schedule, set your price, and get paid.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link 
                href="/instructor/auth/signup" 
                className="btn-primary"
              >
                Apply to teach
              </Link>
              <Link 
                href="/instructor/auth/login" 
                className="btn-secondary"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-32 px-6 bg-stone-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-normal text-gray text-center mb-16 tracking-tight">
              How it works
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Create</span>
                <p className="text-stone-400 mt-2 tracking-wide">Claim a time slot</p>
              </div>
              <span className="hidden md:block text-stone-300">→</span>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Publish</span>
                <p className="text-stone-400 mt-2 tracking-wide">Set your price</p>
              </div>
              <span className="hidden md:block text-stone-300">→</span>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Get paid</span>
                <p className="text-stone-400 mt-2 tracking-wide">We handle the rest</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-normal text-gray mb-6 tracking-tight">
              Ready to begin?
            </h2>
            <p className="text-stone-500 mb-12 tracking-wide">
              Apply to become an instructor and start teaching.
            </p>
            <Link href="/instructor/auth/signup" className="btn-primary">
              Apply to teach
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-stone-100">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-gray tracking-wide">PickUp</span>
            <Link href="/" className="text-stone-400 hover:text-gray text-sm tracking-wide transition-colors duration-300">
              Back to home
            </Link>
          </div>
        </footer>
      </div>
    )
  }

  // Logged in but pending approval
  if (profile && profile.instructor_status === 'pending') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 border border-stone-200 flex items-center justify-center mx-auto mb-8">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-normal text-gray mb-4 tracking-tight">Application under review</h1>
            <p className="text-stone-500 mb-2 tracking-wide">
              Hi {profile.first_name}! Thanks for applying to teach at PickUp.
            </p>
            <p className="text-stone-400 mb-10 tracking-wide">
              We will notify you once your application is approved.
            </p>
            <div className="space-y-3">
              <Link href="/classes" className="btn-primary w-full block text-center">
                Browse Classes
              </Link>
              <Link href="/my-classes" className="btn-secondary w-full block text-center">
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Logged in but request was rejected
  if (profile && profile.instructor_status === 'rejected') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-normal text-gray mb-4 tracking-tight">Application not approved</h1>
            <p className="text-stone-500 mb-2 tracking-wide">
              Hi {profile.first_name}, unfortunately your instructor application was not approved at this time.
            </p>
            <p className="text-stone-400 mb-10 tracking-wide">
              You can still browse and book classes as a student.
            </p>
            <div className="space-y-3">
              <Link href="/classes" className="btn-primary w-full block text-center">
                Browse Classes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Logged in but not an instructor (hasn't applied)
  if (!profile || !profile.is_instructor) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-normal text-gray mb-4 tracking-tight">Become an instructor</h1>
            <p className="text-stone-500 mb-2 tracking-wide">
              {profile ? `Hi ${profile.first_name}! ` : ''}Want to teach yoga at PickUp?
            </p>
            <p className="text-stone-400 mb-10 tracking-wide">
              Apply to become an instructor and start sharing your practice.
            </p>
            <div className="space-y-3">
              <Link href="/instructor/auth/signup" className="btn-primary w-full block text-center">
                Apply to teach
              </Link>
            </div>
            <Link href="/classes" className="text-stone-400 hover:text-gray text-sm mt-8 inline-block transition-colors duration-300 tracking-wide">
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

      {/* Dashboard Header */}
      <div className="pt-12 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-normal text-gray tracking-tight">
            Welcome back, {profile.first_name}
          </h1>
          <p className="text-stone-400 mt-3 tracking-wide">
            Manage your classes and schedule
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-px bg-stone-200 mb-16">
          <Link href="/instructor/schedule" className="bg-white p-8 group block">
            <h3 className="font-normal text-gray mb-2 tracking-tight group-hover:text-gray-dark transition-colors duration-300">
              View Schedule
            </h3>
            <p className="text-stone-400 text-sm tracking-wide mb-4">
              Browse and claim available time slots
            </p>
            <span className="text-sm text-gray tracking-wide group-hover:border-b group-hover:border-gray transition-all duration-300">
              Open schedule
            </span>
          </Link>

          <Link href="/instructor/my-classes" className="bg-white p-8 group block">
            <h3 className="font-normal text-gray mb-2 tracking-tight group-hover:text-gray-dark transition-colors duration-300">
              My Classes
            </h3>
            <p className="text-stone-400 text-sm tracking-wide mb-4">
              View and manage your scheduled classes
            </p>
            <span className="text-sm text-gray tracking-wide group-hover:border-b group-hover:border-gray transition-all duration-300">
              View classes
            </span>
          </Link>

          <Link href="/instructor/packages" className="bg-white p-8 group block">
            <h3 className="font-normal text-gray mb-2 tracking-tight group-hover:text-gray-dark transition-colors duration-300">
              Class Packages
            </h3>
            <p className="text-stone-400 text-sm tracking-wide mb-4">
              Create bundles for your students
            </p>
            <span className="text-sm text-gray tracking-wide group-hover:border-b group-hover:border-gray transition-all duration-300">
              Manage packages
            </span>
          </Link>
        </div>

        {/* Studio Info */}
        <div className="border border-stone-200 p-8 mb-16">
          <h2 className="text-lg font-normal text-gray mb-6 tracking-tight">Studio Location</h2>
          <div>
            <h3 className="font-normal text-gray">PickUp Studio</h3>
            <p className="text-stone-400 tracking-wide">2500 South Miami Avenue</p>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray hover:text-gray-dark text-sm mt-3 inline-block tracking-wide transition-colors duration-300"
            >
              View on Maps
            </a>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h2 className="text-lg font-normal text-gray mb-12 tracking-tight">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-10 h-10 bg-gray text-white flex items-center justify-center mx-auto mb-4 tracking-wide">
                1
              </div>
              <h3 className="font-normal text-gray mb-2 tracking-tight">Claim a Time Slot</h3>
              <p className="text-stone-400 text-sm tracking-wide">
                Browse the schedule and pick an available slot.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray text-white flex items-center justify-center mx-auto mb-4 tracking-wide">
                2
              </div>
              <h3 className="font-normal text-gray mb-2 tracking-tight">Create Your Class</h3>
              <p className="text-stone-400 text-sm tracking-wide">
                Add your class details: title, price, and capacity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray text-white flex items-center justify-center mx-auto mb-4 tracking-wide">
                3
              </div>
              <h3 className="font-normal text-gray mb-2 tracking-tight">Share & Teach</h3>
              <p className="text-stone-400 text-sm tracking-wide">
                Get a booking link to share. We handle the rest.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
