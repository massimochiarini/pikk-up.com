'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { BOOKING_CUTOFF_DATE } from '@/lib/constants'
import { RevealSection, RevealItem } from '@/components/ui'
import { EmailGate } from '@/components/EmailGate'

/** Set to true to show the email gate first on the landing (e.g. for Instagram bio link). */
const ENABLE_EMAIL_GATE = true

const GATE_PASSED_COOKIE = 'pikkup_gate_passed'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
  booking_count: number
}

export default function HomePage() {
  const [featuredClasses, setFeaturedClasses] = useState<ClassWithDetails[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [activeFlow, setActiveFlow] = useState<'student' | 'teacher'>('student')
  const [hoveredCard, setHoveredCard] = useState<'student' | 'teacher' | null>(null)

  const [showEmailGate, setShowEmailGate] = useState<boolean | null>(ENABLE_EMAIL_GATE ? null : false)

  useEffect(() => {
    if (!ENABLE_EMAIL_GATE) {
      setShowEmailGate(false)
      return
    }
    const passed = typeof document !== 'undefined' && document.cookie.includes(`${GATE_PASSED_COOKIE}=`)
    setShowEmailGate(!passed)
  }, [])

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            time_slot:time_slots(*),
            instructor:profiles!instructor_id(*)
          `)
          .eq('status', 'upcoming')

        if (error) {
          console.error('Error fetching classes:', error)
          setFeaturedClasses([])
          return
        }

        if (data) {
          const filteredData = data
            .filter((c) => c.time_slot && c.time_slot.date >= today && c.time_slot.date < BOOKING_CUTOFF_DATE)
            .sort((a, b) => {
              const dateA = a.time_slot?.date + 'T' + a.time_slot?.start_time
              const dateB = b.time_slot?.date + 'T' + b.time_slot?.start_time
              return dateA.localeCompare(dateB)
            })
            .slice(0, 4)

          const classesWithCounts = await Promise.all(
            filteredData.map(async (c) => {
              try {
                const { data: count } = await supabase
                  .rpc('get_booking_count', { class_uuid: c.id })
                return { ...c, booking_count: count || 0 }
              } catch {
                return { ...c, booking_count: 0 }
              }
            })
          )
          setFeaturedClasses(classesWithCounts as ClassWithDetails[])
        }
      } catch (err) {
        console.error('Error fetching classes:', err)
      } finally {
        setLoadingClasses(false)
      }
    }

    fetchClasses()
  }, [])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const formatPrice = (cents: number, isDonation?: boolean) => {
    if (isDonation) return 'donation'
    if (cents === 0) return 'free'
    return `$${(cents / 100).toFixed(0)}`
  }

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'today'
    if (isTomorrow(date)) return 'tomorrow'
    return format(date, 'EEE, MMM d').toLowerCase()
  }

  // Flow steps data
  const flowSteps = {
    student: ['browse', 'book', 'flow'],
    teacher: ['create', 'publish', 'get paid'],
  }

  if (ENABLE_EMAIL_GATE && (showEmailGate === true || showEmailGate === null)) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-stone-100">
          <div className="max-w-2xl mx-auto px-6 py-5">
            <Link href="/" className="text-stone-500 tracking-wide text-lg hover:text-stone-700 transition-colors">
              PickUp
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center px-6 py-12">
          <div className="max-w-2xl mx-auto w-full">
            <h1 className="text-2xl font-light text-stone-800 tracking-tight mb-2">Welcome</h1>
            <EmailGate
              intro="PickUp is drop-in yoga at a studio in Miami. Book a class, show up, and flow."
              ctaText="Enter your email to claim your first class free"
              successMessage="Free class unlocked—book now"
              redirectTo="/classes?free=1"
              showRoleChoice={true}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Ambient background orb */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="ambient-orb w-[800px] h-[600px] -top-48 -right-48 opacity-40"
          style={{ filter: 'blur(80px)' }}
        />
        <div 
          className="ambient-orb w-[600px] h-[400px] top-1/2 -left-48 opacity-30"
          style={{ filter: 'blur(60px)', animationDelay: '-10s' }}
        />
      </div>

      {/* Minimal Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-glass border-b border-stone-100/50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link 
              href="/" 
              className="text-stone-500 tracking-wide text-lg transition-colors duration-300 hover:text-stone-700"
            >
              PickUp
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              <Link href="/classes" className="link-underline text-stone-600 tracking-wide">
                classes
              </Link>
              <Link href="/instructor" className="link-underline text-stone-600 tracking-wide">
                teach
              </Link>
              <Link href="/auth/login" className="text-stone-400 hover:text-stone-600 transition-colors duration-300 tracking-wide">
                sign in
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-6">
              <Link href="/classes" className="text-stone-600 text-sm tracking-wide">
                classes
              </Link>
              <Link href="/instructor" className="text-stone-600 text-sm tracking-wide">
                teach
              </Link>
              <Link href="/auth/login" className="text-stone-400 text-sm tracking-wide">
                sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Blur resolve animation, slight left align */}
      <section className="min-h-screen flex items-center px-6 pt-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="max-w-3xl">
            {/* Signature moment: blur-resolve hero */}
            <motion.h1 
              className="text-headline mb-8"
              initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              find and book yoga classes near you
            </motion.h1>
            
            <motion.p 
              className="text-body-large max-w-xl mb-12"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              PickUp connects students with local instructors and studios — book in seconds.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-10"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link href="/classes" className="btn-primary">
                find a class
              </Link>
              <Link href="/instructor" className="btn-secondary">
                teach a class
              </Link>
            </motion.div>
            
            <motion.p 
              className="text-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              instant booking · secure payment · text confirmation
            </motion.p>
          </div>
        </div>
      </section>

      {/* What Brings You Here - Yin/Yang with hover interplay */}
      <RevealSection className="py-32 md:py-40 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-section-title text-center mb-20">
            what brings you here?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Student Card */}
            <motion.div 
              className="surface-card-hover p-10 md:p-14 cursor-pointer"
              onMouseEnter={() => setHoveredCard('student')}
              onMouseLeave={() => setHoveredCard(null)}
              animate={{
                opacity: hoveredCard === 'teacher' ? 0.6 : 1,
                scale: hoveredCard === 'student' ? 1.01 : 1,
              }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => window.location.href = '/classes'}
            >
              <h3 className="text-xl md:text-2xl font-normal text-stone-800 mb-8 tracking-tight">
                student
              </h3>
              <ul className="space-y-4 mb-10 text-stone-500">
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-0.5">—</span>
                  <span>discover local yoga classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-0.5">—</span>
                  <span>book instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-0.5">—</span>
                  <span>build a consistent practice</span>
                </li>
              </ul>
              <span className="link-underline text-stone-700 tracking-wide">
                browse classes
              </span>
            </motion.div>

            {/* Teacher Card */}
            <motion.div 
              className="surface-card-hover p-10 md:p-14 cursor-pointer"
              onMouseEnter={() => setHoveredCard('teacher')}
              onMouseLeave={() => setHoveredCard(null)}
              animate={{
                opacity: hoveredCard === 'student' ? 0.6 : 1,
                scale: hoveredCard === 'teacher' ? 1.01 : 1,
              }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => window.location.href = '/instructor'}
            >
              <h3 className="text-xl md:text-2xl font-normal text-stone-800 mb-8 tracking-tight">
                teacher
              </h3>
              <ul className="space-y-4 mb-10 text-stone-500">
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-0.5">—</span>
                  <span>host or teach classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-0.5">—</span>
                  <span>set your price</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-0.5">—</span>
                  <span>get paid</span>
                </li>
              </ul>
              <span className="link-underline text-stone-700 tracking-wide">
                start teaching
              </span>
            </motion.div>
          </div>
        </div>
      </RevealSection>

      {/* How It Works - Animated toggle */}
      <RevealSection className="py-32 md:py-40 px-6 bg-stone-50/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-section-title text-center mb-12">
            how it works
          </h2>
          
          {/* Segmented Control Toggle */}
          <div className="flex justify-center mb-16">
            <div className="segmented-control">
              <button
                onClick={() => setActiveFlow('student')}
                className={activeFlow === 'student' ? 'segmented-control-item-active' : 'segmented-control-item'}
              >
                for students
              </button>
              <button
                onClick={() => setActiveFlow('teacher')}
                className={activeFlow === 'teacher' ? 'segmented-control-item-active' : 'segmented-control-item'}
              >
                for teachers
              </button>
            </div>
          </div>

          {/* Flow Steps with crossfade animation */}
          <div className="relative h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFlow}
                className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
                initial={{ opacity: 0, x: activeFlow === 'student' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeFlow === 'student' ? 20 : -20 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {flowSteps[activeFlow].map((step, index) => (
                  <div key={step} className="flex items-center gap-6 md:gap-12">
                    <span className="text-2xl md:text-4xl font-normal text-stone-800 tracking-tight">
                      {step}
                    </span>
                    {index < flowSteps[activeFlow].length - 1 && (
                      <span className="hidden md:block text-stone-300 text-2xl">→</span>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </RevealSection>

      {/* Featured Classes - Staggered reveal, tactile hover */}
      {(featuredClasses.length > 0 || loadingClasses) && (
        <RevealSection className="py-32 md:py-40 px-6" stagger staggerDelay={0.1}>
          <div className="max-w-5xl mx-auto">
            <RevealItem className="flex items-center justify-between mb-16">
              <h2 className="text-section-title">
                upcoming classes
              </h2>
              <Link 
                href="/classes" 
                className="hidden md:inline-block link-underline text-stone-500 tracking-wide"
              >
                view all
              </Link>
            </RevealItem>

            {loadingClasses ? (
              <div className="flex items-center justify-center py-20">
                <motion.div 
                  className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {featuredClasses.map((yogaClass, index) => {
                  const spotsLeft = yogaClass.max_capacity - yogaClass.booking_count
                  const isFull = spotsLeft <= 0

                  return (
                    <RevealItem key={yogaClass.id}>
                      <motion.div
                        className={`surface-card p-8 group ${isFull ? 'opacity-50' : ''}`}
                        whileHover={!isFull ? { 
                          y: -2,
                          boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.08)',
                        } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Link href={`/book/${yogaClass.id}`} className="block">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-normal text-stone-800 group-hover:text-stone-900 transition-colors duration-300 tracking-tight mb-1">
                                {yogaClass.title.toLowerCase()}
                              </h3>
                              <p className="text-stone-400 text-sm tracking-wide">
                                {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                              </p>
                            </div>
                            <span className="text-stone-700 font-normal">
                              {formatPrice(yogaClass.price_cents, yogaClass.is_donation)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-stone-400 tracking-wide">
                            <span>{formatDate(yogaClass.time_slot.date)}</span>
                            <span>{formatTime(yogaClass.time_slot.start_time)}</span>
                          </div>
                          
                          {!isFull && (
                            <div className="mt-6 pt-6 border-t border-stone-100">
                              <span className="link-underline text-sm text-stone-600 tracking-wide">
                                book now
                              </span>
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    </RevealItem>
                  )
                })}
              </div>
            )}
            
            <div className="text-center mt-12 md:hidden">
              <Link href="/classes" className="link-underline text-stone-500 tracking-wide">
                view all classes
              </Link>
            </div>
          </div>
        </RevealSection>
      )}

      {/* Final CTA */}
      <RevealSection className="py-32 md:py-40 px-6 bg-stone-50/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-section-title mb-6">
            ready to begin?
          </h2>
          <p className="text-body-large mb-12">
            find your next class or share your teaching with others.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/classes" className="btn-primary">
              find a class
            </Link>
            <Link href="/instructor" className="btn-secondary">
              teach a class
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-stone-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
            <div>
              <span className="text-stone-500 tracking-wide text-lg">PickUp</span>
              <p className="text-stone-400 text-sm mt-3 max-w-xs tracking-wide">
                find and book yoga classes near you.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h4 className="text-label mb-4">students</h4>
                <ul className="space-y-3 text-stone-600 text-sm tracking-wide">
                  <li><Link href="/classes" className="link-subtle">browse classes</Link></li>
                  <li><Link href="/auth/signup" className="link-subtle">create account</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-label mb-4">teachers</h4>
                <ul className="space-y-3 text-stone-600 text-sm tracking-wide">
                  <li><Link href="/instructor" className="link-subtle">start teaching</Link></li>
                  <li><Link href="/instructor/auth/login" className="link-subtle">sign in</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-stone-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <span className="text-stone-400 text-sm tracking-wide">
              © {new Date().getFullYear()} PickUp
            </span>
            <div className="flex gap-6 text-stone-400 text-sm tracking-wide">
              <Link href="/legal/privacy" className="link-subtle">privacy</Link>
              <Link href="/legal/terms" className="link-subtle">terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom CTA */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 md:hidden bg-white/90 backdrop-blur-glass border-t border-stone-100 p-4 z-40"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="flex gap-3 max-w-lg mx-auto">
          <Link 
            href="/classes" 
            className="flex-1 bg-stone-800 text-white text-center py-3 text-sm tracking-wide hover:bg-stone-900 transition-colors duration-300"
          >
            find a class
          </Link>
          <Link 
            href="/instructor" 
            className="flex-1 border border-stone-300 text-stone-700 text-center py-3 text-sm tracking-wide hover:border-stone-400 transition-colors duration-300"
          >
            teach
          </Link>
        </div>
      </motion.div>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-20 md:hidden" />
    </div>
  )
}
