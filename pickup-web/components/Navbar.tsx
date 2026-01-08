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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="text-2xl font-bold text-navy">
            Pick<span className="text-neon-green">up</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/home"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/home')
                  ? 'bg-neon-green text-navy'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            <Link
              href="/my-games"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/my-games')
                  ? 'bg-neon-green text-navy'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              My Classes
            </Link>
            <Link
              href="/messages"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/messages')
                  ? 'bg-neon-green text-navy'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Messages
            </Link>
            <Link
              href="/profile"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/profile')
                  ? 'bg-neon-green text-navy'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Profile
            </Link>
          </div>

          {/* Book Session Button & User Menu */}
          <div className="flex items-center space-x-4">
            <Link
              href="/create-game"
              className="btn-primary text-sm px-4 py-2"
            >
              + Book Session
            </Link>
            
            <div className="relative group">
              <button className="flex items-center space-x-2 hover:opacity-80">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold">
                  {profile?.first_name?.[0] || 'U'}
                </div>
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link
                  href="/profile"
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                >
                  View Profile
                </Link>
                <Link
                  href="/analytics"
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                >
                  📊 Analytics
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                >
                  Settings
                </Link>
                <button
                  onClick={signOut}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-around pb-2">
          <Link
            href="/home"
            className={`flex flex-col items-center px-3 py-1 rounded ${
              isActive('/home') ? 'text-neon-green' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/my-games"
            className={`flex flex-col items-center px-3 py-1 rounded ${
              isActive('/my-games') ? 'text-neon-green' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">📚</span>
            <span className="text-xs">Classes</span>
          </Link>
          <Link
            href="/analytics"
            className={`flex flex-col items-center px-3 py-1 rounded ${
              isActive('/analytics') ? 'text-neon-green' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="text-xs">Analytics</span>
          </Link>
          <Link
            href="/messages"
            className={`flex flex-col items-center px-3 py-1 rounded ${
              isActive('/messages') ? 'text-neon-green' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">💬</span>
            <span className="text-xs">Messages</span>
          </Link>
          <Link
            href="/profile"
            className={`flex flex-col items-center px-3 py-1 rounded ${
              isActive('/profile') ? 'text-neon-green' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

