# 🚀 Quick Start Guide

Get your Pickup web app running in 5 minutes!

## Step 1: Install Node.js (if not already installed)

Check if you have Node.js installed:
```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org) (use LTS version).

## Step 2: Install Dependencies

```bash
cd /Users/massimo/Desktop/pickup/pickup-web
npm install
```

This will take 1-2 minutes.

## Step 3: Configure Supabase

1. Create `.env.local` file in the `pickup-web` folder:
```bash
cp env.local.example .env.local
```

2. Open `.env.local` in a text editor and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Go to [app.supabase.com](https://app.supabase.com)
- Click your project
- Go to Settings → API
- Copy "Project URL" and "anon public" key

## Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test It Out

1. **Sign Up**: Create a new account at `/auth/signup`
2. **Create a Game**: Click "Create Game" button
3. **Browse Games**: View all games on the home feed
4. **RSVP**: Click a game to view details and RSVP

## 🎉 You're Done!

The web app is now connected to the same backend as your iOS app. Any games created in either app will appear in both!

## Next Steps

- **Deploy to Production**: See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- **Customize Branding**: Update colors in `tailwind.config.ts`
- **Add Features**: See README.md for enhancement ideas

## Common Issues

### "Command not found: npm"
→ Install Node.js from [nodejs.org](https://nodejs.org)

### "Module not found" errors
→ Run `npm install` again

### Can't connect to Supabase
→ Double-check your `.env.local` file has the correct credentials

### Port 3000 already in use
→ Run on a different port: `npm run dev -- -p 3001`

## Need Help?

Email: massimochiarini25@gmail.com

