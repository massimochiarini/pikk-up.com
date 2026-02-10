'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface FunnelStats {
  bio_captures: number
  tokens_issued: number
  tokens_redeemed: number
  bookings_count: number
}

export default function AdminFunnelPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<FunnelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not signed in')
        return
      }
      const res = await fetch('/api/admin/funnel-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load stats')
      setStats(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchStats()
    }
  }, [user, profile?.is_admin])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-neutral-600">
          You don’t have access to this page.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-neutral-500 hover:text-charcoal text-sm font-light">
              Admin
            </Link>
            <span className="text-neutral-300">/</span>
            <h1 className="text-2xl font-light text-charcoal flex items-center gap-2">
              <ChartBarIcon className="w-7 h-7" />
              Funnel & Email
            </h1>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <p className="text-neutral-500 font-light text-sm mb-8">
          v1 metrics for the email funnel. Bio link: <code className="bg-neutral-100 px-1 rounded">/go</code>. Run automations via cron: <code className="bg-neutral-100 px-1 rounded">GET /api/cron/email-automations?secret=CRON_SECRET</code>.
        </p>

        {loading && !stats ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-charcoal rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-neutral-200 p-6">
              <div className="text-3xl font-light text-charcoal">{stats.bio_captures}</div>
              <div className="text-sm text-neutral-500 font-light mt-1">Email captures (bio gate)</div>
            </div>
            <div className="border border-neutral-200 p-6">
              <div className="text-3xl font-light text-charcoal">{stats.tokens_issued}</div>
              <div className="text-sm text-neutral-500 font-light mt-1">First-class-free tokens issued</div>
            </div>
            <div className="border border-neutral-200 p-6">
              <div className="text-3xl font-light text-charcoal">{stats.tokens_redeemed}</div>
              <div className="text-sm text-neutral-500 font-light mt-1">Tokens redeemed</div>
            </div>
            <div className="border border-neutral-200 p-6">
              <div className="text-3xl font-light text-charcoal">{stats.bookings_count}</div>
              <div className="text-sm text-neutral-500 font-light mt-1">Confirmed bookings</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
