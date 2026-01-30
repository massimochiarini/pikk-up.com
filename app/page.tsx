'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/HeroSection'
import { supabase, type YogaClass, type TimeSlot, type Profile } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { 
  CalendarDaysIcon, 
  CreditCardIcon, 
  SparklesIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowRightIcon,
  PlusCircleIcon,
  MegaphoneIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

type ClassWithDetails = YogaClass & {
  time_slot: TimeSlot
  instructor: Profile
  booking_count: number
}

export default function LandingPage() {
  const [featuredClasses, setFeaturedClasses] = useState<ClassWithDetails[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students')

  // Fetch featured classes
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
            .slice(0, 6)

          // Fetch booking counts
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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/" className="text-xl sm:text-2xl font-medium tracking-tight text-charcoal flex-shrink-0">
              PickUp
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/classes"
                className="text-neutral-600 hover:text-charcoal font-medium transition-colors"
              >
                Classes
              </Link>
              <Link
                href="/instructor"
                className="text-charcoal font-medium px-4 py-2 border-2 border-charcoal hover:bg-charcoal hover:text-white transition-colors"
              >
                Teach
              </Link>
              <Link
                href="/auth/login"
                className="text-neutral-500 hover:text-charcoal font-light transition-colors"
              >
                Sign In
              </Link>
            </div>
            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-3">
              <Link
                href="/classes"
                className="text-neutral-600 hover:text-charcoal text-sm font-medium transition-colors"
              >
                Classes
              </Link>
              <Link
                href="/instructor"
                className="text-charcoal text-sm font-medium px-3 py-1.5 border-2 border-charcoal"
              >
                Teach
              </Link>
              <Link
                href="/auth/login"
                className="text-neutral-500 hover:text-charcoal text-sm font-light transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Overlay Card */}
      <HeroSection
        imageSrc="/gallery/1.jpg"
        imageNumber={1}
        overlay="light"
        height="screen"
        showCaption={false}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md p-8 md:p-12 lg:p-16 max-w-2xl w-full text-center shadow-sm">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-charcoal mb-4 md:mb-6">
              Find and book yoga classes near you
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 mb-8 md:mb-10 font-light leading-relaxed">
              PickUp connects students with local instructors and studios — book in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/classes" className="btn-primary text-center px-8 py-4 text-base sm:text-lg">
                Find a class
              </Link>
              <Link href="/instructor" className="btn-secondary text-center px-8 py-4 text-base sm:text-lg">
                Teach a class
              </Link>
            </div>
            <p className="text-sm text-neutral-500 font-light">
              Instant booking · Secure payment · Text confirmation
            </p>
          </div>
        </div>
      </HeroSection>

      {/* What Brings You Here Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-medium text-charcoal text-center mb-12 md:mb-16">
            What brings you here?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Student Card */}
            <div className="border border-neutral-200 p-8 md:p-10 hover:border-charcoal transition-colors group">
              <div className="w-14 h-14 border border-neutral-200 flex items-center justify-center mb-6 group-hover:border-charcoal transition-colors">
                <UserGroupIcon className="w-7 h-7 text-charcoal" />
              </div>
              <h3 className="text-xl md:text-2xl font-medium text-charcoal mb-4">I&apos;m a student</h3>
              <ul className="space-y-3 mb-8 text-neutral-600 font-light">
                <li className="flex items-center gap-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <span>Browse yoga classes in your area</span>
                </li>
                <li className="flex items-center gap-3">
                  <CreditCardIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <span>Book instantly with secure payment</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <span>Save with class packages and credits</span>
                </li>
              </ul>
              <Link href="/classes" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
                Browse classes
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Teacher Card */}
            <div className="border border-neutral-200 p-8 md:p-10 hover:border-charcoal transition-colors group">
              <div className="w-14 h-14 border border-neutral-200 flex items-center justify-center mb-6 group-hover:border-charcoal transition-colors">
                <CalendarDaysIcon className="w-7 h-7 text-charcoal" />
              </div>
              <h3 className="text-xl md:text-2xl font-medium text-charcoal mb-4">I&apos;m a teacher</h3>
              <ul className="space-y-3 mb-8 text-neutral-600 font-light">
                <li className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <span>Claim available time slots at our studio</span>
                </li>
                <li className="flex items-center gap-3">
                  <CurrencyDollarIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <span>Set your own prices for each class</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <span>Get paid directly — we handle the rest</span>
                </li>
              </ul>
              <Link href="/instructor" className="btn-secondary inline-flex items-center gap-2 px-6 py-3">
                Start teaching
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Toggle between Students/Teachers */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-medium text-charcoal text-center mb-6">
            How it works
          </h2>
          
          {/* Toggle */}
          <div className="flex justify-center mb-12 md:mb-16">
            <div className="inline-flex border border-neutral-200 p-1 bg-white">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'students'
                    ? 'bg-charcoal text-white'
                    : 'text-neutral-500 hover:text-charcoal'
                }`}
              >
                For Students
              </button>
              <button
                onClick={() => setActiveTab('teachers')}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'teachers'
                    ? 'bg-charcoal text-white'
                    : 'text-neutral-500 hover:text-charcoal'
                }`}
              >
                For Teachers
              </button>
            </div>
          </div>

          {/* Steps */}
          {activeTab === 'students' ? (
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-charcoal text-white flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  1
                </div>
                <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-charcoal">Browse</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Explore yoga classes taught by certified local instructors.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-charcoal text-white flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  2
                </div>
                <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                  <CreditCardIcon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-charcoal">Book</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Reserve your spot with secure payment. Get instant text confirmation.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-charcoal text-white flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  3
                </div>
                <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-charcoal">Show up</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Arrive at the studio ready to flow. We handle all the details.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-charcoal text-white flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  1
                </div>
                <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                  <PlusCircleIcon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-charcoal">Create</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Claim a time slot and set up your class with title, price, and capacity.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-charcoal text-white flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  2
                </div>
                <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                  <MegaphoneIcon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-charcoal">Publish</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Your class goes live on PickUp. Share your booking link with students.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-charcoal text-white flex items-center justify-center mx-auto mb-6 text-xl font-medium">
                  3
                </div>
                <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
                  <BanknotesIcon className="w-6 h-6 text-charcoal" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-charcoal">Get paid</h3>
                <p className="text-neutral-500 font-light leading-relaxed">
                  Students book and pay online. You focus on teaching — we handle the rest.
                </p>
              </div>
            </div>
          )}
          
          {/* CTA */}
          <div className="text-center mt-12">
            <Link 
              href={activeTab === 'students' ? '/classes' : '/instructor'} 
              className="btn-primary inline-flex items-center gap-2 px-8 py-4"
            >
              {activeTab === 'students' ? 'Find a class' : 'Start teaching'}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Classes Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-medium text-charcoal mb-2">
                Featured classes this week
              </h2>
              <p className="text-neutral-500 font-light">
                Book your next session with one of our amazing instructors
              </p>
            </div>
            <Link 
              href="/classes" 
              className="hidden md:inline-flex items-center gap-2 text-charcoal font-medium hover:text-neutral-600 transition-colors mt-4 md:mt-0"
            >
              View all classes
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loadingClasses ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
            </div>
          ) : featuredClasses.length === 0 ? (
            <div className="border border-neutral-200 p-12 text-center">
              <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
                <CalendarDaysIcon className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-medium text-charcoal mb-3">
                Classes dropping weekly
              </h3>
              <p className="text-neutral-500 font-light mb-6 max-w-md mx-auto">
                New yoga sessions are added regularly. Check back tomorrow or browse our full schedule.
              </p>
              <Link href="/classes" className="btn-primary inline-block px-6 py-3">
                Browse all classes
              </Link>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredClasses.map((yogaClass) => {
                  const spotsLeft = yogaClass.max_capacity - yogaClass.booking_count
                  const isFull = spotsLeft <= 0

                  return (
                    <Link
                      key={yogaClass.id}
                      href={`/book/${yogaClass.id}`}
                      className="group block"
                    >
                      <div className={`border p-6 transition-all duration-300 h-full ${
                        isFull 
                          ? 'border-neutral-100 bg-neutral-50' 
                          : 'border-neutral-200 hover:border-charcoal'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className={`text-lg font-medium mb-1 ${
                              isFull ? 'text-neutral-400' : 'text-charcoal group-hover:text-neutral-600'
                            } transition-colors`}>
                              {yogaClass.title}
                            </h3>
                            <p className="text-sm text-neutral-500 font-light">
                              {yogaClass.instructor.first_name} {yogaClass.instructor.last_name}
                            </p>
                          </div>
                          <div className={`text-lg font-medium ${isFull ? 'text-neutral-400' : 'text-charcoal'}`}>
                            {formatPrice(yogaClass.price_cents, yogaClass.is_donation)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                          <div className="flex items-center gap-1.5">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span className="font-light">{formatDate(yogaClass.time_slot.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="w-4 h-4" />
                            <span className="font-light">{formatTime(yogaClass.time_slot.start_time)}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-100">
                          {isFull ? (
                            <span className="text-sm text-neutral-400 font-medium">Class full</span>
                          ) : (
                            <span className="text-sm text-charcoal font-medium group-hover:underline">
                              Book now →
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              
              <div className="text-center mt-10 md:hidden">
                <Link 
                  href="/classes" 
                  className="btn-secondary inline-flex items-center gap-2 px-6 py-3"
                >
                  View all classes
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-medium text-charcoal mb-4">
            Ready to start your practice?
          </h2>
          <p className="text-lg text-neutral-500 font-light mb-10 max-w-2xl mx-auto">
            Whether you&apos;re looking to take a class or teach one, PickUp makes it simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/classes" className="btn-primary text-center px-8 py-4">
              Find a class
            </Link>
            <Link href="/instructor" className="btn-secondary text-center px-8 py-4">
              Teach a class
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="text-2xl font-medium tracking-tight mb-4">
                PickUp
              </div>
              <p className="text-neutral-400 text-sm font-light leading-relaxed">
                A yoga studio where art, movement, and community come together.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm uppercase tracking-wider mb-4 text-neutral-300">Students</h4>
              <ul className="space-y-3 text-neutral-400 text-sm font-light">
                <li><Link href="/classes" className="hover:text-white transition-colors">Browse Classes</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm uppercase tracking-wider mb-4 text-neutral-300">Instructors</h4>
              <ul className="space-y-3 text-neutral-400 text-sm font-light">
                <li><Link href="/instructor" className="hover:text-white transition-colors">Start Teaching</Link></li>
                <li><Link href="/instructor/auth/login" className="hover:text-white transition-colors">Instructor Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm uppercase tracking-wider mb-4 text-neutral-300">Legal</h4>
              <ul className="space-y-3 text-neutral-400 text-sm font-light">
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-700 mt-12 pt-8 text-center text-neutral-500 text-sm font-light">
            © {new Date().getFullYear()} PickUp. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-neutral-200 p-4 z-40 shadow-lg">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Link 
            href="/classes" 
            className="flex-1 btn-primary text-center py-3 text-sm"
          >
            Find a class
          </Link>
          <Link 
            href="/instructor" 
            className="flex-1 btn-secondary text-center py-3 text-sm"
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
