# Pickup - Web App

A full-featured web application for finding and hosting pickleball games, built with Next.js and connected to your existing Supabase backend.

## 🚀 Features

- **User Authentication** - Sign up, sign in, and secure account management
- **Browse Games** - Discover pickleball games in your area with filtering
- **Create Games** - Host your own games and manage RSVPs
- **Game Details** - View game information and RSVP (Going, Maybe, Can't Go)
- **My Games** - Track games you're hosting and attending
- **Profile Management** - Edit your profile and view account information
- **Messaging** - View conversations with other players
- **Settings** - Manage account, view legal pages, and delete account
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (shared with iOS app)
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (via Supabase)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd pickup-web
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your Supabase credentials:

```bash
cp env.local.example .env.local
```

Edit `.env.local` and add your Supabase project details:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To find your Supabase credentials:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 3. Update Next.js Config (Optional)

If you're using Supabase Storage for images, update `next.config.js` with your Supabase project domain:

```js
images: {
  domains: ['your-project-id.supabase.co'],
},
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Requirements

This web app uses the **same Supabase database** as your iOS app. No additional database setup is required!

The app expects these tables (which you already have):
- `profiles` - User profiles
- `games` - Game listings
- `rsvps` - Game RSVPs
- `messages` - User messages
- `conversations` - Message conversations

**Account Deletion:** Make sure your `delete_user_account` function exists in Supabase (from your iOS setup).

## 📱 Pages Overview

| Route | Description |
|-------|-------------|
| `/` | Landing page (public) |
| `/auth/login` | Sign in page |
| `/auth/signup` | Sign up page with profile setup |
| `/home` | Main feed of all games (protected) |
| `/create-game` | Create a new game (protected) |
| `/game/[id]` | Game details and RSVP (protected) |
| `/my-games` | Your hosted and joined games (protected) |
| `/profile` | Your profile page (protected) |
| `/messages` | Message conversations (protected) |
| `/settings` | Account settings (protected) |
| `/legal/privacy` | Privacy policy (public) |
| `/legal/terms` | Terms of service (public) |

## 🎨 Customization

### Colors

The app uses your brand colors defined in `tailwind.config.ts`:

```ts
colors: {
  'neon-green': '#D3FD00',
  'neon-green-dark': '#B8E000',
  'navy': '#0F1B2E',
  'navy-light': '#1A2B4A',
  'sky-blue': '#4A9EBF',
  'sky-blue-light': '#7BB8D0',
}
```

Update these to match your brand if needed.

### Styling Classes

Common utility classes are defined in `app/globals.css`:
- `.btn-primary` - Primary action button (neon green)
- `.btn-secondary` - Secondary button (navy)
- `.btn-outline` - Outlined button
- `.input-field` - Form input styling
- `.card` - Card container
- `.game-card` - Game listing card

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

Your app will be live at `your-project.vercel.app`

### Other Deployment Options

- **Netlify:** Similar process to Vercel
- **Railway:** Supports Node.js and Next.js
- **AWS Amplify:** For AWS ecosystem
- **Self-hosted:** Run `npm run build` then `npm start`

## 🔒 Security Notes

1. **Row Level Security (RLS):** Ensure your Supabase tables have proper RLS policies
2. **Environment Variables:** Never commit `.env.local` to version control
3. **API Keys:** Only use the `anon` key (not the `service_role` key) in the frontend
4. **CORS:** Configure Supabase CORS settings if needed for your domain

## 📊 Features Comparison with iOS App

| Feature | iOS App | Web App |
|---------|---------|---------|
| Authentication | ✅ | ✅ |
| Browse Games | ✅ | ✅ |
| Create Games | ✅ | ✅ |
| RSVP to Games | ✅ | ✅ |
| Profile Management | ✅ | ✅ |
| Messaging | ✅ | ✅ (Basic) |
| Real-time Updates | ✅ | 🚧 (Can be added) |
| Push Notifications | ✅ | ❌ (Web Push can be added) |
| Location Services | ✅ | ✅ (Browser API) |
| Contacts Import | ✅ | ❌ |

## 🔄 Real-time Features (Optional Enhancement)

To add real-time updates for games and messages:

```typescript
// Example: Real-time game updates
useEffect(() => {
  const channel = supabase
    .channel('games')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'games'
    }, (payload) => {
      // Update games list
      fetchGames()
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## 🐛 Troubleshooting

**Issue: "Invalid API key"**
- Check that your `.env.local` file exists and has the correct keys
- Restart the dev server after adding environment variables

**Issue: "Network request failed"**
- Verify your Supabase project is active
- Check your internet connection
- Verify the Supabase URL is correct

**Issue: "Database query failed"**
- Ensure RLS policies allow authenticated users to read data
- Check that all required tables exist in Supabase

**Issue: Build errors**
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild: `rm -rf .next && npm run dev`

## 📞 Support

For issues or questions:
- Email: massimochiarini25@gmail.com
- Create an issue in your repository

## 📄 License

© 2026 Pickup. All rights reserved.

---

**Built with ❤️ for the pickleball community**

