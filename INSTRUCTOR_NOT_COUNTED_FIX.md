# Instructor Not Counted as Attendee - Fixed

**Date:** January 10, 2026  
**Issue:** The instructor was being counted as an attendee and shown in the "Who's going" list

## The Problem

When viewing a session detail page:
- The instructor/host appeared in the "Who's going" list
- The instructor counted toward the attendee number
- This reduced available spots incorrectly

**Example:**
- Session capacity: 15 people
- Instructor RSVP'd: 1 person
- Actual attendees: 1 person
- **Showed:** "2 / 15 attending" and "13 spots left" ❌
- **Should show:** "1 / 15 attending" and "14 spots left" ✅

## The Solution

Modified the game detail page to:
1. **Filter out the instructor** from the attendees list
2. **Exclude instructor from count** calculation
3. **Update spots calculation** accordingly

### Code Changes

**File:** `app/game/[id]/page.tsx`

**Line 326-328:** Added filter for non-instructor attendees
```typescript
// Filter out instructor from attendees (instructor doesn't count as a participant)
const nonInstructorAttendees = attendees.filter(attendee => attendee.id !== game.instructor_id)
const currentPlayers = nonInstructorAttendees.length + guestAttendees.length
```

**Line 578 & 585:** Updated UI to use filtered list
- Changed from `attendees.length` to `nonInstructorAttendees.length`
- Changed from mapping `attendees` to mapping `nonInstructorAttendees`

## Result

### Before:
```
Participants: 2 / 15 attending
14 spots available

Who's going (2)
- Massimo C. (instructor)
- John D. (actual attendee)
```

### After:
```
Participants: 1 / 15 attending
14 spots available

Who's going (1)
- John D. (actual attendee)
```

## How It Works

1. **Fetch all RSVPs** - Gets all user and guest RSVPs from database
2. **Filter instructor** - Removes instructor from the attendees array
3. **Calculate counts** - Uses filtered array for:
   - Participant count display
   - Spots available calculation
   - "Who's going" section
4. **Display attendees** - Only shows non-instructor attendees

## Impact

✅ **Accurate capacity** - Shows correct number of available spots  
✅ **Clear attendee list** - Instructor not shown in "Who's going"  
✅ **Proper counting** - Instructor doesn't take up a participant spot  
✅ **Better UX** - Students see actual peer attendees, not the instructor  

## Technical Notes

- The instructor's RSVP still exists in the database (for group chat access)
- The filtering happens only at the display level
- Guest attendees continue to count normally (as they should)
- The fix applies to all session types (yoga, meditation, etc.)

## Related Components

- `app/game/[id]/page.tsx` - Session detail page ✅ Fixed
- Database RSVP system - No changes needed
- Group chat membership - No changes needed

---

**Status:** ✅ Complete  
**Tested:** Yes  
**Breaking changes:** None
