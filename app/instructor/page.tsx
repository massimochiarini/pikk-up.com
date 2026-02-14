'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { RevealSection, RevealItem } from '@/components/ui'

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
        <motion.div 
          className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  // Not logged in - show landing for instructors
  if (!user) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* Ambient background orb */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div 
            className="ambient-orb w-[600px] h-[400px] top-1/4 -right-48 opacity-30"
            style={{ filter: 'blur(60px)' }}
          />
        </div>

        {/* Minimal Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-glass border-b border-stone-100/50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="text-stone-500 tracking-wide text-lg transition-colors duration-300 hover:text-stone-700">
                PickUp
              </Link>
              <div className="flex items-center gap-8">
                <Link href="/classes" className="link-underline text-stone-600 tracking-wide">
                  classes
                </Link>
                <Link href="/instructor/auth/login" className="text-stone-400 hover:text-stone-600 transition-colors duration-300 tracking-wide">
                  sign in
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero - blur resolve animation */}
        <section className="min-h-screen flex items-center px-6 pt-20">
          <div className="max-w-6xl mx-auto w-full">
            <div className="max-w-2xl">
              <motion.h1 
                className="text-headline mb-8"
                initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              >
                share your practice
              </motion.h1>
              
              <motion.p 
                className="text-body-large max-w-lg mb-12"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                teach yoga at PickUp. set your schedule, set your price, and get paid.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 mb-10"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Link href="/instructor/auth/signup" className="btn-primary">
                  apply to teach
                </Link>
                <Link href="/instructor/auth/login" className="btn-secondary">
                  sign in
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <RevealSection className="py-32 md:py-40 px-6 bg-stone-50/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-section-title text-center mb-16">
              how it works
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="text-center">
                <span className="text-2xl md:text-4xl font-normal text-stone-800 tracking-tight">apply</span>
                <p className="text-stone-400 mt-2 tracking-wide">become an instructor</p>
              </div>
              <span className="hidden md:block text-stone-300 text-2xl">→</span>
              <div className="text-center">
                <span className="text-2xl md:text-4xl font-normal text-stone-800 tracking-tight">teach</span>
                <p className="text-stone-400 mt-2 tracking-wide">lead your classes</p>
              </div>
              <span className="hidden md:block text-stone-300 text-2xl">→</span>
              <div className="text-center">
                <span className="text-2xl md:text-4xl font-normal text-stone-800 tracking-tight">get paid</span>
                <p className="text-stone-400 mt-2 tracking-wide">we handle the rest</p>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* CTA */}
        <RevealSection className="py-32 md:py-40 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-section-title mb-6">
              ready to begin?
            </h2>
            <p className="text-body-large mb-12">
              apply to become an instructor and start teaching.
            </p>
            <Link href="/instructor/auth/signup" className="btn-primary">
              apply to teach
            </Link>
          </div>
        </RevealSection>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-stone-100">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-stone-500 tracking-wide">PickUp</span>
            <Link href="/" className="link-subtle text-sm tracking-wide">
              back to home
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
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[80vh] px-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center max-w-md">
            <motion.div 
              className="w-14 h-14 border border-stone-200 flex items-center justify-center mx-auto mb-8"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-normal text-stone-800 mb-4 tracking-tight">application under review</h1>
            <p className="text-stone-500 mb-2 tracking-wide">
              hi {profile.first_name}! thanks for applying to teach at PickUp.
            </p>
            <p className="text-stone-400 mb-10 tracking-wide">
              we will notify you once your application is approved.
            </p>
            <div className="space-y-3">
              <Link href="/classes" className="btn-primary w-full block text-center">
                browse classes
              </Link>
              <Link href="/my-classes" className="btn-secondary w-full block text-center">
                my bookings
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Logged in but request was rejected
  if (profile && profile.instructor_status === 'rejected') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[80vh] px-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-normal text-stone-800 mb-4 tracking-tight">application not approved</h1>
            <p className="text-stone-500 mb-2 tracking-wide">
              hi {profile.first_name}, unfortunately your instructor application was not approved at this time.
            </p>
            <p className="text-stone-400 mb-10 tracking-wide">
              you can still browse and book classes as a student.
            </p>
            <div className="space-y-3">
              <Link href="/classes" className="btn-primary w-full block text-center">
                browse classes
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Logged in but not an instructor (hasn't applied)
  if (!profile || !profile.is_instructor) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[80vh] px-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-normal text-stone-800 mb-4 tracking-tight">become an instructor</h1>
            <p className="text-stone-500 mb-2 tracking-wide">
              {profile ? `hi ${profile.first_name}! ` : ''}want to teach yoga at PickUp?
            </p>
            <p className="text-stone-400 mb-10 tracking-wide">
              apply to become an instructor and start sharing your practice.
            </p>
            <div className="space-y-3">
              <Link href="/instructor/auth/signup" className="btn-primary w-full block text-center">
                apply to teach
              </Link>
            </div>
            <Link href="/classes" className="link-subtle text-sm mt-8 inline-block tracking-wide">
              browse classes instead
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Instructor dashboard
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Dashboard Header */}
      <motion.div 
        className="pt-12 pb-8 px-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-normal text-stone-800 tracking-tight">
            welcome back, {profile.first_name}
          </h1>
          <p className="text-stone-500 mt-3 tracking-wide">
            manage your classes and schedule
          </p>
        </div>
      </motion.div>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        {/* Quick Actions - Soft cards with motion */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {[
            { href: '/instructor/schedule', title: 'view schedule', desc: 'browse and claim available time slots', cta: 'open schedule' },
            { href: '/instructor/my-classes', title: 'my classes', desc: 'view and manage your scheduled classes', cta: 'view classes' },
            { href: '/instructor/packages', title: 'class packages', desc: 'create bundles for your students', cta: 'manage packages' },
          ].map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
            >
              <motion.div
                className="surface-card p-8 h-full group"
                whileHover={{ y: -2, boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.08)' }}
                transition={{ duration: 0.3 }}
              >
                <Link href={item.href} className="block h-full">
                  <h3 className="font-normal text-stone-800 mb-2 tracking-tight group-hover:text-stone-900 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-stone-400 text-sm tracking-wide mb-6">
                    {item.desc}
                  </p>
                  <span className="link-underline text-sm text-stone-600 tracking-wide">
                    {item.cta}
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Studio Info */}
        <RevealSection className="mb-16">
          <div className="surface-card p-8">
            <h2 className="text-lg font-normal text-stone-800 mb-6 tracking-tight">studio location</h2>
            <div>
              <h3 className="font-normal text-stone-700">PickUp Studio</h3>
              <p className="text-stone-400 tracking-wide">2500 South Miami Avenue</p>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=2500+South+Miami+Avenue"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline text-sm text-stone-600 mt-3 inline-block tracking-wide"
              >
                view on maps
              </a>
            </div>
          </div>
        </RevealSection>

        {/* How It Works - Staggered reveal */}
        <RevealSection stagger staggerDelay={0.1}>
          <RevealItem>
            <h2 className="text-lg font-normal text-stone-800 mb-12 tracking-tight">how it works</h2>
          </RevealItem>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: '1', title: 'view your schedule', desc: 'check your upcoming classes and time slots.' },
              { num: '2', title: 'manage your classes', desc: 'review bookings and class details.' },
              { num: '3', title: 'share & teach', desc: 'share your booking link. we handle the rest.' },
            ].map((step) => (
              <RevealItem key={step.num} className="text-center">
                <div className="w-10 h-10 bg-stone-800 text-white flex items-center justify-center mx-auto mb-4 tracking-wide text-sm">
                  {step.num}
                </div>
                <h3 className="font-normal text-stone-800 mb-2 tracking-tight">{step.title}</h3>
                <p className="text-stone-400 text-sm tracking-wide">
                  {step.desc}
                </p>
              </RevealItem>
            ))}
          </div>
        </RevealSection>
      </main>
    </div>
  )
}
