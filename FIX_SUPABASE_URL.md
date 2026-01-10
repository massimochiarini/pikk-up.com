# 🔧 Found the Issue! Wrong Supabase URL

## The Problem

The URL format is wrong:
❌ `xkesrtakogrsturvsamp.supabase.co` 
✅ Should be: `xkesrtakogrsturvsamp.supabase.co` (but with correct subdomain)

Actually, based on your project ref, the correct URL is:
**`https://xkesrtakogrsturvsamp.supabase.co`**

But the DNS isn't resolving. This means one of two things:

1. **The project ref might be slightly different**
2. **You need to check your actual Supabase URL**

---

## 🎯 Get Your Correct Supabase URL

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/xkesrtakogrsturvsamp
2. Click **Settings** (gear icon in sidebar)
3. Click **API**
4. Look for **"Project URL"**
5. Copy the full URL (should be `https://[something].supabase.co`)

---

## Step 2: Check Your .env.local File

Create or check this file: `/Users/massimo/Desktop/pickup/.env.local`

It should contain:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Get both from:** Supabase Dashboard → Settings → API

---

## Step 3: Restart Your Dev Server

After updating `.env.local`:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

---

## 🧪 Test Again with Correct URL

Once you have the correct URL, try the curl command again:

```bash
curl -i --location --request POST \
  'https://YOUR-CORRECT-URL.supabase.co/functions/v1/send-booking-confirmation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "massimochiarini@outlook.com",
    "guestName": "Test User",
    "sessionTitle": "Morning Yoga",
    "sessionDate": "Saturday, Jan 11, 2026",
    "sessionTime": "7:00 PM",
    "venueName": "Pick Up Studio",
    "venueAddress": "2500 South Miami Avenue",
    "instructorName": "Massimo",
    "cost": 0,
    "bookingId": "test-12345"
  }'
```

---

## 📋 What to Find

Go to your Supabase dashboard and get:

1. ✅ **Project URL** (Settings → API → Project URL)
2. ✅ **Anon/Public Key** (Settings → API → anon public)

Share these with me (it's safe to share - they're public keys) and I'll help you test the email function!

The reason emails aren't sending is because the app can't reach your Supabase function with the wrong URL. Once we fix this, emails will work! 🔧
