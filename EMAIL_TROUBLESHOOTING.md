# 🐛 Email Not Received - Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Resend Test Domain Restrictions ⚠️

**Most Likely Problem:** Resend's test domain (`onboarding@resend.dev`) can only send to **verified email addresses** in your Resend account.

**Solution:**
1. Go to [resend.com/emails](https://resend.com/emails) 
2. Check if the email shows as "sent" but you didn't receive it
3. If yes, you need to:
   - **Option A:** Add your email as verified in Resend dashboard
   - **Option B:** Verify your custom domain (recommended for production)

**To add verified email:**
1. Go to [resend.com/domains](https://resend.com/domains)
2. Click your email address
3. Verify it
4. Try booking again

---

### Issue 2: Check Function Logs

**View logs in Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/xkesrtakogrsturvsamp/functions
2. Click on `send-booking-confirmation`
3. Click the "Logs" tab
4. Look for errors

**Common errors you might see:**
- `Invalid API key` - Need to update the key
- `Domain not verified` - Using test domain without verified email
- `Function timeout` - Network issue

---

### Issue 3: Check Resend Dashboard

**See if email was attempted:**
1. Go to: [resend.com/emails](https://resend.com/emails)
2. Look for recent emails
3. Check the status:
   - **Sent** = Resend sent it (check spam)
   - **Delivered** = It reached the inbox
   - **Failed** = Check the error message

---

### Issue 4: Function Not Called

**Check if booking succeeded:**
1. Did you get the "You're All Set!" success page?
2. If yes, check the browser console for errors:
   - Open DevTools (F12 or right-click → Inspect)
   - Go to Console tab
   - Look for red error messages

---

## 🔧 Quick Fixes

### Fix 1: Verify Your Email in Resend

If using test domain, add your email:

1. **Resend Dashboard** → [resend.com/domains](https://resend.com/domains)
2. Find the **test domain** section
3. Click **"Add verified email"**
4. Enter the email you're testing with
5. Click the verification link they send you
6. **Try booking again**

### Fix 2: Check Browser Console

When you book:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Submit the booking form
4. Look for any errors mentioning "send-booking-confirmation"

### Fix 3: Test the Function Directly

Run this in your terminal to test if the function works:

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
- Dashboard → Settings → API → anon/public key

---

## 🎯 Most Likely Solution

**95% of the time it's the test domain restriction.**

**Quick fix:**
1. Go to Resend dashboard
2. Verify your email address
3. Try booking again

OR

1. Verify your custom domain in Resend
2. Update the "from" address in the function
3. Redeploy

---

## Need Help?

Share with me:
1. Did you see the "You're All Set!" success page?
2. Any errors in browser console? (F12)
3. Do you see the email in Resend dashboard?
4. What email did you use for booking?

I'll help you fix it! 🔧
