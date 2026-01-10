# 📧 Email Confirmation Setup Guide

## Overview

Automatically send beautiful confirmation emails to guests who book sessions through your public booking links.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Click "Get Started for Free"
3. Sign up with your email
4. Verify your email address

### Step 2: Get Your API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Pick Up Production`
4. Click **Add**
5. **Copy the key** (starts with `re_`) - you won't see it again!

### Step 3: Install Supabase CLI (if not installed)

```bash
# macOS
brew install supabase/tap/supabase

# Or download from: https://github.com/supabase/cli/releases
```

### Step 4: Login to Supabase CLI

```bash
supabase login
```

This will open your browser to authenticate.

### Step 5: Link Your Project

```bash
cd /Users/massimo/Desktop/pickup
supabase link --project-ref YOUR_PROJECT_ID
```

**Find your project ID:**
- Go to your Supabase dashboard
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`

### Step 6: Set the API Key

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

Replace `re_your_api_key_here` with your actual Resend API key.

### Step 7: Deploy the Function

```bash
supabase functions deploy send-booking-confirmation
```

You should see:
```
Deploying function send-booking-confirmation...
Deployed function send-booking-confirmation successfully!
```

### Step 8: Test It!

1. Open your app
2. Go to a session's public booking link
3. Fill out the form and book
4. Check your email! 📧

---

## 🎨 Email Template Preview

The confirmation email includes:

```
✅ You're All Set!

Hi [Guest Name],

Your spot has been confirmed! We're excited to see you.

┌─────────────────────────────────────┐
│ Morning Yoga                         │
│                                      │
│ 📅 Saturday, Jan 10, 2026           │
│    7:00 PM                           │
│                                      │
│ 📍 Pick Up Studio                   │
│    2500 South Miami Avenue           │
│                                      │
│ 👤 Jane Smith (Instructor)          │
│                                      │
│ 💰 Free                              │
└─────────────────────────────────────┘

📋 What to Bring
• Yoga mat (or one will be provided)
• Water bottle
• Comfortable clothing
• Please arrive 5-10 minutes early

✓ Confirmation: Your booking ID is #abc12345

See you there!
The Pick Up Team
```

---

## 🌐 Domain Setup (For Production)

### Why Verify a Domain?

Resend's test domain can only send to verified emails. For production, verify your own domain to send to anyone.

### Steps to Verify Your Domain

1. **Go to Resend Dashboard** → Domains
2. **Click "Add Domain"**
3. **Enter your domain:** `pickupapp.io` (or whatever you use)
4. **Add DNS Records** - Resend will show you 3 DNS records to add:

```
Type: TXT
Name: @
Value: resend-verification=abc123...

Type: MX
Name: @
Value: mx1.resend.com (Priority: 10)

Type: MX  
Name: @
Value: mx2.resend.com (Priority: 20)
```

5. **Add these in your domain registrar** (GoDaddy, Namecheap, Cloudflare, etc.)
6. **Wait 5-30 minutes** for DNS propagation
7. **Click "Verify"** in Resend

### Update the "From" Email

Once domain is verified, update the function:

**Edit:** `supabase/functions/send-booking-confirmation/index.ts`

**Line ~145:** Change from:
```typescript
from: 'Pick Up <bookings@pickupapp.io>',
```

To:
```typescript
from: 'Pick Up <bookings@yourdomain.com>',
```

**Redeploy:**
```bash
supabase functions deploy send-booking-confirmation
```

---

## 🧪 Testing

### Test Locally

```bash
# Start Supabase functions locally
supabase functions serve send-booking-confirmation --env-file .env.local
```

Create `.env.local`:
```
RESEND_API_KEY=re_your_api_key
```

### Test with cURL

```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-booking-confirmation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "your-email@example.com",
    "guestName": "John Doe",
    "sessionTitle": "Morning Yoga",
    "sessionDate": "Saturday, Jan 10, 2026",
    "sessionTime": "7:00 PM",
    "venueName": "Pick Up Studio",
    "venueAddress": "2500 South Miami Avenue",
    "instructorName": "Jane Smith",
    "cost": 0,
    "bookingId": "test-123"
  }'
