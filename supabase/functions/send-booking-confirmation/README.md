# Send Booking Confirmation Email

A Supabase Edge Function that sends beautiful confirmation emails to guests who book sessions through public booking links.

## Features

- ✅ Beautiful HTML email template
- ✅ Plain text fallback
- ✅ All session details included
- ✅ Instructor information
- ✅ Location and directions
- ✅ What to bring section
- ✅ Booking confirmation ID

## Setup

This function uses [Resend](https://resend.com) to send emails.

### Prerequisites

1. A Resend account (free tier includes 100 emails/day)
2. Supabase CLI installed
3. A verified domain (or use Resend's test domain for development)

## How to Deploy

### Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

### Step 2: Set Environment Variable

```bash
# Set the Resend API key in Supabase
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Step 3: Deploy the Function

```bash
# Deploy the function to Supabase
supabase functions deploy send-booking-confirmation
```

### Step 4: Verify Domain (Production)

For production use, you need to verify your domain in Resend:

1. Go to Resend dashboard > Domains
2. Add your domain (e.g., `pickupapp.io`)
3. Add the DNS records they provide
4. Wait for verification
5. Update the `from` address in `index.ts` to use your domain

For testing, you can use Resend's test domain: `onboarding@resend.dev`

## Usage

The function is automatically called when a guest books a session through the public booking link.

### Manual Test

You can test the function manually:

```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/send-booking-confirmation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"test@example.com","guestName":"John Doe","sessionTitle":"Morning Yoga","sessionDate":"Saturday, Jan 10, 2026","sessionTime":"7:00 PM","venueName":"Pick Up Studio","venueAddress":"2500 South Miami Avenue","instructorName":"Jane Smith","cost":0,"bookingId":"abc123"}'
```

## Email Template

The email includes:

- ✅ Confirmation checkmark
- 📅 Session date and time
- 📍 Venue location and address
- 👤 Instructor name
- 💰 Cost (or "Free")
- 📋 What to bring checklist
- 🆔 Booking confirmation ID

## Customization

### Change the "From" Email

Edit line in `index.ts`:
```typescript
from: 'Pick Up <bookings@yourdomain.com>',
```

### Modify Email Template

The HTML template starts at line ~50. Customize:
- Colors (currently uses gradient green)
- Logo/branding
- What to bring list
- Footer text

### Add More Fields

To include additional information:

1. Add the field to the request body in `index.ts`
2. Add it to the email template HTML
3. Update the calling code in `app/book/[id]/page.tsx`

## Troubleshooting

### Emails not sending?

1. Check Resend API key is set: `supabase secrets list`
2. Check function logs: `supabase functions logs send-booking-confirmation`
3. Verify domain in Resend dashboard
4. Check spam folder

### "Invalid API key" error?

Re-set the secret:
```bash
supabase secrets set RESEND_API_KEY=re_your_actual_key
```

### Test domain restrictions?

Resend's test domain can only send to verified emails in your account. Add your test email in Resend dashboard or verify your own domain.

## Cost

- **Resend Free Tier:** 100 emails/day, 3,000/month
- **Resend Pro:** $20/month for 50,000 emails
- **Supabase Edge Functions:** Free tier includes 500K requests/month

## Support

For issues with:
- Email delivery: Check [Resend docs](https://resend.com/docs)
- Edge Functions: Check [Supabase docs](https://supabase.com/docs/guides/functions)
