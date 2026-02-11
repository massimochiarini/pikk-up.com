import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function verifyAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAdmin: false, userId: null, error: 'Missing configuration' }
  }

  // Get the auth token from the request
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { isAdmin: false, userId: null, error: 'No authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Create a client with the user's token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { isAdmin: false, userId: null, error: 'Invalid token' }
  }

  // Check if user is admin using service role
  const serverClient = createServerClient()
  const { data: profile, error: profileError } = await serverClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return { isAdmin: false, userId: user.id, error: 'Not an admin' }
  }

  return { isAdmin: true, userId: user.id, error: null }
}