```

Replace:
- `YOUR_PROJECT` with your Supabase project ref
- `YOUR_ANON_KEY` with your anon key (from Supabase dashboard)

---

## 📊 Monitoring

### View Function Logs

```bash
supabase functions logs send-booking-confirmation
```

Or in Supabase dashboard:
1. Go to **Edge Functions**
2. Click **send-booking-confirmation**
3. Click **Logs** tab

### View Email Delivery in Resend

1. Go to Resend dashboard
2. Click **Logs**
3. See all sent emails, delivery status, opens, clicks

---

## 🐛 Troubleshooting

### Emails Not Sending?

**Check 1: Is the API key set?**
```bash
supabase secrets list
```
You should see `RESEND_API_KEY`.

**Check 2: View error logs**
```bash
supabase functions logs send-booking-confirmation
```

**Check 3: Test domain restrictions**
- Using test domain? Only sends to verified emails in Resend account
- Solution: Add your email in Resend → "Verified Emails" OR verify your domain

### "Invalid API Key" Error

The API key is wrong or expired.

**Solution:**
```bash
# Reset the key
supabase secrets set RESEND_API_KEY=re_your_new_key

# Redeploy
supabase functions deploy send-booking-confirmation
```

### Emails Going to Spam?

**Solution 1:** Verify your domain (see Domain Setup section)

**Solution 2:** Add SPF/DKIM records in Resend dashboard

**Solution 3:** Ask recipients to whitelist your sender address

### Function Timeout?

Edge functions have a 150-second timeout. Email sending is fast (~1-2 seconds).

If timing out, check:
- Network connectivity
- Resend API status: [status.resend.com](https://status.resend.com)

---

## 💰 Costs

### Resend Pricing

| Tier | Monthly Emails | Price |
|------|---------------|-------|
| **Free** | 3,000 emails | $0 |
| **Pro** | 50,000 emails | $20/month |
| **Scale** | 1M+ emails | Custom |

### Supabase Pricing

| Tier | Function Invocations | Price |
|------|---------------------|-------|
| **Free** | 500K/month | $0 |
| **Pro** | 2M/month | $25/month |

**Your usage:**
- ~1 email per booking
- Free tier = 3,000 bookings/month
- More than enough for most studios!

---

## 🎨 Customizing the Email

### Change Colors

**Edit:** `supabase/functions/send-booking-confirmation/index.ts`

**Line ~50:** Update gradient colors:
```html
<td style="background: linear-gradient(135deg, #8DD8F8 0%, #A0ED8D 100%); ...">
```

### Add Your Logo

Add before the checkmark emoji (around line ~56):
```html
<img src="https://yourdomain.com/logo.png" 
     alt="Pick Up" 
     width="120" 
     style="margin-bottom: 20px;">
```

### Modify "What to Bring" List

**Line ~130:**
```html
<ul style="...">
  <li>Yoga mat (or one will be provided)</li>
  <li>Water bottle</li>
  <li>Comfortable clothing</li>
  <li>Your custom item here</li>
</ul>
```

### Add Social Links

In footer (around line ~185):
```html
<p style="...">
  Follow us: 
  <a href="https://instagram.com/yourhandle">Instagram</a> | 
  <a href="https://facebook.com/yourpage">Facebook</a>
</p>
```

**After changes:**
```bash
supabase functions deploy send-booking-confirmation
```

---

## 📋 Checklist

- [ ] Signed up for Resend
- [ ] Got API key
- [ ] Installed Supabase CLI
- [ ] Linked Supabase project
- [ ] Set RESEND_API_KEY secret
- [ ] Deployed function
- [ ] Tested booking flow
- [ ] Received test email
- [ ] (Optional) Verified custom domain
- [ ] (Optional) Updated "from" email address
- [ ] (Optional) Customized email template

---

## 🆘 Support

### Resend Support
- Docs: [resend.com/docs](https://resend.com/docs)
- Email: support@resend.com

### Supabase Support
- Docs: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- Discord: [discord.supabase.com](https://discord.supabase.com)

---

## ✅ Success!

Once setup is complete:
1. ✅ Guests receive instant confirmation emails
2. ✅ All session details included
3. ✅ Professional branding
4. ✅ Automatic - no manual work
5. ✅ Reliable delivery

**Your booking experience is now complete!** 🎉
