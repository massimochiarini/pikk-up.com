# 📧 Quick Setup - Email Confirmations

Get email confirmations working in 5 minutes!

## What You Need

1. **Resend account** (free) - [resend.com](https://resend.com)
2. **Supabase CLI** installed

## Setup Steps

### 1️⃣ Get Resend API Key

```bash
# Sign up at resend.com
# Go to: Dashboard → API Keys → Create API Key
# Copy the key (starts with "re_")
```

### 2️⃣ Set Environment Variable

```bash
cd /Users/massimo/Desktop/pickup
supabase secrets set RESEND_API_KEY=re_your_key_here
```

### 3️⃣ Deploy the Function

```bash
supabase functions deploy send-booking-confirmation
```

### 4️⃣ Test It!

Book a session through a public link and check your email!

---

## That's It! 🎉

Guests now receive:
- ✅ Instant confirmation email
- ✅ All session details
- ✅ What to bring list
- ✅ Booking confirmation ID

## Optional: Custom Domain

For production, verify your domain in Resend to send from `bookings@yourdomain.com`

See **EMAIL_CONFIRMATION_SETUP.md** for full details.

---

## Free Tier Limits

- **Resend:** 3,000 emails/month (100/day)
- **Supabase:** 500K function calls/month

More than enough for most studios!

## Files Created

```
supabase/functions/send-booking-confirmation/
├── index.ts          # Edge function code
└── README.md         # Technical details

EMAIL_CONFIRMATION_SETUP.md  # Full setup guide (you are here!)
EMAIL_QUICK_START.md         # This quick reference
```

## Need Help?

Check **EMAIL_CONFIRMATION_SETUP.md** for:
- Domain verification
- Customizing the email template
- Troubleshooting
- Testing locally
