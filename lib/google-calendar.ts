import { google, calendar_v3 } from 'googleapis'
import { createServerClient } from './supabase'

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL + '/api/google-calendar/callback'

// Scopes needed for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

/**
 * Create an OAuth2 client
 */
export function createOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar credentials not configured')
  }
  
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )
}

/**
 * Generate the OAuth2 authorization URL
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent', // Force consent to always get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Get the admin user who has Google Calendar connected
 * This is used to sync ALL classes to the admin's calendar for bookkeeping
 */
export async function getAdminWithCalendar() {
  const supabase = createServerClient()
  
  // Find admin with Google Calendar connected
  const { data: admin, error } = await supabase
    .from('profiles')
    .select('id, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_id')
    .eq('is_admin', true)
    .eq('google_calendar_connected', true)
    .limit(1)
    .single()
  
  if (error || !admin?.google_calendar_refresh_token) {
    return null
  }
  
  return admin
}

/**
 * Get an authenticated OAuth2 client for a user
 */
export async function getAuthenticatedClient(userId: string) {
  const supabase = createServerClient()
  
  // Get user's tokens from database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_id')
    .eq('id', userId)
    .single()
  
  if (error || !profile?.google_calendar_refresh_token) {
    return null
  }
  
  const oauth2Client = createOAuth2Client()
  
  oauth2Client.setCredentials({
    access_token: profile.google_calendar_access_token,
    refresh_token: profile.google_calendar_refresh_token,
    expiry_date: profile.google_calendar_token_expiry ? new Date(profile.google_calendar_token_expiry).getTime() : undefined,
  })
  
  // Set up token refresh handler
  oauth2Client.on('tokens', async (tokens) => {
    // Update tokens in database when refreshed
    const updateData: Record<string, any> = {}
    
    if (tokens.access_token) {
      updateData.google_calendar_access_token = tokens.access_token
    }
    if (tokens.expiry_date) {
      updateData.google_calendar_token_expiry = new Date(tokens.expiry_date).toISOString()
    }
    
    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
    }
  })
  
  return {
    client: oauth2Client,
    calendarId: profile.google_calendar_id || 'primary',
  }
}

/**
 * Create a Google Calendar event for a class
 * Syncs to the ADMIN's calendar for bookkeeping purposes
 */
export async function createCalendarEvent(
  classData: {
    id: string
    title: string
    description?: string
    date: string
    startTime: string
    endTime: string
    location?: string
    instructorName?: string
  }
): Promise<string | null> {
  try {
    // Get admin with calendar connected
    const admin = await getAdminWithCalendar()
    
    if (!admin) {
      console.log('No admin with Google Calendar connected')
      return null
    }
    
    const authResult = await getAuthenticatedClient(admin.id)
    
    if (!authResult) {
      console.log('Could not authenticate admin Google Calendar')
      return null
    }
    
    const { client, calendarId } = authResult
    const calendar = google.calendar({ version: 'v3', auth: client })
    
    // Parse date and times
    const startDateTime = `${classData.date}T${classData.startTime}`
    const endDateTime = `${classData.date}T${classData.endTime}`
    
    // Build description with instructor info
    let description = classData.description || ''
    if (classData.instructorName) {
      description = `Instructor: ${classData.instructorName}\n\n${description}`
    }
    description += `\n\nBooking link: ${process.env.NEXT_PUBLIC_SITE_URL}/book/${classData.id}`
    
    const event: calendar_v3.Schema$Event = {
      summary: classData.title,
      description: description.trim(),
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Los_Angeles',
      },
      // Add a link back to the class
      source: {
        title: 'PickUp Class',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/book/${classData.id}`,
      },
    }
    
    if (classData.location) {
      event.location = classData.location
    }
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })
    
    console.log('Created Google Calendar event:', response.data.id)
    return response.data.id || null
  } catch (error) {
    console.error('Error creating Google Calendar event:', error)
    return null
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  classData: {
    title: string
    description?: string
    date: string
    startTime: string
    endTime: string
    location?: string
  }
): Promise<boolean> {
  try {
    const authResult = await getAuthenticatedClient(userId)
    
    if (!authResult) {
      return false
    }
    
    const { client, calendarId } = authResult
    const calendar = google.calendar({ version: 'v3', auth: client })
    
    const startDateTime = `${classData.date}T${classData.startTime}`
    const endDateTime = `${classData.date}T${classData.endTime}`
    
    const event: calendar_v3.Schema$Event = {
      summary: classData.title,
      description: classData.description || `PickUp Class: ${classData.title}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Los_Angeles',
      },
    }
    
    if (classData.location) {
      event.location = classData.location
    }
    
    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    })
    
    return true
  } catch (error) {
    console.error('Error updating Google Calendar event:', error)
    return false
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const authResult = await getAuthenticatedClient(userId)
    
    if (!authResult) {
      return false
    }
    
    const { client, calendarId } = authResult
    const calendar = google.calendar({ version: 'v3', auth: client })
    
    await calendar.events.delete({
      calendarId,
      eventId,
    })
    
    return true
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error)
    return false
  }
}

/**
 * Check if Google Calendar is connected for a user
 */
export async function isCalendarConnected(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_calendar_connected, google_calendar_refresh_token')
    .eq('id', userId)
    .single()
  
  return !!(profile?.google_calendar_connected && profile?.google_calendar_refresh_token)
}

/**
 * Check if admin has Google Calendar connected (for global class sync)
 */
export async function isAdminCalendarConnected(): Promise<boolean> {
  const admin = await getAdminWithCalendar()
  return admin !== null
}

/**
 * Disconnect Google Calendar for a user
 */
export async function disconnectCalendar(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      google_calendar_access_token: null,
      google_calendar_refresh_token: null,
      google_calendar_token_expiry: null,
      google_calendar_connected: false,
      google_calendar_id: null,
    })
    .eq('id', userId)
  
  return !error
}

/**
 * List user's calendars (for selecting which calendar to use)
 */
export async function listCalendars(userId: string): Promise<calendar_v3.Schema$CalendarListEntry[] | null> {
  try {
    const authResult = await getAuthenticatedClient(userId)
    
    if (!authResult) {
      return null
    }
    
    const { client } = authResult
    const calendar = google.calendar({ version: 'v3', auth: client })
    
    const response = await calendar.calendarList.list()
    return response.data.items || []
  } catch (error) {
    console.error('Error listing calendars:', error)
    return null
  }
}
