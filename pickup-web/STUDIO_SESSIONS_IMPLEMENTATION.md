# Studio Sessions Implementation - Complete

## Overview
The web app home page now displays available studio sessions for instructors to claim. This replaces the previous "discover games" functionality with a merchant-focused session marketplace.

## What Changed

### 1. Database Schema (`Database/add_claimed_by_column.sql`)
Added two new columns to the `games` table:
- `claimed_by` (UUID): References the instructor who claimed the session
- `claimed_at` (TIMESTAMPTZ): Timestamp when the session was claimed

**Key Concept:**
- `created_by` = Studio owner who posted the time slot
- `claimed_by` = Instructor who claimed the slot to host their class

### 2. Home Page (`pickup-web/app/home/page.tsx`)
**Filters:**
- Shows only **yoga** sessions (sport = 'yoga')
- Shows only **unclaimed** sessions (claimed_by IS NULL)
- Shows sessions **up to 30 days** in advance
- Filters out past sessions

**Two Views:**
1. **Available** - Unclaimed sessions ready to be claimed
2. **My Sessions** - Sessions claimed by the logged-in instructor

**Removed:**
- "Joined" filter (not applicable for instructors)
- RSVP functionality (that's for mobile app students)

### 3. UI Updates
**Terminology Changes:**
- "Games" → "Sessions"
- "Discover games" → "Available Studio Sessions"
- "Hosting" → "My Claimed Sessions"
- "Participants" → "Students"

**Card Updates:**
- Shows 🧘 emoji for yoga sessions
- Badge shows "Available" or "Claimed" status
- "Capacity: X students" instead of participant count
- "Claim Session" CTA for available sessions

### 4. Type Definitions (`pickup-web/lib/supabase.ts`)
Added optional fields to `Game` type:
```typescript
claimed_by?: string | null
claimed_at?: string | null
```

## How It Works

### Studio Owner Workflow
1. Studio owner creates time slots (via create-game page)
2. Sets `sport = 'yoga'`, `created_by = owner_id`, `claimed_by = NULL`
3. Sessions appear on marketplace

### Instructor Workflow
1. Browse "Available" sessions on home page
2. See sessions up to 30 days in advance
3. Click to view details and claim session
4. Once claimed, session moves to "My Sessions"
5. Session removed from marketplace (no longer visible to other instructors)

### Student Workflow (Future - Mobile App)
1. Instructor shares link with students
2. Students click link → download app
3. Pay for class via Stripe (50/50 split)
4. RSVP to the session

## Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add claimed_by and claimed_at columns
ALTER TABLE games ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_claimed_by ON games(claimed_by) WHERE claimed_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_games_claimed_by_user ON games(claimed_by) WHERE claimed_by IS NOT NULL;
```

## Testing

### Test Available Sessions
1. Create a yoga session as a studio owner (claimed_by = NULL)
2. Go to home page
3. Should see session under "Available" tab
4. Should show "Available" badge and "Claim Session" button

### Test Claimed Sessions
1. Claim a session (set claimed_by to your user ID)
2. Go to home page → "My Sessions" tab
3. Should see your claimed session
4. Should show "Claimed" badge
5. Session should NOT appear in "Available" tab

### Test 30-Day Filter
1. Create sessions with dates:
   - Today + 15 days (should show)
   - Today + 31 days (should NOT show)
   - Yesterday (should NOT show)

### Test Sport Filter
1. Create pickleball game (sport = 'pickleball')
2. Should NOT appear on web app home page
3. Only yoga sessions should be visible

## Next Steps

1. **Claim Session Functionality** - Add button to claim sessions (updates claimed_by)
2. **Shareable Links** - Generate unique links for instructors to share
3. **Stripe Integration** - Payment processing for students
4. **Revenue Split** - 50/50 split between studio owner and instructor

## Mobile App
**No changes needed** - Mobile app continues to work as before. Pickleball games are only visible on mobile, not on web.

## Key Files Modified
- `/pickup-web/app/home/page.tsx` - Main home page logic
- `/pickup-web/components/GameCard.tsx` - Session card display
- `/pickup-web/lib/supabase.ts` - Type definitions
- `/Database/add_claimed_by_column.sql` - Database migration

## Success Criteria ✅
- [x] Display studio sessions up to 30 days in advance
- [x] Show only sessions with status = available (claimed_by IS NULL)
- [x] Layout reuses existing game cards
- [x] Instructors see bookable studio slots
- [x] Web app is merchant-only (no pickleball games shown)

