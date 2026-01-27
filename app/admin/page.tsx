'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase, type Profile } from '@/lib/supabase'
import { 
  CheckIcon, 
  XMarkIcon, 
  UserIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

type FilterType = 'all' | 'pending' | 'instructors' | 'students'

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchUsers = async (filterType: FilterType = filter) => {
    if (!user) return
    
    setLoading(true)
    setError('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('No session found')
        return
      }

      const response = await fetch(`/api/admin/users?filter=${filterType}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.users || [])
      
      // Also fetch pending count for the badge
      if (filterType !== 'pending') {
        const pendingResponse = await fetch('/api/admin/users?filter=pending', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const pendingData = await pendingResponse.json()
        setPendingCount(pendingData.users?.length || 0)
      } else {
        setPendingCount(data.users?.length || 0)
      }
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.is_admin])

  const handleAction = async (userId: string, action: string) => {
    if (!user) return
    
    setActionLoading(userId)
    setError('')
    setSuccess('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, action })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Action failed')
      }

      setSuccess(`Successfully ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'updated'} user`)
      
      // Refresh the list
      await fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Action error:', err)
      setError(err.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(query) ||
      u.first_name.toLowerCase().includes(query) ||
      u.last_name.toLowerCase().includes(query)
    )
  })

  // Not logged in or not admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
              <ShieldCheckIcon className="w-8 h-8 text-neutral-400" />
            </div>
            <h1 className="text-3xl font-light text-charcoal mb-4">Admin Access Required</h1>
            <p className="text-neutral-500 font-light">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-light text-charcoal">Admin Dashboard</h1>
          <p className="text-neutral-500 font-light mt-1">
            Manage users and instructor requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-neutral-200 p-4">
            <div className="text-2xl font-light text-charcoal">{pendingCount}</div>
            <div className="text-sm text-neutral-500 font-light">Pending Requests</div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm mb-6 flex items-center gap-2">
            <CheckIcon className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
            {(['pending', 'instructors', 'students', 'all'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f)
                  fetchUsers(f)
                }}
                className={`px-4 py-2 text-sm font-light transition-colors whitespace-nowrap flex-shrink-0 ${
                  filter === f
                    ? 'bg-charcoal text-white'
                    : 'border border-neutral-200 text-neutral-600 hover:border-charcoal'
                }`}
              >
                {f === 'pending' && pendingCount > 0 && (
                  <span className="inline-block w-5 h-5 bg-red-500 text-white text-xs rounded-full mr-2 leading-5">
                    {pendingCount}
                  </span>
                )}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <button
              onClick={() => fetchUsers()}
              className="btn-secondary flex items-center justify-center gap-2 px-4 py-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Users List - Mobile Cards / Desktop Table */}
        <div className="border border-neutral-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 font-light">
              {filter === 'pending' ? 'No pending instructor requests' : 'No users found'}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-neutral-100">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="p-4 space-y-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center text-charcoal font-light text-lg flex-shrink-0">
                        {u.first_name?.[0] || u.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-charcoal">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="text-sm text-neutral-500 truncate">{u.email}</div>
                        {u.phone && (
                          <div className="text-xs text-neutral-400">{u.phone}</div>
                        )}
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {u.is_admin && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs">
                          <ShieldCheckIcon className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                      {u.is_instructor ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-charcoal text-white text-xs">
                          <AcademicCapIcon className="w-3 h-3" />
                          Instructor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 border border-neutral-200 text-neutral-600 text-xs">
                          <UserIcon className="w-3 h-3" />
                          Student
                        </span>
                      )}
                      {u.instructor_status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs">
                          Pending
                        </span>
                      )}
                      {u.instructor_status === 'rejected' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs">
                          Rejected
                        </span>
                      )}
                    </div>

                    {/* Bio (if exists) */}
                    {u.bio && (
                      <div className="text-sm text-neutral-500 line-clamp-2">
                        {u.bio}
                      </div>
                    )}
                    {u.instagram && (
                      <div className="text-xs text-neutral-400">@{u.instagram}</div>
                    )}

                    {/* Action Buttons - Full Width for Easy Tapping */}
                    <div className="flex flex-col gap-2">
                      {u.instructor_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(u.id, 'approve')}
                            disabled={actionLoading === u.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-base font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === u.id ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <CheckIcon className="w-5 h-5" />
                                Approve Instructor
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleAction(u.id, 'reject')}
                            disabled={actionLoading === u.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white text-base font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XMarkIcon className="w-5 h-5" />
                            Reject Request
                          </button>
                        </>
                      )}
                      {!u.is_instructor && u.instructor_status !== 'pending' && (
                        <button
                          onClick={() => handleAction(u.id, 'make_instructor')}
                          disabled={actionLoading === u.id}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 text-base hover:border-charcoal transition-colors disabled:opacity-50"
                        >
                          {actionLoading === u.id ? (
                            <div className="w-5 h-5 border-2 border-neutral-300 border-t-charcoal rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <AcademicCapIcon className="w-5 h-5" />
                              Make Instructor
                            </>
                          )}
                        </button>
                      )}
                      {u.is_instructor && u.id !== user?.id && (
                        <button
                          onClick={() => handleAction(u.id, 'revoke')}
                          disabled={actionLoading === u.id}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 text-base hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Revoke Instructor
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">User</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">Bio</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center text-charcoal font-light">
                              {u.first_name?.[0] || u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-charcoal">
                                {u.first_name} {u.last_name}
                              </div>
                              <div className="text-sm text-neutral-500">{u.email}</div>
                              {u.phone && (
                                <div className="text-xs text-neutral-400">{u.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.is_admin && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs">
                                <ShieldCheckIcon className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                            {u.is_instructor ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-charcoal text-white text-xs">
                                <AcademicCapIcon className="w-3 h-3" />
                                Instructor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 border border-neutral-200 text-neutral-600 text-xs">
                                <UserIcon className="w-3 h-3" />
                                Student
                              </span>
                            )}
                            {u.instructor_status === 'pending' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs">
                                Pending
                              </span>
                            )}
                            {u.instructor_status === 'rejected' && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs">
                                Rejected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-neutral-500 max-w-xs truncate">
                            {u.bio || '-'}
                          </div>
                          {u.instagram && (
                            <div className="text-xs text-neutral-400">@{u.instagram}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {u.instructor_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAction(u.id, 'approve')}
                                  disabled={actionLoading === u.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  <CheckIcon className="w-4 h-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleAction(u.id, 'reject')}
                                  disabled={actionLoading === u.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            )}
                            {!u.is_instructor && u.instructor_status !== 'pending' && (
                              <button
                                onClick={() => handleAction(u.id, 'make_instructor')}
                                disabled={actionLoading === u.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-200 text-sm hover:border-charcoal transition-colors disabled:opacity-50"
                              >
                                <AcademicCapIcon className="w-4 h-4" />
                                Make Instructor
                              </button>
                            )}
                            {u.is_instructor && u.id !== user?.id && (
                              <button
                                onClick={() => handleAction(u.id, 'revoke')}
                                disabled={actionLoading === u.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                Revoke Instructor
                              </button>
                            )}
                            {actionLoading === u.id && (
                              <div className="w-5 h-5 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
