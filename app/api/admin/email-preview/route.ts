import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/verify-admin'
import { getEmailTemplate } from '@/lib/emails/automations/templates'

/**
 * POST /api/admin/email-preview
 * Body: { type, email?, payload? }
 * Returns the HTML for previewing an automation email.
 */
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin(request)
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type, email = 'test@example.com', payload = {} } = body
    
    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 })
    }

    const { subject, html } = getEmailTemplate(type, email, payload)

    return NextResponse.json({ subject, html })
  } catch (err) {
    console.error('Email preview error:', err)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}
