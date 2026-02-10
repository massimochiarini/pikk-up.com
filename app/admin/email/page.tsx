'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeftIcon, ArrowPathIcon, EnvelopeIcon, CursorArrowRaysIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Stats {
  kpis: {
    leads: { today: number; last7d: number }
    bookings: { today: number; last7d: number }
    jobs: { 
      today: Record<string, number>
      last7d: Record<string, number>
      totalToday: number
      total7d: number
    }
    clicks: { 
      today: Record<string, number>
      last7d: Record<string, number>
      totalToday: number
      total7d: number
    }
    conversion: string
  }
  newestLeads: any[]
  upcomingJobsCount: number
}

export default function EmailAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/email-stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      } else {
        setError(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50/30 pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-stone-400 text-sm mb-4">
              <Link href="/admin" className="hover:text-stone-600 transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-stone-600">Email & Funnel</span>
            </div>
            <h1 className="text-3xl font-light text-stone-800 tracking-tight">Email & Funnel Performance</h1>
          </div>
          <button 
            onClick={fetchStats}
            className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : stats && (
          <div className="space-y-8">
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="surface-card p-6">
                <div className="flex items-center gap-3 text-stone-400 mb-4">
                  <UserGroupIcon className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-medium">Leads Captured</span>
                </div>
                <div className="text-3xl font-light text-stone-800 mb-1">{stats.kpis.leads.last7d}</div>
                <div className="text-xs text-stone-400">Last 7 days (+{stats.kpis.leads.today} today)</div>
              </div>

              <div className="surface-card p-6">
                <div className="flex items-center gap-3 text-stone-400 mb-4">
                  <CalendarIcon className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-medium">Bookings Created</span>
                </div>
                <div className="text-3xl font-light text-stone-800 mb-1">{stats.kpis.bookings.last7d}</div>
                <div className="text-xs text-stone-400">Last 7 days (+{stats.kpis.bookings.today} today)</div>
              </div>

              <div className="surface-card p-6">
                <div className="flex items-center gap-3 text-stone-400 mb-4">
                  <EnvelopeIcon className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-medium">Emails Sent</span>
                </div>
                <div className="text-3xl font-light text-stone-800 mb-1">{stats.kpis.jobs.total7d}</div>
                <div className="text-xs text-stone-400">Last 7 days (+{stats.kpis.jobs.totalToday} today)</div>
              </div>

              <div className="surface-card p-6">
                <div className="flex items-center gap-3 text-stone-400 mb-4">
                  <CursorArrowRaysIcon className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-medium">Conversion Rate</span>
                </div>
                <div className="text-3xl font-light text-stone-800 mb-1">{stats.kpis.conversion}%</div>
                <div className="text-xs text-stone-400">Overall Lead → Booking</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Detailed Email Metrics */}
              <div className="surface-card p-8">
                <h3 className="text-sm uppercase tracking-widest font-medium text-stone-400 mb-8">Email Activity (7d)</h3>
                <div className="space-y-6">
                  {Object.entries(stats.kpis.jobs.last7d).map(([type, count]) => {
                    const clickCount = stats.kpis.clicks.last7d[type] || 0
                    const ctr = count > 0 ? ((clickCount / count) * 100).toFixed(1) : '0.0'
                    return (
                      <div key={type} className="flex items-center justify-between border-b border-stone-50 pb-4">
                        <div>
                          <div className="text-sm font-medium text-stone-700">{type.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-stone-400">{count} sent · {clickCount} clicked</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-light text-stone-800">{ctr}% CTR</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-8 pt-8 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-sm text-stone-500">Upcoming automated jobs</span>
                  <span className="text-sm font-medium text-stone-800">{stats.upcomingJobsCount}</span>
                </div>
              </div>

              {/* Newest Leads */}
              <div className="surface-card p-8">
                <h3 className="text-sm uppercase tracking-widest font-medium text-stone-400 mb-8">Newest Leads</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-stone-400 border-b border-stone-100">
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Source</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-light text-stone-600">
                      {stats.newestLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-stone-50 last:border-0">
                          <td className="py-4 truncate max-w-[150px]">{lead.email}</td>
                          <td className="py-4 text-xs">{lead.source}</td>
                          <td className="py-4 text-xs">{lead.role_preference}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 text-[10px] rounded-full ${lead.last_booking_at ? 'bg-green-50 text-green-600' : 'bg-stone-50 text-stone-400'}`}>
                              {lead.last_booking_at ? 'Booked' : 'Lead'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
