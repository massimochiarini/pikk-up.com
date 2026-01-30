'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './AuthProvider'
import { usePathname } from 'next/navigation'

// Nav link with underline reveal animation
function NavLink({ href, active, children, onClick }: { 
  href: string
  active: boolean
  children: React.ReactNode
  onClick?: () => void 
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative tracking-wide transition-colors duration-300 ${
        active ? 'text-stone-800' : 'text-stone-500 hover:text-stone-700'
      }`}
    >
      {children}
      <motion.span 
        className="absolute left-0 -bottom-0.5 h-px bg-stone-700"
        initial={{ width: 0 }}
        animate={{ width: active ? '100%' : 0 }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </Link>
  )
}

// Mobile nav link
function MobileNavLink({ href, active, children, onClick }: { 
  href: string
  active: boolean
  children: React.ReactNode
  onClick?: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={href}
        onClick={onClick}
        className={`block py-3 tracking-wide transition-colors duration-300 ${
          active ? 'text-stone-800' : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        {children}
      </Link>
    </motion.div>
  )
}

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isInstructor = pathname.startsWith('/instructor')

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-glass border-b border-stone-100/50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - understated wordmark */}
          <Link 
            href={isInstructor ? '/instructor' : '/'} 
            className="text-stone-500 tracking-wide text-lg transition-colors duration-300 hover:text-stone-700"
          >
            PickUp
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {/* Classes link */}
            {(!isInstructor || profile?.is_instructor) && (
              <NavLink href="/classes" active={pathname === '/classes'}>
                classes
              </NavLink>
            )}
            
            {loading ? (
              <div className="w-8 h-8 bg-stone-100 animate-pulse rounded-sm" />
            ) : user ? (
              <div className="flex items-center gap-8">
                {/* My Bookings */}
                <NavLink href="/my-classes" active={pathname === '/my-classes'}>
                  my bookings
                </NavLink>
                
                {/* Instructor-specific links */}
                {profile?.is_instructor && (
                  <>
                    <span className="w-px h-4 bg-stone-200" />
                    <NavLink 
                      href="/instructor" 
                      active={pathname === '/instructor' && !pathname.includes('/instructor/')}
                    >
                      dashboard
                    </NavLink>
                    {isInstructor && (
                      <>
                        <NavLink href="/instructor/schedule" active={pathname === '/instructor/schedule'}>
                          schedule
                        </NavLink>
                        <NavLink href="/instructor/my-classes" active={pathname === '/instructor/my-classes'}>
                          my classes
                        </NavLink>
                        <NavLink href="/instructor/packages" active={pathname === '/instructor/packages'}>
                          packages
                        </NavLink>
                      </>
                    )}
                  </>
                )}
                
                {/* Admin link */}
                {profile?.is_admin && (
                  <>
                    <span className="w-px h-4 bg-stone-200" />
                    <NavLink href="/admin" active={pathname === '/admin'}>
                      admin
                    </NavLink>
                  </>
                )}
                
                <div className="flex items-center gap-6">
                  <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                    <Link
                      href={isInstructor ? '/instructor/profile' : '/profile'}
                      className="w-9 h-9 border border-stone-200 flex items-center justify-center text-stone-600 text-sm tracking-wide hover:border-stone-400 transition-colors duration-300"
                      title="View Profile"
                    >
                      {profile?.first_name?.[0]?.toLowerCase() || user.email?.[0]?.toLowerCase() || 'u'}
                    </Link>
                  </motion.div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      signOut().catch(console.error)
                    }}
                    className="text-stone-400 hover:text-stone-600 text-sm tracking-wide transition-colors duration-300"
                  >
                    sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-stone-400 hover:text-stone-600 tracking-wide transition-colors duration-300"
                >
                  sign in
                </Link>
                {!isInstructor && (
                  <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                    <Link 
                      href="/instructor" 
                      className="text-stone-700 border border-stone-300 px-5 py-2.5 tracking-wide hover:border-stone-400 hover:bg-stone-50 transition-all duration-300"
                    >
                      teach
                    </Link>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 bg-stone-100 animate-pulse rounded-sm" />
            ) : user ? (
              <>
                <Link
                  href={isInstructor ? '/instructor/profile' : '/profile'}
                  className="w-8 h-8 border border-stone-200 flex items-center justify-center text-stone-600 text-xs tracking-wide hover:border-stone-400 transition-colors duration-300"
                  title="View Profile"
                >
                  {profile?.first_name?.[0]?.toLowerCase() || user.email?.[0]?.toLowerCase() || 'u'}
                </Link>
                <motion.button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-stone-600"
                  aria-label="Toggle menu"
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence mode="wait">
                    {mobileMenuOpen ? (
                      <motion.svg 
                        key="close"
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </motion.svg>
                    ) : (
                      <motion.svg 
                        key="menu"
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href={isInstructor ? '/instructor/auth/login' : '/auth/login'}
                  className="text-stone-400 hover:text-stone-600 text-sm tracking-wide transition-colors duration-300"
                >
                  sign in
                </Link>
                {!isInstructor && (
                  <Link 
                    href="/instructor" 
                    className="text-stone-700 text-sm border border-stone-300 px-4 py-2 tracking-wide hover:border-stone-400 transition-colors duration-300"
                  >
                    teach
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown with slide animation */}
        <AnimatePresence>
          {mobileMenuOpen && user && (
            <motion.div 
              className="md:hidden border-t border-stone-100 py-6 space-y-1 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <MobileNavLink 
                href="/classes" 
                active={pathname === '/classes'}
                onClick={() => setMobileMenuOpen(false)}
              >
                classes
              </MobileNavLink>
              
              <MobileNavLink 
                href="/my-classes" 
                active={pathname === '/my-classes'}
                onClick={() => setMobileMenuOpen(false)}
              >
                my bookings
              </MobileNavLink>
              
              {/* Instructor section */}
              {profile?.is_instructor && (
                <>
                  <motion.div 
                    className="border-t border-stone-100 pt-4 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="block text-xs tracking-wider text-stone-400 mb-3">instructor</span>
                  </motion.div>
                  <MobileNavLink 
                    href="/instructor" 
                    active={pathname === '/instructor'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    dashboard
                  </MobileNavLink>
                  <MobileNavLink 
                    href="/instructor/schedule" 
                    active={pathname === '/instructor/schedule'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    schedule
                  </MobileNavLink>
                  <MobileNavLink 
                    href="/instructor/my-classes" 
                    active={pathname === '/instructor/my-classes'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    my classes
                  </MobileNavLink>
                  <MobileNavLink 
                    href="/instructor/packages" 
                    active={pathname === '/instructor/packages'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    packages
                  </MobileNavLink>
                </>
              )}
              
              {/* Admin section */}
              {profile?.is_admin && (
                <>
                  <motion.div 
                    className="border-t border-stone-100 pt-4 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <span className="block text-xs tracking-wider text-stone-400 mb-3">admin</span>
                  </motion.div>
                  <MobileNavLink 
                    href="/admin" 
                    active={pathname === '/admin'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    manage users
                  </MobileNavLink>
                </>
              )}
              
              <motion.div 
                className="border-t border-stone-100 pt-4 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setMobileMenuOpen(false)
                    signOut().catch(console.error)
                  }}
                  className="block w-full text-left py-3 text-stone-400 hover:text-stone-600 tracking-wide transition-colors duration-300"
                >
                  sign out
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
