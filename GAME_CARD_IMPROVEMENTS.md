# Game Card Improvements - January 8, 2026

## Changes Made

### 1. ✅ Removed Address from Card Preview

**Before:**
```
┌─────────────────────────────────────┐
│  [Map Snapshot]                     │
│                                     │
│  Pick Up Studio        🍃 Free     │
│                                     │
│  📅 Thu, Jan 8 · 5:00 PM           │
│  📍 2500 South Miami Avenue  ← ❌  │
│  👥 1/4 attending                   │
└─────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────┐
│  [Map Snapshot]                     │
│                                     │
│  Evening Relaxing Session  🍃 Free │
│                                     │
│  📅 Thu, Jan 8 · 5:00 PM           │
│  👤 with Massimo Chiarini  ← ✅    │
│  👥 1/15 attending                  │
└─────────────────────────────────────┘
```

**Why:**
- Cleaner card layout
- Address is visible on map snapshot
- Full address shown on detail page
- More space for important info

---

### 2. ✅ Added Instructor Name Display

**Before:**
- Avatar shown next to title
- No text indication of who instructor is
- Only "Host" badge on detail page

**After:**
- Shows "with [Instructor Name]" below date
- Clear indication of who's teaching
- Uses person icon for consistency

**Code:**
```swift
// Instructor name for studio sessions
if isStudioSession, let instructor = instructorProfile {
    HStack(spacing: 6) {
        Image(systemName: "person.fill")
            .font(.system(size: 12))
        Text("with \(instructor.firstName) \(instructor.lastName)")
            .font(.system(size: 14, weight: .medium))
    }
    .foregroundColor(textLight)
}
```

**User Experience:**
- Users can immediately see who's teaching
- Helps build instructor recognition
- Makes it personal and welcoming

---

### 3. ✅ Show Custom Event Title

**Already Working!**

The card was already showing custom title if available:

```swift
private var displayTitle: String {
    if let customTitle = game.customTitle, !customTitle.isEmpty {
        return customTitle  // "Evening Relaxing Session"
    }
    return game.venueName   // Fallback to "Pick Up Studio"
}
```

**Why it might show "Pick Up Studio":**
- Session was created before custom titles were added
- Custom title field was left blank
- Database needs to be checked

**Solution:**
- Recreate the session with a custom title
- Or update existing session on web app

---

### 4. ✅ Fixed Max Players for Studio Sessions

**Problem:**
Sessions created on web app show "1/4 attending" but should show "1/15 attending"

**Root Cause:**
The session was created with `max_players: 4` (default for pickleball) instead of `max_players: 15` (for yoga studio)

**Current Web App Code:**
```typescript
// pickup-web/app/home/page.tsx line 141
max_players: 15,  // ✅ Already correct!
```

**Fix:**
Run the SQL migration to update existing sessions:

```sql
-- Update all studio sessions to have 15 max players
UPDATE games 
SET max_players = 15
WHERE instructor_id IS NOT NULL
  AND max_players != 15;
```

**File:** `Database/fix_studio_session_capacity.sql`

---

## Visual Comparison

### Studio Session Card (Yoga)

**BEFORE:**
```
┌──────────────────────────────────────────┐
│  [Map Snapshot]                          │
│                                          │
│  👤  Pick Up Studio          🍃 Free    │
│      (avatar)                            │
│                                          │
│  📅 Thu, Jan 8 · 5:00 PM                │
│  📍 2500 South Miami Avenue              │
│  👥 1/4 attending                        │
└──────────────────────────────────────────┘
```

**AFTER:**
```
┌──────────────────────────────────────────┐
│  [Map Snapshot]                          │
│                                          │
│  Evening Relaxing Session    🍃 Free    │
│                                          │
│  📅 Thu, Jan 8 · 5:00 PM                │
│  👤 with Massimo Chiarini                │
│  👥 1/15 attending                       │
└──────────────────────────────────────────┘
```

