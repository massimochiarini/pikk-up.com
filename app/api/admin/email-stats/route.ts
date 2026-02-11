import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/verify-admin'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify admin
    const { isAdmin } = await verifyAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // 2. Fetch leads
    const { data: leads } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })

    const leadsToday = leads?.filter(l => new Date(l.created_at) >= todayStart).length || 0
    const leads7d = leads?.filter(l => new Date(l.created_at) >= sevenDaysAgo).length || 0

    // 3. Fetch bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('created_at, status')
      .eq('status', 'confirmed')

    const bookingsToday = bookings?.filter(b => new Date(b.created_at) >= todayStart).length || 0
    const bookings7d = bookings?.filter(b => new Date(b.created_at) >= sevenDaysAgo).length || 0

    // 4. Fetch email jobs
    const { data: jobs } = await supabase
      .from('email_jobs')
      .select('type, sent_at, created_at')
      .not('sent_at', 'is', null)

    const jobsToday = jobs?.filter(j => new Date(j.sent_at!) >= todayStart) || []
    const jobs7d = jobs?.filter(j => new Date(j.sent_at!) >= sevenDaysAgo) || []

    const jobsByTypeToday = jobsToday.reduce((acc: any, j) => {
      acc[j.type] = (acc[j.type] || 0) + 1
      return acc
    }, {})

    const jobsByType7d = jobs7d.reduce((acc: any, j) => {
      acc[j.type] = (acc[j.type] || 0) + 1
      return acc
    }, {})

    // 5. Fetch clicks
    const { data: clicks } = await supabase
      .from('email_events')
      .select('metadata, created_at')
      .eq('event_type', 'clicked')

    const clicksToday = clicks?.filter(c => new Date(c.created_at) >= todayStart) || []
    const clicks7d = clicks?.filter(c => new Date(c.created_at) >= sevenDaysAgo) || []

    const clicksByTypeToday = clicksToday.reduce((acc: any, c) => {
      const type = c.metadata?.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const clicksByType7d = clicks7d.reduce((acc: any, c) => {
      const type = c.metadata?.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // 6. Upcoming jobs count
    const { count: upcomingCount } = await supabase
      .from('email_jobs')
      .select('*', { count: 'exact', head: true })
      .is('sent_at', null)
      .is('canceled_at', null)
      .gt('scheduled_for', new Date().toISOString())

    // 7. Calculate conversion (Lead -> Booking %)
    // A simple v1 conversion: Total confirmed bookings / Total leads
    const totalLeads = leads?.length || 0
    const totalBookings = bookings?.length || 0
    const conversionRate = totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0

    return NextResponse.json({
      kpis: {
        leads: { today: leadsToday, last7d: leads7d },
        bookings: { today: bookingsToday, last7d: bookings7d },
        jobs: { today: jobsByTypeToday, last7d: jobsByType7d, totalToday: jobsToday.length, total7d: jobs7d.length },
        clicks: { today: clicksByTypeToday, last7d: clicksByType7d, totalToday: clicksToday.length, total7d: clicks7d.length },
        conversion: conversionRate.toFixed(1)
      },
      newestLeads: leads?.slice(0, 10) || [],
      upcomingJobsCount: upcomingCount || 0
    })

  } catch (err) {
    console.error('Email stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
