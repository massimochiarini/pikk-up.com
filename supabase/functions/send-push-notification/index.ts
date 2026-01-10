// Supabase Edge Function: send-push-notification
// This function sends push notifications via APNs when messages are created
// Triggered by database webhook on message insert

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// APNs configuration
const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID")!
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID")!
const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID")!
const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY")!
const APNS_ENVIRONMENT = Deno.env.get("APNS_ENVIRONMENT") || "development" // "development" or "production"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

interface MessagePayload {
  type: "INSERT"
  table: string
  record: {
    id: string
    sender_id: string
    content: string
    conversation_id?: string
    group_chat_id?: string
    created_at: string
    sport?: string
    venue_name?: string
    custom_title?: string | null
    game_date?: string
    start_time?: string
    is_private?: boolean
    created_by?: string
  }
}

interface APNsPayload {
  aps: {
    alert: {
      title: string
      body: string
    }
    sound: string
    badge?: number
    "mutable-content"?: number
  }
  type: string
  conversation_id?: string
  group_chat_id?: string
  sender_id: string
}

// Generate JWT for APNs authentication
async function generateAPNsJWT(): Promise<string> {
  const header = {
    alg: "ES256",
    kid: APNS_KEY_ID,
  }

  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: APNS_TEAM_ID,
    iat: now,
  }

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  const encodedClaims = btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  const signatureInput = `${encodedHeader}.${encodedClaims}`

  // Import the private key
  const pemContents = APNS_PRIVATE_KEY
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "")

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  )

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signatureInput)
  )

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  return `${signatureInput}.${encodedSignature}`
}

// Send push notification via APNs
async function sendAPNs(deviceToken: string, payload: APNsPayload): Promise<boolean> {
  try {
    const jwt = await generateAPNsJWT()
    
    const apnsHost = APNS_ENVIRONMENT === "production"
      ? "api.push.apple.com"
      : "api.sandbox.push.apple.com"

    const response = await fetch(
      `https://${apnsHost}/3/device/${deviceToken}`,
      {
        method: "POST",
        headers: {
          "authorization": `bearer ${jwt}`,
          "apns-topic": APNS_BUNDLE_ID,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error(`APNs error for token ${deviceToken}: ${response.status} - ${error}`)
      return false
    }

    console.log(`✅ Push sent to ${deviceToken.substring(0, 10)}...`)
    return true
  } catch (error) {
    console.error(`Error sending push to ${deviceToken}:`, error)
    return false
  }
}

serve(async (req) => {
  try {
    const payload: MessagePayload = await req.json()
    
    console.log("Received webhook:", payload.table, payload.type)

    if (payload.type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Not an insert" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { record } = payload
    const senderId = record.sender_id || record.created_by || ""
    let tokens: { token: string; user_id: string }[] = []
    let notificationTitle = ""
    let notificationBody =
      typeof record.content === "string" ? record.content.substring(0, 100) : ""
    let notificationType = ""
    let extraData: Record<string, string> = {}

    // Get sender profile for notification title
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", senderId)
      .single()

    const senderName = senderProfile
      ? `${senderProfile.first_name} ${senderProfile.last_name}`
      : "Someone"

  const isGameInsert = payload.table === "games"

  if (payload.table === "messages" && record.conversation_id) {
      // Direct message
      notificationType = "message"
      notificationTitle = senderName
      extraData = { conversation_id: record.conversation_id }

      // Get recipient tokens
      const { data } = await supabase.rpc("get_push_tokens_for_conversation", {
        conv_id: record.conversation_id,
        exclude_user_id: senderId,
      })
      tokens = data || []

    } else if (payload.table === "group_messages" && record.group_chat_id) {
      // Group message
      notificationType = "group_message"
      extraData = { group_chat_id: record.group_chat_id }

      // Get group chat name
      const { data: groupChat } = await supabase
        .from("group_chats")
        .select("name")
        .eq("id", record.group_chat_id)
        .single()

      notificationTitle = groupChat?.name || "Game Chat"
      notificationBody = `${senderName}: ${record.content.substring(0, 80)}`

      // Get all member tokens except sender
      const { data } = await supabase.rpc("get_push_tokens_for_group_chat", {
        chat_id: record.group_chat_id,
        exclude_user_id: senderId,
      })
      tokens = data || []
    } else if (isGameInsert && record.sport?.toLowerCase() === "yoga") {
      // New yoga session created
      notificationType = "yoga_session"
      notificationTitle = "New Yoga Session"
      const gameTitle = record.custom_title || record.venue_name || "Yoga Class"
      const formattedDateTime = formatDateTime(record.game_date, record.start_time)
      notificationBody = formattedDateTime
        ? `${gameTitle} · ${formattedDateTime}`
        : gameTitle
      extraData = { game_id: record.id }

      if (record.is_private) {
        console.log("Skipping push for private yoga session")
        tokens = []
      } else {
        // Notify users who prefer yoga (or both), exclude creator
        const { data, error } = await supabase
          .from("device_tokens")
          .select("token, user_id, profiles!inner(sport_preference)")
          .neq("user_id", record.created_by || "")
          .in("profiles.sport_preference", ["yoga", "both"])

        if (error) {
          console.error("Error fetching yoga tokens:", error)
          tokens = []
        } else {
          tokens = data || []
        }
      }
    }

    console.log(`Found ${tokens.length} tokens to notify`)

    // Send notifications to all tokens
    const results = await Promise.all(
      tokens.map((t) =>
        sendAPNs(t.token, {
          aps: {
            alert: {
              title: notificationTitle,
              body: notificationBody,
            },
            sound: "default",
            "mutable-content": 1,
          },
          type: notificationType,
          sender_id: senderId,
          ...extraData,
        })
      )
    )

    const successCount = results.filter(Boolean).length

    return new Response(
      JSON.stringify({
        message: "Notifications processed",
        sent: successCount,
        total: tokens.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})

function formatDateTime(dateStr?: string, timeStr?: string): string | undefined {
  if (!dateStr) return undefined
  try {
    const trimmedTime = timeStr?.slice(0, 5) // HH:mm
    return trimmedTime ? `${dateStr} at ${trimmedTime}` : dateStr
  } catch {
    return dateStr
  }
}
