# Complete Fix - Studio Session Display Issues

## The Real Problem

Your **existing game in the database** was created with:
- ❌ `custom_title: null` (shows "Pick Up Studio")
- ❌ `max_players: 4` (shows "1/4")

The web app code is **correct** for NEW sessions, but the old session needs to be fixed or recreated.

## Solution: Delete and Recreate

### Step 1: Delete the Old Session

**On Web App:**
1. Go to `pikk-up-com.vercel.app/my-games`
2. Find "Pick Up Studio - Jan 8, 5:00 PM"
3. Click on it
4. Click "Cancel Session" or delete button
5. Confirm deletion

**OR in Supabase SQL Editor:**
```sql
-- Find the game ID first
SELECT id, custom_title, venue_name, game_date, start_time, max_players
FROM games
WHERE game_date = '2026-01-08' 
  AND start_time = '17:00:00'
  AND instructor_id IS NOT NULL;

-- Then delete it (replace with actual ID from above)
DELETE FROM games 
WHERE id = 'your-game-id-here';
```

### Step 2: Create New Session Correctly

**On Web App (`pikk-up-com.vercel.app/home`):**

1. **Click on Jan 8 at 5:00 PM slot**

2. **In the modal, fill out:**
   ```
   Event Name: Evening Relaxing Session
   ↑ THIS IS CRITICAL - Don't leave blank!
   
   Description: Everyone welcome to a relaxing yoga session
   
   Skill Level: Beginner
   
   Cover Photo: [Upload image]
   
   Location: [Adjust pin if needed]
   ```

3. **Click "Claim Session"**

4. ✅ New session will have:
   - `custom_title: "Evening Relaxing Session"`
   - `max_players: 15`
   - `instructor_id: your-user-id`

### Step 3: Verify on Mobile

1. **Close the mobile app completely** (swipe up in app switcher)
2. **Reopen the app**
3. **Pull down to refresh** on Home tab
4. ✅ Should show:
   - Title: "Evening Relaxing Session" (not "Pick Up Studio")
   - "with Massimo Chiarini"
   - "1/15 attending" (not "1/4")

---

## Why This Happened

### The Existing Game Was Created BEFORE Updates

Looking at when the code was updated:
1. **Before:** Web app might have been missing `custom_title` field
2. **Before:** Web app might have had `max_players: 4`
3. **Now:** Web app has both fields correct

But your **existing game** in the database still has old values:

```sql
-- Current game (in database)
{
  custom_title: null,           ← Shows "Pick Up Studio"
  max_players: 4,               ← Shows "1/4"
  instructor_id: "abc123",      ← Works! Shows instructor name
  ...
}
```

### The Web App Code Is Correct NOW

Looking at `pickup-web/app/home/page.tsx` line 132-151:

```typescript
.insert({
  created_by: user.id,
  instructor_id: user.id,          ✅ Working
  sport: 'yoga',
  venue_name: 'Pick Up Studio',
  custom_title: eventName,         ✅ Correct!
  game_date: selectedSlot.date,
  start_time: selectedSlot.time,
  max_players: 15,                 ✅ Correct!
  cost_cents: 0,
  description: description || null,
  image_url: imageUrl,
  latitude: latitude,
  longitude: longitude,
  skill_level: skillLevel || null,
  ...
})
```

So **new sessions** will work perfectly!

---

## Alternative: Update Existing Game (Not Recommended)

If you want to keep the same game and just update it:

```sql
-- Update the existing game
UPDATE games 
SET 
  custom_title = 'Evening Relaxing Session',
  max_players = 15
WHERE game_date = '2026-01-08' 
  AND start_time = '17:00:00'
  AND instructor_id IS NOT NULL;
```

But **deleting and recreating** is cleaner because:
- Ensures all fields are correct
- Resets RSVP count properly
- Creates fresh group chat
- No orphaned data

---

## Testing Checklist

After recreating the session:

### On Web App
- [ ] Session shows in schedule
- [ ] Has your custom title
- [ ] Shows as "Claimed"
- [ ] Can see in "My Classes"

### On Mobile App (after restart + refresh)
- [ ] Card shows custom title (not "Pick Up Studio")
- [ ] Shows "with [Your Name]"
- [ ] Shows "1/15 attending"
- [ ] No address line on card
- [ ] Clicking shows full details

### Key Things to Remember

1. **Always enter Event Name** when claiming a slot
   - This becomes the `custom_title`
   - Without it, falls back to "Pick Up Studio"

2. **Web app automatically sets max_players: 15**
   - This is in the code
   - New sessions will always have 15 spots

3. **Mobile app reads from database**
   - Shows whatever is in the database
   - Old games have old values
   - New games have new values

---

## Summary

**The Fix:**
1. Delete the old Jan 8, 5:00 PM session
2. Create a new session with "Event Name" filled in
3. Restart mobile app and refresh

**Why:**
- Old game has `custom_title: null` and `max_players: 4`
- Web app code is already correct for new games
- Just need to recreate with proper values

**Expected Result:**
```
┌──────────────────────────────────────────┐
│  [Beautiful Cover Photo]                 │
│                                          │
│  Evening Relaxing Session    🍃 Free    │
│                                          │
│  📅 Thu, Jan 8 · 5:00 PM                │
│  👤 with Massimo Chiarini                │
│  👥 1/15 attending                       │
└──────────────────────────────────────────┘
```

✅ This WILL work because the code is correct!

---

**Bottom line:** Delete the old game and create a new one. Make sure to fill in the "Event Name" field. The code is already set up correctly! 🎯
