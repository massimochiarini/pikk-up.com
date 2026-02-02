'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface Teacher {
  id: string
  first_name: string
  last_name: string
  bio: string | null
}

interface Deal {
  title: string
  description: string
  code?: string
}

interface Campaign {
  id: string
  subject: string
  sent_at: string
  recipient_count: number
}

interface Stats {
  active_subscribers: number
  total_subscribers: number
  recent_campaigns: Campaign[]
}

export default function NewsletterAdminPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Form state
  const [subject, setSubject] = useState("This Week at Pick Up Yoga 🧘")
  const [introMessage, setIntroMessage] = useState("Here's what's happening this week at Pick Up Yoga. We've got some amazing classes lined up for you!")
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [deals, setDeals] = useState<Deal[]>([
    { title: 'Bring a Friend Free!', description: 'Book any class this week and bring a friend for free. Just mention this deal at check-in.', code: '' }
  ])
  const [previewEmail, setPreviewEmail] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load stats
      const statsResponse = await fetch('/api/newsletter/send')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load teachers
      const { data: teachersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, bio')
        .eq('is_instructor', true)
        .order('first_name')

      setTeachers(teachersData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendPreview = async () => {
    if (!previewEmail) {
      alert('Please enter a preview email address')
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preview: true,
          preview_email: previewEmail,
          subject,
          intro_message: introMessage,
          deals: deals.filter(d => d.title && d.description),
          featured_teacher_ids: selectedTeachers
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: `Preview sent to ${previewEmail}!` })
      } else {
        setResult({ success: false, message: data.error || 'Failed to send preview' })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Something went wrong' })
    } finally {
      setSending(false)
    }
  }

  const handleSendToAll = async () => {
    if (!confirm(`Are you sure you want to send this newsletter to ${stats?.active_subscribers || 0} subscribers?`)) {
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preview: false,
          subject,
          intro_message: introMessage,
          deals: deals.filter(d => d.title && d.description),
          featured_teacher_ids: selectedTeachers
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ 
          success: true, 
          message: `Newsletter sent to ${data.sent_count} subscribers!` 
        })
        loadData() // Refresh stats
      } else {
        setResult({ success: false, message: data.error || 'Failed to send newsletter' })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Something went wrong' })
    } finally {
      setSending(false)
    }
  }

  const addDeal = () => {
    setDeals([...deals, { title: '', description: '', code: '' }])
  }

  const updateDeal = (index: number, field: keyof Deal, value: string) => {
    const newDeals = [...deals]
    newDeals[index] = { ...newDeals[index], [field]: value }
    setDeals(newDeals)
  }

  const removeDeal = (index: number) => {
    setDeals(deals.filter((_, i) => i !== index))
  }

  const toggleTeacher = (id: string) => {
    setSelectedTeachers(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-neutral-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-neutral-500 hover:text-neutral-700 text-sm mb-4 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-light text-neutral-900">Newsletter</h1>
          <p className="text-neutral-500 mt-2">Compose and send weekly newsletters to your subscribers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-light text-neutral-900">{stats?.active_subscribers || 0}</div>
            <div className="text-sm text-neutral-500">Active Subscribers</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-light text-neutral-900">{stats?.total_subscribers || 0}</div>
            <div className="text-sm text-neutral-500">Total Subscribers</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm col-span-2 md:col-span-1">
            <div className="text-3xl font-light text-neutral-900">{stats?.recent_campaigns?.length || 0}</div>
            <div className="text-sm text-neutral-500">Campaigns Sent</div>
          </div>
        </div>

        {/* Result message */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.message}
          </div>
        )}

        {/* Compose Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-medium text-neutral-900 mb-6">Compose Newsletter</h2>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="This Week at Pick Up Yoga"
            />
          </div>

          {/* Intro Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Intro Message</label>
            <textarea
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
              placeholder="Here's what's happening this week..."
            />
          </div>

          {/* Featured Teachers */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Featured Teachers (optional)</label>
            <div className="flex flex-wrap gap-2">
              {teachers.map(teacher => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => toggleTeacher(teacher.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedTeachers.includes(teacher.id)
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {teacher.first_name} {teacher.last_name}
                </button>
              ))}
            </div>
          </div>

          {/* Deals */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Special Deals</label>
            {deals.map((deal, index) => (
              <div key={index} className="bg-amber-50 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-amber-700 font-medium uppercase">Deal #{index + 1}</span>
                  {deals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeal(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={deal.title}
                  onChange={(e) => updateDeal(index, 'title', e.target.value)}
                  placeholder="Deal title (e.g., Bring a Friend Free!)"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <textarea
                  value={deal.description}
                  onChange={(e) => updateDeal(index, 'description', e.target.value)}
                  placeholder="Deal description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
                <input
                  type="text"
                  value={deal.code || ''}
                  onChange={(e) => updateDeal(index, 'code', e.target.value)}
                  placeholder="Promo code (optional)"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addDeal}
              className="text-sm text-neutral-600 hover:text-neutral-800"
            >
              + Add another deal
            </button>
          </div>

          <hr className="my-6 border-neutral-200" />

          {/* Preview Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Send Preview</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSendPreview}
                disabled={sending || !previewEmail}
                className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sending ? 'Sending...' : 'Send Preview'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Send a preview to yourself before sending to all subscribers</p>
          </div>

          {/* Send to All */}
          <button
            type="button"
            onClick={handleSendToAll}
            disabled={sending || !stats?.active_subscribers}
            className="w-full px-6 py-4 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            {sending ? 'Sending...' : `Send to ${stats?.active_subscribers || 0} Subscribers`}
          </button>
        </div>

        {/* Recent Campaigns */}
        {stats?.recent_campaigns && stats.recent_campaigns.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-medium text-neutral-900 mb-4">Recent Campaigns</h2>
            <div className="space-y-3">
              {stats.recent_campaigns.map(campaign => (
                <div key={campaign.id} className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-0">
                  <div>
                    <div className="font-medium text-neutral-900">{campaign.subject}</div>
                    <div className="text-sm text-neutral-500">
                      {new Date(campaign.sent_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {campaign.recipient_count} recipients
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
