'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const pathname = usePathname()
  
  const isInstructor = pathname.startsWith('/instructor')

  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href={isInstructor ? '/instructor' : '/'} 
            className="text-2xl font-bold text-sage-700"
          >
            Pikk<span className="text-terracotta-500">Up</span>
            {isInstructor && (
              <span className="ml-2 text-sm font-normal text-sand-500">Instructor</span>
            )}
          </Link>
          
          <div className="flex items-center gap-6">
            {!isInstructor && (
              <Link
                href="/classes"
                className={`font-medium transition-colors ${
                  pathname === '/classes' 
                    ? 'text-sage-700' 
                    : 'text-sand-600 hover:text-sage-700'
                }`}
              >
                Classes
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
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white font-semibold text-sm">
                    {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
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
        </div>
      </div>
    </nav>
  )
}
