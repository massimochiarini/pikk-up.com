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
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link 
            href={isInstructor ? '/instructor' : '/'} 
            className="text-xl sm:text-2xl font-bold text-sage-700 flex-shrink-0"
          >
            Pikk<span className="text-terracotta-500">Up</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {!isInstructor && (
              <Link
                href="/classes"
                className={`font-medium transition-colors ${
                  pathname === '/classes' 
                    ? 'text-sage-700' 
                    : 'text-sand-600 hover:text-sage-700'
                }`}
              >
                Browse Classes
              </Link>
            )}
            
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-sand-200 animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                {isInstructor && profile?.is_instructor ? (
                  <>
                    <Link
                      href="/instructor/schedule"
                      className={`font-medium transition-colors ${
                        pathname === '/instructor/schedule' 
                          ? 'text-sage-700' 
                          : 'text-sand-600 hover:text-sage-700'
                      }`}
                    >
                      Schedule
                    </Link>
                    <Link
                      href="/instructor/my-classes"
                      className={`font-medium transition-colors ${
                        pathname === '/instructor/my-classes' 
                          ? 'text-sage-700' 
                          : 'text-sand-600 hover:text-sage-700'
                      }`}
                    >
                      My Classes
                    </Link>
                  </>
                ) : !isInstructor ? (
                  <Link
                    href="/my-classes"
                    className={`font-medium transition-colors ${
                      pathname === '/my-classes' 
                        ? 'text-sage-700' 
                        : 'text-sand-600 hover:text-sage-700'
                    }`}
                  >
                    My Classes
                  </Link>
                ) : null}
                
                <div className="flex items-center gap-3">
                  <Link
                    href={isInstructor ? '/instructor/profile' : '/profile'}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white font-semibold text-sm hover:from-sage-500 hover:to-sage-700 transition-all"
                    title="View Profile"
                  >
                    {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      signOut().catch(console.error)
                    }}
                    className="text-sand-600 hover:text-sage-700 text-sm font-medium transition-colors hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-sand-600 hover:text-sage-700 font-medium transition-colors"
                >
                  Sign In
                </Link>
                {!isInstructor && (
                  <Link href="/instructor" className="btn-primary text-sm">
                    I&apos;m an Instructor
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-sand-200 animate-pulse"></div>
            ) : user ? (
              <>
                <Link
                  href={isInstructor ? '/instructor/profile' : '/profile'}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white font-semibold text-xs hover:from-sage-500 hover:to-sage-700 transition-all"
                  title="View Profile"
                >
                  {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-sand-600 hover:text-sage-700"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-sand-600 hover:text-sage-700 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                {!isInstructor && (
                  <Link href="/instructor" className="btn-primary text-xs px-3 py-2">
                    Instructor
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-sand-200 py-3 space-y-2">
            {!isInstructor && (
              <Link
                href="/classes"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 px-2 rounded-lg font-medium transition-colors ${
                  pathname === '/classes' 
                    ? 'text-sage-700 bg-sage-50' 
                    : 'text-sand-600 hover:text-sage-700 hover:bg-sand-50'
                }`}
              >
                Browse Classes
              </Link>
            )}
            
            {isInstructor && profile?.is_instructor ? (
              <>
                <Link
                  href="/instructor/schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 px-2 rounded-lg font-medium transition-colors ${
                    pathname === '/instructor/schedule' 
                      ? 'text-sage-700 bg-sage-50' 
                      : 'text-sand-600 hover:text-sage-700 hover:bg-sand-50'
                  }`}
                >
                  Schedule
                </Link>
                <Link
                  href="/instructor/my-classes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 px-2 rounded-lg font-medium transition-colors ${
                    pathname === '/instructor/my-classes' 
                      ? 'text-sage-700 bg-sage-50' 
                      : 'text-sand-600 hover:text-sage-700 hover:bg-sand-50'
                  }`}
                >
                  My Classes
                </Link>
              </>
            ) : !isInstructor ? (
              <Link
                href="/my-classes"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 px-2 rounded-lg font-medium transition-colors ${
                  pathname === '/my-classes' 
                    ? 'text-sage-700 bg-sage-50' 
                    : 'text-sand-600 hover:text-sage-700 hover:bg-sand-50'
                }`}
              >
                My Classes
              </Link>
            ) : null}
            
            <button
              onClick={(e) => {
                e.preventDefault()
                setMobileMenuOpen(false)
                signOut().catch(console.error)
              }}
              className="block w-full text-left py-2 px-2 rounded-lg text-sand-600 hover:text-sage-700 hover:bg-sand-50 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
