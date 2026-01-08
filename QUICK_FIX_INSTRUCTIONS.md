# 🚀 Quick Fix - Make Your Yoga Session Appear

## The Problem

Your yoga session **exists** in the database, but your mobile app is filtering it out because:
- ❌ Your sport preference is set to "pickleball" only
- ✅ Your session is marked as sport "yoga"
- ❌ App filters out games that don't match your preference

## The Solution (Choose One)

### ⚡ FASTEST: Change Preference in Mobile App (30 seconds)

1. Open the iOS simulator
2. Tap the **⚙️ Settings** button (top right)
3. Find "Sport Preference"
4. Make sure **BOTH** are selected:
   - ✅ Pickleball
   - ✅ Yoga
5. Go back to Home
6. **Pull down to refresh** the feed
7. ✅ Your yoga session should appear!

### 💾 PERMANENT: Update Database (Fixes for all users)

Run this in your Supabase SQL Editor:

```sql
UPDATE profiles 
SET sport_preference = 'both' 
WHERE sport_preference = 'pickleball' OR sport_preference IS NULL;
```

Then rebuild the iOS app in Xcode.

## What Changed in the Code

✅ Default preference is now **"both"** (was "pickleball")
✅ Games refresh automatically when deleted
✅ Better debug logging for troubleshooting

## After the Fix

Your feed will show:
- 🧘 Yoga sessions from the web app
- 🎾 Pickleball games from mobile or web
- 🔄 Real-time updates when games are deleted

---

**TL;DR:** Go to Settings → Select both Pickleball & Yoga → Pull to refresh ✨
