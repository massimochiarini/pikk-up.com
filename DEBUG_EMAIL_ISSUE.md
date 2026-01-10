# 🐛 Email Function Not Being Called - Debug Steps

## Issue Found
Resend shows **no emails sent** = the function was never invoked.

## Updated Code
I've added detailed logging to the booking page to help us debug.

---

## 📋 Next Steps to Debug

### Step 1: Test a Booking with Console Open

1. **Open the booking page** in your browser
2. **Open DevTools** (Press F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Submit a booking**
5. **Look for these messages:**
   ```
   Attempting to send email to: your-email@example.com
   Email sent successfully: {...}
   ```
   OR
   ```
   Email function error: {...}
   Failed to send confirmation email: {...}
   ```

### Step 2: Check for Common Errors

**Possible errors you might see:**

1. **"Function not found"**
   - The function name doesn't match
   - Run: `supabase functions list` to verify it's deployed

2. **"Unauthorized" or "403"**
   - RLS policy blocking the function call
   - This shouldn't happen for Edge Functions

3. **"Network error"**
   - Supabase URL might be wrong
   - Check your `.env.local` file

4. **No logs at all**
   - The booking might be failing before it reaches the email code
   - Check if you see "You're All Set!" page

---

## 🔍 Things to Verify

### 1. Check if Function is Deployed

```bash
supabase functions list
```

You should see:
```
send-booking-confirmation
```

### 2. Check Your Supabase URL

In your project, check `lib/supabase.ts`:
- Does it have the correct Supabase URL?
- Format: `https://PROJECT_ID.supabase.co`

### 3. Test Function Manually

Try calling the function directly from terminal:

```bash
curl -i --location --request POST \
  'https://xkesrtakogrsturvsamp.supabase.co/functions/v1/send-booking-confirmation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "your-email@example.com",
    "guestName": "Test User",
    "sessionTitle": "Morning Yoga",
    "sessionDate": "Saturday, Jan 10, 2026",
    "sessionTime": "7:00 PM",
    "venueName": "Pick Up Studio",
    "venueAddress": "2500 South Miami Avenue",
    "instructorName": "Test Instructor",
    "cost": 0,
    "bookingId": "test-12345"
  }'
```

**Get your anon key:**
- Supabase Dashboard → Settings → API → "anon public" key

If this works, the function is fine and the issue is in the booking page.

---

## 📊 What to Share

After testing with console open, share:

1. **Console logs** - Copy/paste what you see
2. **Did booking succeed?** - Did you see "You're All Set!"?
3. **Any red errors?** - Screenshot or copy the error text
4. **Function test result** - Did the curl command work?

This will help me pinpoint exactly what's wrong! 🔧
