'use client'

import { useAuth } from './AuthProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="text-2xl font-semibold tracking-wide text-black hover:opacity-70 transition-opacity">
            Pick Up
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/home"
              className={`px-5 py-2 rounded-full font-semibold tracking-wide transition-all duration-300 ${
                isActive('/home')
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            <Link
              href="/my-games"
              className={`px-5 py-2 rounded-full font-semibold tracking-wide transition-all duration-300 ${
                isActive('/my-games')
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              My Classes
            </Link>
            {profile?.is_instructor && (
              <Link
                href="/text-blast"
                className={`px-5 py-2 rounded-full font-semibold tracking-wide transition-all duration-300 ${
                  isActive('/text-blast')
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                Text Blast
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="flex items-center space-x-2 hover:opacity-70 transition-opacity">
                 {profile?.avatar_url ? (
                   <img 
                     src={profile.avatar_url} 
                     alt="Profile" 
                     className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 hover:border-black transition-colors"
                   />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-black font-semibold border-2 border-gray-300 hover:border-black transition-colors">
                     {profile?.first_name?.[0] || 'U'}
                   </div>
                 )}
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white backdrop-blur-xl rounded-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl">
                <Link
                  href="/profile"
                  className="block px-4 py-3 hover:bg-gray-50 text-black font-semibold border-b border-gray-200 transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-3 hover:bg-gray-50 text-black font-semibold border-b border-gray-200 transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={signOut}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600 font-semibold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-around py-3 border-t border-gray-200">
          <Link
            href="/home"
            className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
              isActive('/home') ? 'text-black' : 'text-gray-400'
            }`}
          >
            <span className="text-xl mb-1">🏠</span>
            <span className="text-xs font-semibold tracking-wide">Home</span>
          </Link>
          <Link
            href="/my-games"
            className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
              isActive('/my-games') ? 'text-black' : 'text-gray-400'
            }`}
          >
            <span className="text-xl mb-1">📚</span>
            <span className="text-xs font-semibold tracking-wide">Classes</span>
          </Link>
          {profile?.is_instructor && (
            <Link
              href="/text-blast"
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
                isActive('/text-blast') ? 'text-black' : 'text-gray-400'
              }`}
            >
              <span className="text-xl mb-1">📱</span>
              <span className="text-xs font-semibold tracking-wide">Text Blast</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

