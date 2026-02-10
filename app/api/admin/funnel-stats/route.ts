import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return { isAdmin: false }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return { isAdmin: false }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { isAdmin: false }
  const serverClient = createServerClient()
  const { data: profile } = await serverClient.from('profiles').select('is_admin').eq('id', user.id).single()
  return { isAdmin: !!profile?.is_admin }
}

/**
 * GET: Funnel KPIs for admin dashboard. Requires admin auth.
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { count: bioCaptures } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'bio')

    const { count: tokensIssued } = await supabaseAdmin
      .from('first_class_free_tokens')
      .select('*', { count: 'exact', head: true })

    const { count: tokensRedeemed } = await supabaseAdmin
      .from('first_class_free_tokens')
      .select('*', { count: 'exact', head: true })
      .not('used_at', 'is', null)

    const { count: bookingsCount } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    return NextResponse.json({
      bio_captures: bioCaptures ?? 0,
      tokens_issued: tokensIssued ?? 0,
      tokens_redeemed: tokensRedeemed ?? 0,
      bookings_count: bookingsCount ?? 0,
    })
  } catch (err) {
    console.error('Funnel stats error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
