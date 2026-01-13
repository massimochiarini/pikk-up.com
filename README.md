# PikkUp - Yoga Studio Marketplace

A two-sided web application for hosting yoga sessions. Students browse and book classes, instructors claim time slots and create class listings.

## Features

### For Students
- Browse available yoga classes
- Filter by date and skill level
- Book and pay for classes via Stripe
- Receive SMS confirmations with booking details

### For Instructors
- View studio's available time slots
- Claim slots and create class listings
- Set pricing, capacity, and class details
- Get shareable booking links
- View registered students for each class

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe Checkout
- **SMS**: Twilio (via Supabase Edge Functions)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp env.local.example .env.local
```

Update `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Set Up Database

Run the SQL migration in your Supabase SQL Editor:

```bash
# File: supabase/migrations/001_initial_schema.sql
```

This creates the following tables:
- `profiles` - User accounts with instructor flag
- `time_slots` - Studio-defined available time slots
- `classes` - Yoga classes created by instructors
- `bookings` - Student reservations
- `payments` - Stripe payment records

### 4. Deploy Supabase Edge Function

Deploy the SMS confirmation function:

```bash
supabase functions deploy send-sms-confirmation
```

Set the Twilio secrets:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

### 5. Configure Stripe Webhook

Add a webhook endpoint in your Stripe Dashboard:
- URL: `https://your-domain.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `checkout.session.expired`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/classes` | Browse available classes |
| `/book/[classId]` | Public booking form |
| `/booking-success` | Post-payment confirmation |
| `/auth/login` | Student sign in |
| `/auth/signup` | Student registration |

### Instructor
| Route | Description |
|-------|-------------|
| `/instructor` | Instructor dashboard |
| `/instructor/schedule` | View/claim time slots |
| `/instructor/create/[slotId]` | Create class form |
| `/instructor/my-classes` | Manage classes |
| `/instructor/class/[classId]` | Class details & bookings |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables for Vercel

Add all variables from `.env.local` to your Vercel project settings.

## Studio Location

Default studio location is configured as:
- **PikkUp Studio**
- 2500 South Miami Avenue

Update the address in the codebase if your studio is elsewhere.

## License

© 2026 PikkUp. All rights reserved.
