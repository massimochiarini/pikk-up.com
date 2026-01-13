import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-sand-50 to-sage-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-sage-700">
              Pikk<span className="text-terracotta-500">Up</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/classes"
                className="text-sage-700 hover:text-sage-900 font-medium transition-colors"
              >
                Browse Classes
              </Link>
              <Link
                href="/auth/login"
                className="text-sage-600 hover:text-sage-800 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/instructor"
                className="btn-primary text-sm"
              >
                I&apos;m an Instructor
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-sage-500 rounded-full animate-pulse"></span>
                Live classes available now
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Find your
                <span className="block text-sage-600">perfect flow</span>
              </h1>
              
              <p className="text-xl text-sand-700 max-w-xl">
                Book yoga classes with incredible local instructors. 
                Transform your practice in a welcoming studio space designed for connection and growth.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/classes" className="btn-primary text-center text-lg px-8 py-4">
                  Explore Classes
                </Link>
                <Link href="/auth/signup" className="btn-secondary text-center text-lg px-8 py-4">
                  Create Account
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-sage-200 rounded-full blur-3xl opacity-60"></div>
              <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-terracotta-200 rounded-full blur-3xl opacity-40"></div>
              <div className="relative bg-gradient-to-br from-sage-100 to-sand-100 rounded-3xl p-8 shadow-xl">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center">
                  <span className="text-9xl">🧘</span>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-charcoal">Sunrise Flow</span>
                    <span className="text-sage-600 font-medium">$25</span>
                  </div>
                  <div className="flex items-center gap-2 text-sand-600 text-sm">
                    <span>Tomorrow, 7:00 AM</span>
                    <span>•</span>
                    <span>8 spots left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-sand-600 max-w-2xl mx-auto">
              Book your next yoga class in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Browse Classes</h3>
              <p className="text-sand-600">
                Explore our curated selection of yoga classes taught by certified instructors.
              </p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-terracotta-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Book & Pay</h3>
              <p className="text-sand-600">
                Reserve your spot with secure payment. Receive instant confirmation via text.
              </p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-sand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🧘</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Show Up & Flow</h3>
              <p className="text-sand-600">
                Arrive at the studio ready to practice. We handle all the details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Instructors CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-sage-600 to-sage-700 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Are you a yoga instructor?
            </h2>
            <p className="text-sage-100 text-lg mb-8 max-w-2xl mx-auto">
              Teach at our studio and grow your community. Pick available time slots, 
              set your prices, and we handle the rest.
            </p>
            <Link
              href="/instructor/auth/login"
              className="inline-block bg-white text-sage-700 font-semibold px-8 py-4 rounded-xl hover:bg-sage-50 transition-colors"
            >
              Start Teaching
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">
                Pikk<span className="text-terracotta-400">Up</span>
              </div>
              <p className="text-sand-400 text-sm">
                Your local yoga studio marketplace. 
                Connecting students with amazing instructors.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sand-400 text-sm">
                <li><Link href="/classes" className="hover:text-white transition-colors">Browse Classes</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Instructors</h4>
              <ul className="space-y-2 text-sand-400 text-sm">
                <li><Link href="/instructor" className="hover:text-white transition-colors">Instructor Portal</Link></li>
                <li><Link href="/instructor/auth/login" className="hover:text-white transition-colors">Instructor Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sand-400 text-sm">
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-sand-800 mt-12 pt-8 text-center text-sand-500 text-sm">
            © {new Date().getFullYear()} PikkUp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
