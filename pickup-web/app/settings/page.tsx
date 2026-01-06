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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <div className="card">
            <h2 className="text-xl font-bold text-navy mb-4">Account</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">Edit Profile</div>
                  <div className="text-sm text-gray-500">Update your personal information</div>
                </div>
                <button
                  onClick={() => router.push('/profile')}
                  className="text-sky-blue font-semibold hover:underline"
                >
                  Edit →
                </button>
              </div>

              <div className="pt-3">
                <button
                  onClick={signOut}
                  className="btn-outline w-full"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="card">
            <h2 className="text-xl font-bold text-navy mb-4">Support</h2>
            
            <div className="space-y-4">
              <a
                href="mailto:massimochiarini25@gmail.com?subject=Pickup App Support"
                className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">Contact Us</div>
                  <div className="text-sm text-gray-500">Get help with your account</div>
                </div>
                <span>→</span>
              </a>

              <a
                href="https://yourwebsite.com/help"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">Help & FAQ</div>
                  <div className="text-sm text-gray-500">Find answers to common questions</div>
                </div>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Legal Section */}
          <div className="card">
            <h2 className="text-xl font-bold text-navy mb-4">Legal</h2>
            
            <div className="space-y-4">
              <a
                href="/legal/privacy"
                className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 -mx-6 px-6 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">Privacy Policy</div>
                  <div className="text-sm text-gray-500">How we handle your data</div>
                </div>
                <span>→</span>
              </a>

              <a
                href="/legal/terms"
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">Terms of Service</div>
                  <div className="text-sm text-gray-500">Rules and guidelines</div>
                </div>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-200">
            <h2 className="text-xl font-bold text-red-700 mb-4">Danger Zone</h2>
            
            <div>
              <div className="mb-4">
                <div className="font-medium text-gray-900 mb-1">Delete Account</div>
                <div className="text-sm text-gray-600">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Delete My Account
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-4">
                    ⚠️ Are you absolutely sure?
                  </p>
                  <p className="text-sm text-red-700 mb-4">
                    This will permanently delete your account, all your games, messages, and profile data. 
                    This action cannot be undone.
                  </p>
                  
                  {deleteError && (
                    <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded mb-4 text-sm">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteError('')
                      }}
                      className="btn-outline flex-1"
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* App Version */}
          <div className="text-center text-sm text-gray-500">
            Pickup Web v1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}

