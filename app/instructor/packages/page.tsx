'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { 
  RectangleStackIcon, 
  PlusIcon, 
  CheckIcon,
  XMarkIcon,
  UsersIcon,
  CurrencyDollarIcon,
  TicketIcon
} from '@heroicons/react/24/outline'

type PackageWithStats = {
  id: string
  instructor_id: string
  name: string
  description: string | null
  class_count: number
  price_cents: number
  is_active: boolean
  created_at: string
  total_purchases: number
  total_credits_used: number
  total_credits_remaining: number
}

export default function InstructorPackagesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [packages, setPackages] = useState<PackageWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [classCount, setClassCount] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/instructor/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !profile?.is_instructor) return
    fetchPackages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const fetchPackages = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/packages/manage?instructorId=${user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setPackages(data.packages || [])
      } else {
        setError(data.error || 'Failed to load packages')
      }
    } catch (err) {
      console.error('Error fetching packages:', err)
      setError('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !name || !classCount || !price) {
      setError('Please fill in all required fields')
      return
    }

    const classCountNum = parseInt(classCount, 10)
    const priceCents = Math.round(parseFloat(price) * 100)

    if (classCountNum < 1) {
      setError('Class count must be at least 1')
      return
    }

    if (priceCents < 0) {
      setError('Price cannot be negative')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/packages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: user.id,
          name: name.trim(),
          description: description.trim() || null,
          classCount: classCountNum,
          priceCents,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create package')
      }

      setSuccess('Package created successfully!')
      setShowCreateForm(false)
      setName('')
      setDescription('')
      setClassCount('')
      setPrice('')
      fetchPackages()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create package')
    } finally {
      setSaving(false)
    }
  }

  const togglePackageStatus = async (pkg: PackageWithStats) => {
    if (!user) return
    
    try {
      const response = await fetch('/api/packages/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          instructorId: user.id,
          updates: { is_active: !pkg.is_active },
        }),
      })

      if (response.ok) {
        fetchPackages()
      }
    } catch (err) {
      console.error('Error toggling package status:', err)
    }
  }

  const deletePackage = async (pkg: PackageWithStats) => {
    if (!user) return
    
    if (!confirm(`Are you sure you want to delete "${pkg.name}"?`)) return

    try {
      const response = await fetch(
        `/api/packages/manage?packageId=${pkg.id}&instructorId=${user.id}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to delete package')
        return
      }

      fetchPackages()
    } catch (err) {
      console.error('Error deleting package:', err)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`
  }

  const calculateSavings = (pkg: PackageWithStats, singleClassPrice: number = 2500) => {
    const perClassPrice = pkg.price_cents / pkg.class_count
    const savings = ((singleClassPrice - perClassPrice) / singleClassPrice) * 100
    return savings > 0 ? Math.round(savings) : 0
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !profile?.is_instructor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 font-light mb-4">Please sign in as an instructor.</p>
          <Link href="/instructor/auth/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-10 border-b border-neutral-100">
          <div>
            <h1 className="text-3xl font-light text-charcoal">Class Packages</h1>
            <p className="text-neutral-500 font-light mt-1">
              Create and manage class bundles for your students
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Package
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-6 flex items-center gap-2">
            <CheckIcon className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && !showCreateForm && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Create Package Form */}
        {showCreateForm && (
          <div className="border border-neutral-200 p-8 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-charcoal">Create New Package</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setError(null)
                }}
                className="text-neutral-400 hover:text-charcoal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePackage} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="label">Package Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 5 Class Bundle"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="classCount" className="label">Number of Classes *</label>
                  <input
                    type="number"
                    id="classCount"
                    value={classCount}
                    onChange={(e) => setClassCount(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 5"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="price" className="label">Package Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 100"
                  min="0"
                  step="0.01"
                  required
                />
                {classCount && price && parseInt(classCount) > 0 && parseFloat(price) > 0 && (
                  <p className="text-neutral-500 text-sm mt-2 font-light">
                    ${(parseFloat(price) / parseInt(classCount)).toFixed(2)} per class
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="label">Description (Optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="e.g., Save 20% when you buy 5 classes at once!"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Creating...' : 'Create Package'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setError(null)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Packages List */}
        {packages.length === 0 ? (
          <div className="border border-neutral-200 p-12 text-center">
            <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
              <RectangleStackIcon className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-light text-charcoal mb-2">No packages yet</h3>
            <p className="text-neutral-500 font-light mb-6">
              Create your first class package to offer students bundled pricing.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Your First Package
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`border p-6 ${
                  pkg.is_active 
                    ? 'border-neutral-200' 
                    : 'border-neutral-100 bg-neutral-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-medium ${
                      pkg.is_active ? 'text-charcoal' : 'text-neutral-400'
                    }`}>
                      {pkg.name}
                    </h3>
                    {!pkg.is_active && (
                      <span className="text-xs uppercase tracking-wider text-neutral-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-medium ${
                      pkg.is_active ? 'text-charcoal' : 'text-neutral-400'
                    }`}>
                      {formatPrice(pkg.price_cents)}
                    </div>
                    <div className="text-sm text-neutral-400 font-light">
                      {pkg.class_count} classes
                    </div>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-neutral-500 text-sm font-light mb-4">
                    {pkg.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-neutral-100 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                      <UsersIcon className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-medium text-charcoal">
                      {pkg.total_purchases}
                    </div>
                    <div className="text-xs text-neutral-400 font-light">Sold</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                      <TicketIcon className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-medium text-charcoal">
                      {pkg.total_credits_used}
                    </div>
                    <div className="text-xs text-neutral-400 font-light">Used</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                      <CurrencyDollarIcon className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-medium text-charcoal">
                      {formatPrice(pkg.total_purchases * pkg.price_cents)}
                    </div>
                    <div className="text-xs text-neutral-400 font-light">Revenue</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePackageStatus(pkg)}
                    className={`flex-1 px-3 py-2 text-sm font-light border transition-colors ${
                      pkg.is_active
                        ? 'border-neutral-200 text-neutral-500 hover:border-charcoal hover:text-charcoal'
                        : 'border-charcoal bg-charcoal text-white hover:bg-neutral-800'
                    }`}
                  >
                    {pkg.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  {pkg.total_purchases === 0 && (
                    <button
                      onClick={() => deletePackage(pkg)}
                      className="px-3 py-2 text-sm font-light border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 border border-neutral-100 p-8 bg-neutral-50">
          <h2 className="text-lg font-medium text-charcoal mb-4">How Packages Work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-8 h-8 bg-charcoal text-white flex items-center justify-center mb-3 text-sm">
                1
              </div>
              <h3 className="font-medium text-charcoal mb-1">Create a Package</h3>
              <p className="text-neutral-500 text-sm font-light">
                Set the number of classes and total price. Students see this on your booking pages.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-charcoal text-white flex items-center justify-center mb-3 text-sm">
                2
              </div>
              <h3 className="font-medium text-charcoal mb-1">Students Purchase</h3>
              <p className="text-neutral-500 text-sm font-light">
                When students book your classes, they can buy a package to save on multiple sessions.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-charcoal text-white flex items-center justify-center mb-3 text-sm">
                3
              </div>
              <h3 className="font-medium text-charcoal mb-1">Credits Are Used</h3>
              <p className="text-neutral-500 text-sm font-light">
                Students use their credits when booking your classes instead of paying full price.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
