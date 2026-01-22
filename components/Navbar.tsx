'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { usePathname } from 'next/navigation'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isInstructor = pathname.startsWith('/instructor')

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link 
            href={isInstructor ? '/instructor' : '/'} 
            className="text-xl sm:text-2xl font-light tracking-tight text-charcoal flex-shrink-0"
          >
            PikkUp
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isInstructor && (
              <Link
                href="/classes"
                className={`font-light transition-colors ${
                  pathname === '/classes' 
                    ? 'text-charcoal' 
                    : 'text-neutral-500 hover:text-charcoal'
                }`}
              >
                Classes
              </Link>
            )}
            
            {loading ? (
              <div className="w-8 h-8 bg-neutral-100 animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-6">
                {isInstructor && profile?.is_instructor ? (
                  <>
                    <Link
                      href="/instructor/schedule"
                      className={`font-light transition-colors ${
                        pathname === '/instructor/schedule' 
                          ? 'text-charcoal' 
                          : 'text-neutral-500 hover:text-charcoal'
                      }`}
                    >
                      Schedule
                    </Link>
                    <Link
                      href="/instructor/my-classes"
                      className={`font-light transition-colors ${
                        pathname === '/instructor/my-classes' 
                          ? 'text-charcoal' 
                          : 'text-neutral-500 hover:text-charcoal'
                      }`}
                    >
                      My Classes
                    </Link>
                    <Link
                      href="/instructor/packages"
                      className={`font-light transition-colors ${
                        pathname === '/instructor/packages' 
                          ? 'text-charcoal' 
                          : 'text-neutral-500 hover:text-charcoal'
                      }`}
                    >
                      Packages
                    </Link>
                  </>
                ) : !isInstructor ? (
                  <Link
                    href="/my-classes"
                    className={`font-light transition-colors ${
                      pathname === '/my-classes' 
                        ? 'text-charcoal' 
                        : 'text-neutral-500 hover:text-charcoal'
                    }`}
                  >
                    My Classes
                  </Link>
                ) : null}
                
                <div className="flex items-center gap-4">
                  <Link
                    href={isInstructor ? '/instructor/profile' : '/profile'}
                    className="w-9 h-9 border border-neutral-200 flex items-center justify-center text-charcoal font-light text-sm hover:border-charcoal transition-colors"
                    title="View Profile"
                  >
                    {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      signOut().catch(console.error)
                    }}
                    className="text-neutral-500 hover:text-charcoal text-sm font-light transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-neutral-500 hover:text-charcoal font-light transition-colors"
                >
                  Sign In
                </Link>
                {!isInstructor && (
                  <Link href="/instructor" className="btn-primary text-sm px-4 py-2">
                    Teach
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 bg-neutral-100 animate-pulse"></div>
            ) : user ? (
              <>
                <Link
                  href={isInstructor ? '/instructor/profile' : '/profile'}
                  className="w-8 h-8 border border-neutral-200 flex items-center justify-center text-charcoal font-light text-xs hover:border-charcoal transition-colors"
                  title="View Profile"
                >
                  {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1 text-neutral-500 hover:text-charcoal"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-neutral-500 hover:text-charcoal text-sm font-light transition-colors"
                >
                  Sign In
                </Link>
                {!isInstructor && (
                  <Link href="/instructor" className="btn-primary text-xs px-3 py-2">
                    Teach
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-neutral-100 py-4 space-y-1">
            {!isInstructor && (
              <Link
                href="/classes"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 font-light transition-colors ${
                  pathname === '/classes' 
                    ? 'text-charcoal' 
                    : 'text-neutral-500 hover:text-charcoal'
                }`}
              >
                Classes
              </Link>
            )}
            
            {isInstructor && profile?.is_instructor ? (
              <>
                <Link
                  href="/instructor/schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 px-2 font-light transition-colors ${
                    pathname === '/instructor/schedule' 
                      ? 'text-charcoal' 
                      : 'text-neutral-500 hover:text-charcoal'
                  }`}
                >
                  Schedule
                </Link>
                <Link
                  href="/instructor/my-classes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 px-2 font-light transition-colors ${
                    pathname === '/instructor/my-classes' 
                      ? 'text-charcoal' 
                      : 'text-neutral-500 hover:text-charcoal'
                  }`}
                >
                  My Classes
                </Link>
                <Link
                  href="/instructor/packages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 px-2 font-light transition-colors ${
                    pathname === '/instructor/packages' 
                      ? 'text-charcoal' 
                      : 'text-neutral-500 hover:text-charcoal'
                  }`}
                >
                  Packages
                </Link>
              </>
            ) : !isInstructor ? (
              <Link
                href="/my-classes"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 font-light transition-colors ${
                  pathname === '/my-classes' 
                    ? 'text-charcoal' 
                    : 'text-neutral-500 hover:text-charcoal'
                }`}
              >
                My Classes
              </Link>
            ) : null}
            
            <div className="border-t border-neutral-100 pt-3 mt-3">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setMobileMenuOpen(false)
                  signOut().catch(console.error)
                }}
                className="block w-full text-left py-3 px-2 text-neutral-500 hover:text-charcoal font-light transition-colors"
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
