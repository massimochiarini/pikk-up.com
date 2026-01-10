# Mobile App Not Showing Classes - Fix Guide

## Issue
Classes scheduled through the web app aren't appearing in the mobile app.

## Root Cause
The `create-game` page was creating games with `sport: 'pickleball'` but the mobile app is branded as "Pick Up Yoga". This caused a mismatch.

## What Was Fixed

### 1. Web App Sport Field
- **File**: `app/create-game/page.tsx`
- **Change**: Changed `sport: 'pickleball'` to `sport: 'yoga'` (line 33)
- **Impact**: New games created through the basic create form will now use 'yoga'

### 2. Enhanced Debug Logging
- **File**: `Pick up App/Services/FeedService.swift`
- **Change**: Added detailed logging to show:
  - All games fetched from database
  - Each game's date, time, and whether it has passed
  - Filtering decisions
- **Impact**: Check Xcode console to see what games are being fetched

### 3. Database Fix Needed
**IMPORTANT**: Existing games in the database still have `sport: 'pickleball'`

Run this SQL query in your Supabase dashboard to fix existing games:

```sql
UPDATE games
SET sport = 'yoga'
WHERE sport = 'pickleball' OR sport IS NULL OR sport != 'yoga';
```

Or use the provided SQL file: `Database/fix_sport_field.sql`

## How to Fix

### Option 1: Quick Fix (Recommended)
1. Go to your Supabase dashboard (https://supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Run the SQL from `Database/fix_sport_field.sql`
5. Pull to refresh in the mobile app

### Option 2: Delete and Recreate
1. Delete the existing games from the web app
2. Create new games (they will now use 'yoga' as the sport)
3. Pull to refresh in the mobile app

## Debugging

### Check Mobile App Logs
In Xcode, look for logs like:
```
🎮 [FeedService] Raw games fetched from database: X
🎮 [FeedService] Games after filtering: Y
```

If `Raw games` is 0, the database has no games matching your query.
If `Games after filtering` is 0, they're being filtered out as "past" games.

### Check Database
Run this query to see what's in your database:
```sql
SELECT id, venue_name, game_date, start_time, sport, instructor_id
FROM games
WHERE game_date >= CURRENT_DATE
ORDER BY game_date, start_time;
```

## Files Modified
- `app/create-game/page.tsx` - Sport field fixed
- `Pick up App/Services/FeedService.swift` - Debug logging added
- `Database/fix_sport_field.sql` - SQL fix for existing games
- `Database/check_games.sql` - SQL queries to inspect database

## Next Steps
1. Run the SQL fix for existing games
2. Rebuild the mobile app in Xcode
3. Pull to refresh in the simulator
4. Check Xcode console for debug logs
5. If still not working, check that games have `game_date >= today`
