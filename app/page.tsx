'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
  booking_count: number
}

export default function HomePage() {
  const [featuredClasses, setFeaturedClasses] = useState<ClassWithDetails[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [activeFlow, setActiveFlow] = useState<'student' | 'teacher'>('student')

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
            .filter((c) => c.time_slot && c.time_slot.date >= today)
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
    if (isDonation) return 'Donation'
    if (cents === 0) return 'Free'
    return `$${(cents / 100).toFixed(0)}`
  }

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - understated wordmark */}
            <Link 
              href="/" 
              className="text-gray tracking-wide text-lg"
            >
              PickUp
            </Link>
            
            {/* Desktop Navigation - minimal */}
            <div className="hidden md:flex items-center gap-10">
              <Link
                href="/classes"
                className="text-gray hover:text-gray-dark transition-colors duration-300 tracking-wide"
              >
                Classes
              </Link>
              <Link
                href="/instructor"
                className="text-gray hover:text-gray-dark transition-colors duration-300 tracking-wide"
              >
                Teach
              </Link>
              <Link
                href="/auth/login"
                className="text-stone-400 hover:text-gray transition-colors duration-300 tracking-wide"
              >
                Sign in
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-6">
              <Link
                href="/classes"
                className="text-gray text-sm tracking-wide"
              >
                Classes
              </Link>
              <Link
                href="/instructor"
                className="text-gray text-sm tracking-wide"
              >
                Teach
              </Link>
              <Link
                href="/auth/login"
                className="text-stone-400 text-sm tracking-wide"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Pure white, centered, calm */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-gray leading-[1.1] mb-8">
            Find and book yoga classes near you
          </h1>
          
          <p className="text-lg md:text-xl text-stone-500 max-w-xl mx-auto mb-12 leading-relaxed tracking-wide">
            PickUp connects students with local instructors and studios — book in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link 
              href="/classes" 
              className="btn-primary"
            >
              Find a class
            </Link>
            <Link 
              href="/instructor" 
              className="btn-secondary"
            >
              Teach a class
            </Link>
          </div>
          
          <p className="text-sm text-stone-400 tracking-wider">
            Instant booking · Secure payment · Text confirmation
          </p>
        </div>
      </section>

      {/* What Brings You Here - Yin/Yang Split */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-normal text-gray text-center mb-20 tracking-tight">
            What brings you here?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-px bg-stone-200">
            {/* Student Card */}
            <div className="bg-white p-10 md:p-14 group">
              <h3 className="text-xl md:text-2xl font-normal text-gray mb-8 tracking-tight">
                Student
              </h3>
              <ul className="space-y-4 mb-10 text-stone-500">
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-1">—</span>
                  <span>Discover local yoga classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-1">—</span>
                  <span>Book instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-1">—</span>
                  <span>Build a consistent practice</span>
                </li>
              </ul>
              <Link 
                href="/classes" 
                className="inline-block text-gray border-b border-gray pb-1 hover:border-gray-dark hover:text-gray-dark transition-colors duration-300 tracking-wide"
              >
                Browse classes
              </Link>
            </div>

            {/* Teacher Card */}
            <div className="bg-white p-10 md:p-14 group">
              <h3 className="text-xl md:text-2xl font-normal text-gray mb-8 tracking-tight">
                Teacher
              </h3>
              <ul className="space-y-4 mb-10 text-stone-500">
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-1">—</span>
                  <span>Host or teach classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-1">—</span>
                  <span>Set your price</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-stone-300 mt-1">—</span>
                  <span>Get paid</span>
                </li>
              </ul>
              <Link 
                href="/instructor" 
                className="inline-block text-gray border-b border-gray pb-1 hover:border-gray-dark hover:text-gray-dark transition-colors duration-300 tracking-wide"
              >
                Start teaching
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Minimal, calm */}
      <section className="py-32 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-normal text-gray text-center mb-12 tracking-tight">
            How it works
          </h2>
          
          {/* Toggle */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex">
              <button
                onClick={() => setActiveFlow('student')}
                className={`px-6 py-3 text-sm tracking-wider transition-colors duration-300 ${
                  activeFlow === 'student'
                    ? 'text-gray border-b-2 border-gray'
                    : 'text-stone-400 border-b-2 border-transparent hover:text-gray'
                }`}
              >
                For students
              </button>
              <button
                onClick={() => setActiveFlow('teacher')}
                className={`px-6 py-3 text-sm tracking-wider transition-colors duration-300 ${
                  activeFlow === 'teacher'
                    ? 'text-gray border-b-2 border-gray'
                    : 'text-stone-400 border-b-2 border-transparent hover:text-gray'
                }`}
              >
                For teachers
              </button>
            </div>
          </div>

          {/* Flow Steps */}
          {activeFlow === 'student' ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Browse</span>
              </div>
              <span className="hidden md:block text-stone-300">→</span>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Book</span>
              </div>
              <span className="hidden md:block text-stone-300">→</span>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Flow</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Create</span>
              </div>
              <span className="hidden md:block text-stone-300">→</span>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Publish</span>
              </div>
              <span className="hidden md:block text-stone-300">→</span>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-normal text-gray tracking-tight">Get paid</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Classes - Clean, minimal */}
      {featuredClasses.length > 0 && (
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-16">
              <h2 className="text-2xl md:text-3xl font-normal text-gray tracking-tight">
                Upcoming classes
              </h2>
              <Link 
                href="/classes" 
                className="hidden md:inline-block text-stone-400 hover:text-gray transition-colors duration-300 tracking-wide"
              >
                View all
              </Link>
            </div>

            {loadingClasses ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border border-stone-300 border-t-gray rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-px bg-stone-200">
                {featuredClasses.map((yogaClass) => {
                  const spotsLeft = yogaClass.max_capacity - yogaClass.booking_count
                  const isFull = spotsLeft <= 0

                  return (
                    <Link
                      key={yogaClass.id}
                      href={`/book/${yogaClass.id}`}
                      className={`bg-white p-8 block group ${isFull ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-normal text-gray group-hover:text-gray-dark transition-colors duration-300 tracking-tight mb-1">
                            {yogaClass.title}
                          </h3>
                          <p className="text-stone-400 text-sm tracking-wide">
                            {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                          </p>
                        </div>
                        <span className="text-gray font-normal">
                          {formatPrice(yogaClass.price_cents, yogaClass.is_donation)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-stone-400 tracking-wide">
                        <span>{formatDate(yogaClass.time_slot.date)}</span>
                        <span>{formatTime(yogaClass.time_slot.start_time)}</span>
                      </div>
                      
                      {!isFull && (
                        <div className="mt-6 pt-6 border-t border-stone-100">
                          <span className="text-sm text-gray tracking-wide group-hover:border-b group-hover:border-gray transition-all duration-300">
                            Book now
                          </span>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
            
            <div className="text-center mt-12 md:hidden">
              <Link 
                href="/classes" 
                className="text-stone-400 hover:text-gray transition-colors duration-300 tracking-wide"
              >
                View all classes
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA - Simple, calm */}
      <section className="py-32 px-6 bg-stone-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-normal text-gray mb-6 tracking-tight">
            Ready to begin?
          </h2>
          <p className="text-stone-500 mb-12 tracking-wide">
            Find your next class or share your teaching with others.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/classes" className="btn-primary">
              Find a class
            </Link>
            <Link href="/instructor" className="btn-secondary">
              Teach a class
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-20 px-6 border-t border-stone-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
            <div>
              <span className="text-gray tracking-wide text-lg">PickUp</span>
              <p className="text-stone-400 text-sm mt-3 max-w-xs tracking-wide">
                Find and book yoga classes near you.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h4 className="text-stone-400 text-sm tracking-wider mb-4">Students</h4>
                <ul className="space-y-3 text-gray text-sm tracking-wide">
                  <li><Link href="/classes" className="hover:text-gray-dark transition-colors duration-300">Browse Classes</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-gray-dark transition-colors duration-300">Create Account</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-stone-400 text-sm tracking-wider mb-4">Teachers</h4>
                <ul className="space-y-3 text-gray text-sm tracking-wide">
                  <li><Link href="/instructor" className="hover:text-gray-dark transition-colors duration-300">Start Teaching</Link></li>
                  <li><Link href="/instructor/auth/login" className="hover:text-gray-dark transition-colors duration-300">Sign In</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-stone-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <span className="text-stone-400 text-sm tracking-wide">
              © {new Date().getFullYear()} PickUp
            </span>
            <div className="flex gap-6 text-stone-400 text-sm tracking-wide">
              <Link href="/legal/privacy" className="hover:text-gray transition-colors duration-300">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-gray transition-colors duration-300">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-stone-200 p-4 z-40">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Link 
            href="/classes" 
            className="flex-1 bg-gray text-white text-center py-3 text-sm tracking-wide"
          >
            Find a class
          </Link>
          <Link 
            href="/instructor" 
            className="flex-1 border border-gray text-gray text-center py-3 text-sm tracking-wide"
          >
            Teach
          </Link>
        </div>
      </div>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-20 md:hidden" />
    </div>
  )
}
