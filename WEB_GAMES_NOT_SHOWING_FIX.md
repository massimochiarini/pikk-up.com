# Web-Created Games Not Showing on Mobile - Fix Summary

## Problem
Sessions booked via the web app are not appearing in the mobile app, even though they show correctly on the web.

## Root Cause
The Swift `Game` model was missing the `status` field that was added to the database for web-managed sessions. While Swift's Codable should ignore unknown fields, this could cause issues in some edge cases.

## Changes Made

### 1. Updated Swift Game Model (`Pick up App/Models/Game.swift`)
Added the `status` field to properly handle web-created sessions:

```swift
let status: String? // Session status: 'available' or 'booked' (used by web app)
```

Added to CodingKeys, decoder, and encoder.

### 2. Created Diagnostic SQL (`Database/diagnose_web_games.sql`)
SQL queries to check:
- All games created today/recently
- RSVP counts for games
- Games with mismatched status/instructor_id
- Database schema verification

## Next Steps to Debug

### Step 1: Run the Diagnostic SQL
Execute `Database/diagnose_web_games.sql` in your Supabase SQL Editor to check:
1. Are web-created games actually in the database?
2. Do they have the correct `status` field?
3. Do they have proper `instructor_id` values?
4. Are there RSVPs attached?

### Step 2: Check Mobile App Logs
In Xcode, look for FeedService logs when the app launches:
```
🎮 [FeedService] Fetching games with date >= ...
🎮 [FeedService] Raw games fetched from database: X
🎮 [FeedService] Games after filtering: X
```

This will tell you if:
- Games are being fetched from the database
- Games are being filtered out (hasPassed check)

### Step 3: Rebuild the Mobile App
After updating the Game model:
1. Clean build folder (Shift + Cmd + K)
2. Rebuild and run (Cmd + R)
3. Pull to refresh in the app

### Step 4: Verify Database Columns
Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'games'
ORDER BY column_name;
```

Make sure these columns exist:
- `instructor_id` (uuid)
- `status` (text)
- `sport` (text)

## Possible Additional Issues

### Issue A: RLS Policies
Check if Row Level Security policies are preventing reads:
```sql
SELECT * FROM games WHERE id = 'YOUR_GAME_ID';
```

Try this as the authenticated user from mobile.

### Issue B: Time Zone Issues
Web app might be storing dates in a different timezone. Check:
```sql
SELECT 
    game_date,
    start_time,
    game_date::timestamp + start_time::time as full_datetime,
    NOW() as current_time
FROM games
WHERE game_date >= CURRENT_DATE;
```

### Issue C: Sport Filter
Web app sets `sport: 'yoga'` correctly, but verify there's no typo:
```sql
SELECT DISTINCT sport FROM games;
```

## Web App Behavior (Confirmed Working)
The web app (`app/home/page.tsx`) correctly creates games with:
- `sport: 'yoga'` ✅
- `instructor_id: user.id` ✅
- `status: 'booked'` ✅
- `is_private: false` ✅
- All required fields ✅

## Mobile App Fetch Query (Confirmed)
`FeedService.swift` and `GameService.swift` fetch games:
- No sport filter (fetches all sports)
- Filters by `game_date >= today`
- Filters out `hasPassed` games
- Filters out `isPrivate` unless created by user

Both should work for web-created yoga sessions.

## Most Likely Fix
Rebuild the mobile app after the Game model update. The missing `status` field could potentially cause JSON decoding issues in some scenarios, even though it should be ignored.
