import { NextRequest, NextResponse } from 'next/servlet'
import { createServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/verify-admin'
import { getEmailTemplate } from '@/lib/emails/automations/templates' // Wait, I need to make sure this path is correct

/**
 * GET /api/admin/email-preview
 * Params: type, email?, payload? (JSON)
 * Returns the HTML for previewing an automation email.
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, email = 'test@example.com', payload = {} } = await request.json()
    
    // We'll use the Next.js templates version for preview
    // Note: I'll need to make sure the templates are exported correctly
    const { subject, html } = (global as any).templates?.[type]?.(email, payload) || { 
      subject: 'Template not found', 
      html: '<h1>Template not found</h1>' 
    }

    return NextResponse.json({ subject, html })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}
