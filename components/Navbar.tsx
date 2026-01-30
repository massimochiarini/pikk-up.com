'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isInstructor = pathname.startsWith('/instructor')

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-stone-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - understated wordmark */}
          <Link 
            href={isInstructor ? '/instructor' : '/'} 
            className="text-gray tracking-wide text-lg"
          >
            PickUp
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {/* Classes link */}
            {(!isInstructor || profile?.is_instructor) && (
              <Link
                href="/classes"
                className={`tracking-wide transition-colors duration-300 ${
                  pathname === '/classes' 
                    ? 'text-gray' 
                    : 'text-stone-400 hover:text-gray'
                }`}
              >
                Classes
              </Link>
            )}
            
            {loading ? (
              <div className="w-8 h-8 bg-stone-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-8">
                {/* My Bookings */}
                <Link
                  href="/my-classes"
                  className={`tracking-wide transition-colors duration-300 ${
                    pathname === '/my-classes' 
                      ? 'text-gray' 
                      : 'text-stone-400 hover:text-gray'
                  }`}
                >
                  My Bookings
                </Link>
                
                {/* Instructor-specific links */}
                {profile?.is_instructor && (
                  <>
                    <span className="w-px h-4 bg-stone-200" />
                    <Link
                      href="/instructor"
                      className={`tracking-wide transition-colors duration-300 ${
                        pathname === '/instructor' && !pathname.includes('/instructor/') 
                          ? 'text-gray' 
                          : 'text-stone-400 hover:text-gray'
                      }`}
                    >
                      Dashboard
                    </Link>
                    {isInstructor && (
                      <>
                        <Link
                          href="/instructor/schedule"
                          className={`tracking-wide transition-colors duration-300 ${
                            pathname === '/instructor/schedule' 
                              ? 'text-gray' 
                              : 'text-stone-400 hover:text-gray'
                          }`}
                        >
                          Schedule
                        </Link>
                        <Link
                          href="/instructor/my-classes"
                          className={`tracking-wide transition-colors duration-300 ${
                            pathname === '/instructor/my-classes' 
                              ? 'text-gray' 
                              : 'text-stone-400 hover:text-gray'
                          }`}
                        >
                          My Classes
                        </Link>
                        <Link
                          href="/instructor/packages"
                          className={`tracking-wide transition-colors duration-300 ${
                            pathname === '/instructor/packages' 
                              ? 'text-gray' 
                              : 'text-stone-400 hover:text-gray'
                          }`}
                        >
                          Packages
                        </Link>
                      </>
                    )}
                  </>
                )}
                
                {/* Admin link */}
                {profile?.is_admin && (
                  <>
                    <span className="w-px h-4 bg-stone-200" />
                    <Link
                      href="/admin"
                      className={`tracking-wide transition-colors duration-300 ${
                        pathname === '/admin' 
                          ? 'text-gray' 
                          : 'text-stone-400 hover:text-gray'
                      }`}
                    >
                      Admin
                    </Link>
                  </>
                )}
                
                <div className="flex items-center gap-6">
                  <Link
                    href={isInstructor ? '/instructor/profile' : '/profile'}
                    className="w-9 h-9 border border-stone-200 flex items-center justify-center text-gray text-sm tracking-wide hover:border-gray transition-colors duration-300"
                    title="View Profile"
                  >
                    {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      signOut().catch(console.error)
                    }}
                    className="text-stone-400 hover:text-gray text-sm tracking-wide transition-colors duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-stone-400 hover:text-gray tracking-wide transition-colors duration-300"
                >
                  Sign in
                </Link>
                {!isInstructor && (
                  <Link 
                    href="/instructor" 
                    className="text-gray border border-gray px-5 py-2.5 tracking-wide hover:bg-stone-50 transition-colors duration-300"
                  >
                    Teach
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 bg-stone-100 animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href={isInstructor ? '/instructor/profile' : '/profile'}
                  className="w-8 h-8 border border-stone-200 flex items-center justify-center text-gray text-xs tracking-wide hover:border-gray transition-colors duration-300"
                  title="View Profile"
                >
                  {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-stone-400 hover:text-gray text-sm tracking-wide transition-colors duration-300"
                >
                  Sign in
                </Link>
                {!isInstructor && (
                  <Link 
                    href="/instructor" 
                    className="text-gray text-sm border border-gray px-4 py-2 tracking-wide"
                  >
                    Teach
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-stone-100 py-6 space-y-1">
            <Link
              href="/classes"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 tracking-wide transition-colors duration-300 ${
                pathname === '/classes' ? 'text-gray' : 'text-stone-400 hover:text-gray'
              }`}
            >
              Classes
            </Link>
            
            <Link
              href="/my-classes"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 tracking-wide transition-colors duration-300 ${
                pathname === '/my-classes' ? 'text-gray' : 'text-stone-400 hover:text-gray'
              }`}
            >
              My Bookings
            </Link>
            
            {/* Instructor section */}
            {profile?.is_instructor && (
              <>
                <div className="border-t border-stone-100 pt-4 mt-4">
                  <span className="block text-xs tracking-wider text-stone-400 mb-3">Instructor</span>
                </div>
                <Link
                  href="/instructor"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 tracking-wide transition-colors duration-300 ${
                    pathname === '/instructor' ? 'text-gray' : 'text-stone-400 hover:text-gray'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/instructor/schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 tracking-wide transition-colors duration-300 ${
                    pathname === '/instructor/schedule' ? 'text-gray' : 'text-stone-400 hover:text-gray'
                  }`}
                >
                  Schedule
                </Link>
                <Link
                  href="/instructor/my-classes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 tracking-wide transition-colors duration-300 ${
                    pathname === '/instructor/my-classes' ? 'text-gray' : 'text-stone-400 hover:text-gray'
                  }`}
                >
                  My Classes
                </Link>
                <Link
                  href="/instructor/packages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 tracking-wide transition-colors duration-300 ${
                    pathname === '/instructor/packages' ? 'text-gray' : 'text-stone-400 hover:text-gray'
                  }`}
                >
                  Packages
                </Link>
              </>
            )}
            
            {/* Admin section */}
            {profile?.is_admin && (
              <>
                <div className="border-t border-stone-100 pt-4 mt-4">
                  <span className="block text-xs tracking-wider text-stone-400 mb-3">Admin</span>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 tracking-wide transition-colors duration-300 ${
                    pathname === '/admin' ? 'text-gray' : 'text-stone-400 hover:text-gray'
                  }`}
                >
                  Manage Users
                </Link>
              </>
            )}
            
            <div className="border-t border-stone-100 pt-4 mt-4">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setMobileMenuOpen(false)
                  signOut().catch(console.error)
                }}
                className="block w-full text-left py-3 text-stone-400 hover:text-gray tracking-wide transition-colors duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
