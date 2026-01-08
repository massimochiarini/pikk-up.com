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
    <nav className="bg-black/95 backdrop-blur-sm border-b border-gray-900 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="text-2xl font-light tracking-wider text-white hover:opacity-80 transition-opacity">
            Pick Up
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/home"
              className={`px-5 py-2 rounded-full font-light tracking-wide transition-all duration-300 ${
                isActive('/home')
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </Link>
            <Link
              href="/my-games"
              className={`px-5 py-2 rounded-full font-light tracking-wide transition-all duration-300 ${
                isActive('/my-games')
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              My Classes
            </Link>
            <Link
              href="/messages"
              className={`px-5 py-2 rounded-full font-light tracking-wide transition-all duration-300 ${
                isActive('/messages')
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Messages
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="flex items-center space-x-2 hover:opacity-70 transition-opacity">
                 {profile?.avatar_url ? (
                   <img 
                     src={profile.avatar_url} 
                     alt="Profile" 
                     className="w-10 h-10 rounded-full object-cover border-2 border-gray-700 hover:border-gray-500 transition-colors"
                   />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-light border-2 border-gray-700 hover:border-gray-500 transition-colors">
                     {profile?.first_name?.[0] || 'U'}
                   </div>
                 )}
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 backdrop-blur-xl rounded-xl border border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl">
                <Link
                  href="/profile"
                  className="block px-4 py-3 hover:bg-white/5 text-white font-light border-b border-gray-800 transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-3 hover:bg-white/5 text-white font-light border-b border-gray-800 transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={signOut}
                  className="block w-full text-left px-4 py-3 hover:bg-white/5 text-red-400 font-light transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-around py-3 border-t border-gray-900">
          <Link
            href="/home"
            className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
              isActive('/home') ? 'text-white' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">🏠</span>
            <span className="text-xs font-light tracking-wide">Home</span>
          </Link>
          <Link
            href="/my-games"
            className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
              isActive('/my-games') ? 'text-white' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">📚</span>
            <span className="text-xs font-light tracking-wide">Classes</span>
          </Link>
          <Link
            href="/messages"
            className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
              isActive('/messages') ? 'text-white' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">💬</span>
            <span className="text-xs font-light tracking-wide">Messages</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