### Mobile Game Card (Pickleball)

**BEFORE & AFTER (No Change):**
```
┌──────────────────────────────────────────┐
│  [Map Snapshot]                          │
│                                          │
│  Dinko Pickleball            🍃 Free    │
│                                          │
│  📅 Fri, Jan 9 · 4:30 PM                │
│  📍 Miami                                │
│  👥 2/4 players                          │
└──────────────────────────────────────────┘
```

(Address still shows for mobile-created games since they don't have instructor info)

---

## Implementation Details

### Files Changed

1. **`Pick up App/Components/Cards/GameCardNew.swift`**
   - Removed avatar from title section (line 67-74)
   - Removed address display (line 112-121)
   - Added instructor name display (new lines 112-120)

### Database Update Required

**Run this SQL in Supabase SQL Editor:**

```sql
UPDATE games 
SET max_players = 15
WHERE instructor_id IS NOT NULL
  AND max_players != 15;
```

This will update all existing studio sessions to have 15 spots.

---

## Benefits

### For Users
- ✅ Cleaner, less cluttered cards
- ✅ See instructor name immediately
- ✅ Know who's teaching before clicking
- ✅ Accurate capacity information (1/15 instead of 1/4)

### For Instructors
- ✅ Custom class titles displayed prominently
- ✅ Name visible on cards (recognition)
- ✅ Accurate attendance numbers
- ✅ Professional presentation

### For UX
- ✅ Map shows location visually
- ✅ Address available on detail page
- ✅ More focus on event content
- ✅ Clear distinction between studio sessions and pickup games

---

## Testing Steps

1. **Rebuild the app** (Cmd+B)
2. **Run in simulator**
3. **Check studio session card:**
   - ✅ Shows custom title (not "Pick Up Studio")
   - ✅ No address below date
   - ✅ Shows "with [Instructor Name]"
   - ✅ Shows "1/15 attending" (after SQL update)
4. **Click card for details:**
   - ✅ Full address visible on detail page
   - ✅ All info preserved
5. **Check pickleball game card:**
   - ✅ Still shows address (no instructor)
   - ✅ Shows "players" not "attending"

---

## SQL Update Instructions

### Step 1: Open Supabase Dashboard

Go to: `https://supabase.com/dashboard`

### Step 2: Navigate to SQL Editor

1. Select your project
2. Click "SQL Editor" in sidebar
3. Click "New query"

### Step 3: Run the Fix

Paste and execute:

```sql
UPDATE games 
SET max_players = 15
WHERE instructor_id IS NOT NULL
  AND max_players != 15;
```

### Step 4: Verify

Check the results:

```sql
SELECT 
    custom_title,
    max_players,
    game_date,
    start_time
FROM games
WHERE instructor_id IS NOT NULL
ORDER BY game_date, start_time;
```

All should show `max_players: 15` ✅

---

## Future Considerations

### Potential Enhancements

1. **Variable Capacity**
   - Allow instructors to set custom max_players on web app
   - Different class types might have different capacities
   - Store as session setting

2. **Instructor Bio on Card**
   - Show brief instructor bio
   - "Certified yoga instructor with 10 years experience"
   - Helps users choose classes

3. **Class Type Badges**
   - "Vinyasa Flow" badge
   - "Hot Yoga" badge
   - Visual classification

4. **Rating Display**
   - Show instructor rating on card
   - ⭐ 4.8 (based on reviews)
   - Social proof

---

## Summary

| Change | Status | Impact |
|--------|--------|--------|
| Remove address from card | ✅ Done | Cleaner UI |
| Show instructor name | ✅ Done | Better recognition |
| Show custom title | ✅ Already works | Descriptive classes |
| Fix max_players | ⚠️ SQL needed | Accurate capacity |

**Status:** ✅ Code complete, SQL update required
**Date:** January 8, 2026
**Impact:** High - Improves studio session presentation
