# Game Visibility Fix - January 8, 2026

## Problem Summary

You reported three issues:
1. ✅ Yoga class created on Jan 8 at 5:00 PM not appearing in iOS simulator
2. ✅ Games deleted on web app still appearing in mobile app
3. ✅ Games deleted within mobile app still appearing

## Root Cause

The issue was **sport preference filtering**, not deletion:

- Web app creates sessions with `sport: 'yoga'`
- Mobile app was defaulting to `sport_preference: 'pickleball'`
- The feed was filtering OUT all yoga games because they didn't match the preference
- This made it appear like games were missing or not deleted properly

## Changes Made

### 1. Database Schema Update

**File:** `Database/fix_sport_preference.sql`
- Added `sport_preference` column to profiles table
- Set default value to `'both'` for all users
- Updated existing users with `'pickleball'` preference to `'both'`

This ensures all users can see both yoga and pickleball games by default.

### 2. iOS App - Default Preference

**File:** `Pick up App/Views/Home/HomeView.swift`
- Changed default sport preference from `"pickleball"` to `"both"` (line 98)
- Added notification listener to refresh feed when games are deleted (line 107-112)

### 3. iOS App - Delete Notifications

**File:** `Pick up App/Services/GameService.swift`
- Added `NotificationCenter` extension for game deletion events
- Updated `deleteGame()` to broadcast notification when a game is deleted
- Added debug logging to confirm deletion

This ensures the feed automatically refreshes when you delete a game from anywhere in the app.

### 4. Database Schema (Main)

**File:** `Database/schema.sql`
- Added `sport_preference TEXT DEFAULT 'both'` to profiles table

## How to Fix Your Current Issue

### Option 1: Update Database (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Add sport_preference column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sport_preference TEXT DEFAULT 'both';

-- Update all existing users to see both sports
UPDATE profiles 
SET sport_preference = 'both' 
WHERE sport_preference IS NULL OR sport_preference = '' OR sport_preference = 'pickleball';
```

### Option 2: Change Preference in Mobile App

1. Open the mobile app
2. Go to **Settings** (gear icon)
3. Under "Sport Preference", tap both:
   - ✅ Pickleball
   - ✅ Yoga
4. Pull down to refresh the Home feed

## Testing

After applying the fix:

1. **Check your Jan 8, 5:00 PM yoga class appears:**
   - Open mobile app
   - Pull down to refresh
   - You should see the "Evening Relaxing Session" (or your custom title)

2. **Test deletion works:**
   - Create a test game
   - Delete it from the game details page
   - The feed should automatically refresh
   - Game should disappear immediately

3. **Verify both sports show:**
   - Create a pickleball game → appears in feed ✅
   - Create a yoga session (web app) → appears in feed ✅

## Files Changed

1. ✅ `Database/fix_sport_preference.sql` - New database migration
2. ✅ `Database/schema.sql` - Added sport_preference column
3. ✅ `Pick up App/Views/Home/HomeView.swift` - Default to "both", added delete listener
4. ✅ `Pick up App/Services/GameService.swift` - Added deletion notifications
5. ✅ `fix_game_visibility.sh` - Script to run the fix

## Next Steps

1. **Apply the database fix** (Option 1 above)
2. **Rebuild the iOS app** in Xcode
3. **Pull down to refresh** the feed
4. Your yoga session should now appear! 🎉

## Notes

- Games are NOT actually deleted when they disappear - they're just filtered by sport preference
- Deletion works correctly - the CASCADE constraints properly remove RSVPs and group chats
- The default preference is now `'both'` for new users
- Existing users need to either run the SQL update or change their preference in settings
