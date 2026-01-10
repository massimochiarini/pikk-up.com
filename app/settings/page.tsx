'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDeleteAccount = async () => {
    if (!user) return

    setDeleteLoading(true)
    setDeleteError('')

    try {
      // Call the delete_user_account function from your database
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: user.id
      })

      if (error) throw error

      // Sign out after deletion
      await signOut()
      router.push('/')
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-5">
          {/* Account Section */}
          <div className="bg-gray-50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border-2 border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-5">Account</h2>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white transition-colors">
                  <div>
                    <div className="font-semibold text-black">Email</div>
                    <div className="text-sm text-gray-600 mt-1">{user?.email}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white transition-colors cursor-pointer group"
                     onClick={() => router.push('/profile')}>
                  <div>
                    <div className="font-semibold text-black">Edit Profile</div>
                    <div className="text-sm text-gray-600 mt-1">Update your personal information</div>
                  </div>
                  <button
                    className="text-sky-blue font-semibold text-lg group-hover:translate-x-1 transition-transform"
                  >
                    →
                  </button>
                </div>

                <div className="pt-2 px-4">
                  <button
                    onClick={signOut}
                    className="w-full bg-black text-white font-semibold py-3.5 px-6 rounded-lg hover:bg-gray-800 transition-all duration-200 hover:shadow-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-gray-50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border-2 border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-5">Support</h2>
              
              <div className="space-y-1">
                <a
                  href="mailto:massimochiarini25@gmail.com?subject=Pickup App Support"
                  className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white transition-all duration-200 group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-black">Contact Us</div>
                    <div className="text-sm text-gray-600 mt-1">Get help with your account</div>
                  </div>
                  <span className="text-gray-400 text-lg group-hover:translate-x-1 group-hover:text-black transition-all">→</span>
                </a>

                <a
                  href="https://yourwebsite.com/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white transition-all duration-200 group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-black">Help & FAQ</div>
                    <div className="text-sm text-gray-600 mt-1">Find answers to common questions</div>
                  </div>
                  <span className="text-gray-400 text-lg group-hover:translate-x-1 group-hover:text-black transition-all">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Legal Section */}
          <div className="bg-gray-50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border-2 border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-5">Legal</h2>
              
              <div className="space-y-1">
                <a
                  href="/legal/privacy"
                  className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white transition-all duration-200 group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-black">Privacy Policy</div>
                    <div className="text-sm text-gray-600 mt-1">How we handle your data</div>
                  </div>
                  <span className="text-gray-400 text-lg group-hover:translate-x-1 group-hover:text-black transition-all">→</span>
                </a>

                <a
                  href="/legal/terms"
                  className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white transition-all duration-200 group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-black">Terms of Service</div>
                    <div className="text-sm text-gray-600 mt-1">Rules and guidelines</div>
                  </div>
                  <span className="text-gray-400 text-lg group-hover:translate-x-1 group-hover:text-black transition-all">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-gray-50 rounded-xl shadow-md overflow-hidden border-2 border-red-200 transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-red-600 mb-5">Danger Zone</h2>
              
              <div>
                <div className="mb-4 px-4">
                  <div className="font-semibold text-black mb-2">Delete Account</div>
                  <div className="text-sm text-gray-600">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <div className="px-4">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      Delete My Account
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-5 mx-4">
                    <p className="text-red-800 font-semibold mb-3 text-base">
                      ⚠️ Are you absolutely sure?
                    </p>
                    <p className="text-sm text-red-700 mb-5 leading-relaxed">
                      This will permanently delete your account, all your games, messages, and profile data. 
                      This action cannot be undone.
                    </p>
                    
                    {deleteError && (
                      <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
                        {deleteError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteError('')
                        }}
                        className="flex-1 bg-white border-2 border-gray-300 text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        disabled={deleteLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* App Version */}
          <div className="text-center text-sm text-gray-500 pb-4">
            Pickup Web v1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}

