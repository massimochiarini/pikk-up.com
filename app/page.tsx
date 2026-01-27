import Link from 'next/link'
import Image from 'next/image'
import { HeroSection } from '@/components/HeroSection'
import { ImageBreak } from '@/components/ImageBreak'
import { CalendarDaysIcon, CreditCardIcon, SparklesIcon, UserGroupIcon, DevicePhoneMobileIcon, TicketIcon } from '@heroicons/react/24/outline'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/" className="text-xl sm:text-2xl font-light tracking-tight text-charcoal flex-shrink-0">
              PikkUp
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-8">
              <Link
                href="/classes"
                className="text-neutral-600 hover:text-charcoal font-light transition-colors"
              >
                Classes
              </Link>
              <Link
                href="/auth/login"
                className="text-neutral-600 hover:text-charcoal font-light transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/instructor"
                className="btn-primary text-sm px-5 py-2"
              >
                Teach
              </Link>
            </div>
            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-4">
              <Link
                href="/classes"
                className="text-neutral-600 hover:text-charcoal text-sm font-light transition-colors"
              >
                Classes
              </Link>
              <Link
                href="/auth/login"
                className="text-neutral-600 hover:text-charcoal text-sm font-light transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Artwork */}
      <HeroSection
        imageSrc="/gallery/1.jpg"
        imageNumber={1}
        overlay="light"
        height="screen"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-charcoal mb-6">
            Find your flow
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 font-light">
            The yoga booking platform that connects you with local instructors and classes in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/classes" className="btn-primary text-center px-8 py-4">
              Explore Classes
            </Link>
            <Link href="/auth/signup" className="btn-secondary text-center px-8 py-4">
              Create Account
            </Link>
          </div>
        </div>
      </HeroSection>

      {/* How It Works */}
      <section className="gallery-section px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">How It Works</h2>
            <p className="text-lg text-neutral-500 font-light">
              Book your next yoga class in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            <div className="text-center">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
                <CalendarDaysIcon className="w-6 h-6 text-charcoal" />
              </div>
              <h3 className="text-lg font-medium mb-3 text-charcoal">Browse</h3>
              <p className="text-neutral-500 font-light leading-relaxed">
                Explore our curated selection of yoga classes taught by certified instructors.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
                <CreditCardIcon className="w-6 h-6 text-charcoal" />
              </div>
              <h3 className="text-lg font-medium mb-3 text-charcoal">Book</h3>
              <p className="text-neutral-500 font-light leading-relaxed">
                Reserve your spot with secure payment. Receive instant confirmation via text.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-6 h-6 text-charcoal" />
              </div>
              <h3 className="text-lg font-medium mb-3 text-charcoal">Practice</h3>
              <p className="text-neutral-500 font-light leading-relaxed">
                Arrive at the studio ready to flow. We handle all the details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Break */}
      <ImageBreak imageSrc="/gallery/5.jpg" imageNumber={5} height="large" />

      {/* What is PikkUp Section */}
      <section className="gallery-section px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  <Image
                    src="/gallery/6.jpg"
                    alt="Untitled 06"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="gallery-caption text-center">
                  Untitled 06
                </figcaption>
              </figure>
            </div>
            <div className="order-1 md:order-2 space-y-8">
              <div>
                <h2 className="section-title mb-4">The easiest way to find and book yoga</h2>
                <p className="text-lg text-neutral-500 font-light leading-relaxed">
                  PikkUp is a booking platform that connects you with certified local instructors. 
                  Browse classes, book instantly, and build your practice.
                </p>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                    <UserGroupIcon className="w-5 h-5 text-charcoal" />
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal mb-1">Discover local classes</h3>
                    <p className="text-neutral-500 font-light text-sm">
                      Find yoga classes taught by certified instructors in your area.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-charcoal" />
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal mb-1">Book instantly</h3>
                    <p className="text-neutral-500 font-light text-sm">
                      Secure payment and instant SMS confirmation for every booking.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                    <TicketIcon className="w-5 h-5 text-charcoal" />
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal mb-1">Build your practice</h3>
                    <p className="text-neutral-500 font-light text-sm">
                      Save with class packages and credits from your favorite instructors.
                    </p>
                  </div>
                </div>
              </div>
              
              <Link href="/classes" className="btn-primary inline-block px-8 py-4">
                Browse Classes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor CTA */}
      <section className="gallery-section px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="section-title mb-4">Teach with us</h2>
          <p className="text-lg text-neutral-500 font-light mb-8 max-w-2xl mx-auto">
            Share your practice in our studio. Pick available time slots, 
            set your prices, and we handle the rest.
          </p>
          <Link href="/instructor/auth/login" className="btn-primary inline-block px-8 py-4">
            Start Teaching
          </Link>
        </div>
      </section>

      {/* Image Break */}
      <ImageBreak imageSrc="/gallery/8.jpg" imageNumber={8} height="medium" />

      {/* Footer */}
      <footer className="bg-charcoal text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="text-2xl font-light tracking-tight mb-4">
                PikkUp
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
                <li><Link href="/instructor" className="hover:text-white transition-colors">Instructor Portal</Link></li>
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
            © {new Date().getFullYear()} PikkUp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
