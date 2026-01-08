# Remove Class Analytics Section

## Issue
User is seeing a "Class Analytics" section when viewing yoga game details from the mobile app that shows:
- 📊 Class Analytics header
- 👥 Students Enrolled
- 💵 Total Revenue
- ⚡ Your Earnings
- Revenue breakdown with 50% instructor cut

## Investigation Results
- ❌ Analytics section NOT found in `/pickup-web/app/game/[id]/page.tsx` (current web app)
- ❌ Analytics section NOT found in `Pick up App/Views/GameDetail/GameDetailView.swift` (mobile app)
- ⚠️ Documentation mentions analytics (`CLASS_ANALYTICS_COMPLETE.md`) but code doesn't exist

## Possible Causes
1. **Old cached version** - User viewing cached web page
2. **Analytics page separately** - May exist at `/analytics` route
3. **Different navigation** - User accessed through different flow

## Solution

### Option 1: Clear Browser/App Cache
**For Web App:**
1. Open browser dev tools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

**For Mobile App:**
1. Delete app and reinstall
2. Or: Settings → Safari → Clear History and Website Data

### Option 2: Verify Current State
The current game detail pages DO NOT have analytics sections:

**Web:** `/pickup-web/app/game/[id]/page.tsx` - Lines 1-561
- ✅ No analytics section present
- Shows: Game details, RSVP button, instructor claiming, attendees list

**Mobile:** `/Pick up App/Views/GameDetail/GameDetailView.swift` - Lines 1-827  
- ✅ No analytics section present
- Shows: Hero image, title, about, players, chat, map

### Option 3: Check Analytics Dashboard
If there's a separate analytics dashboard page, ensure user isn't confusing it:
- Check `/pickup-web/app/analytics/page.tsx` (folder exists but empty)
- This would be accessed via navigation menu, not game detail

## Files to Check

If analytics section exists somewhere, search these locations:
```bash
# Web app
pickup-web/app/game/[id]/
pickup-web/app/analytics/
pickup-web/components/

# Mobile app  
Pick up App/Views/GameDetail/
Pick up App/Components/
```

## Status
✅ **Confirmed: NO analytics section in current code**

If user is still seeing it, it's likely:
1. Cached content
2. Old build
3. Different app version

**Recommendation:** Deploy latest code and clear all caches.
