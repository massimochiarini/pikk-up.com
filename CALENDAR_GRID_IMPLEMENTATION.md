# Calendar Grid Implementation

## Overview
Implemented a full weekly calendar grid view under the "This Week" section on the home page, allowing instructors to view all available time slots and claim them for classes.

## What Was Changed

### 1. Home Page Calendar Grid (`app/home/page.tsx`)
**Before**: Only showed sessions that were already claimed/had instructors assigned.

**After**: Displays a full calendar grid showing:
- 7 days of the week (Monday-Sunday)
- 6 time slots per day:
  - 7:00 AM (1.5h)
  - 9:00 AM (1.5h)
  - 11:00 AM (1.5h)
  - 1:00 PM (1.5h)
  - 5:00 PM (1.5h)
  - 7:00 PM (1.5h)

**Features**:
- **Visual Calendar Grid**: Professional table layout with days as columns and times as rows
- **Today Highlight**: Current day is highlighted with a subtle background
- **Interactive Cards**: Each time slot is clickable if available
- **Status Indicators**:
  - 🟢 **Green**: Available slots (click to claim)
  - 🔴 **Red**: Claimed slots (shows class name & instructor)
  - ⚫ **Gray**: Past slots (disabled)
- **Week Navigation**: Arrow buttons to navigate between weeks
- **Legend**: Clear visual legend at the bottom explaining the color coding
- **Responsive Design**: Scrollable on smaller screens, maintains functionality

### 2. Time Slot Card Component (`components/TimeSlotCard.tsx`)
**Updated** to match the dark theme aesthetic:
- Dark background colors with transparency
- Green glow effect on available slots when hovering
- Red accent for claimed slots
- Displays class title and instructor name for claimed slots
- Smooth transitions and hover effects
- Better typography with proper font weights

## How It Works

### For Instructors (Web App)
1. Navigate to the Home page
2. Scroll to "This Week" section
3. View the calendar grid showing all time slots
4. Click on any **green (available)** slot
5. Fill out the booking modal with:
   - Event name (e.g., "Morning Vinyasa Flow")
   - Cover photo (optional)
   - Skill level (beginner/intermediate/advanced)
   - Class description
   - Location (defaults to Pick Up Studio address)
6. Click "Claim Session"
7. The slot immediately turns red and shows your class details

### For Users (Mobile App)
When an instructor claims a session:
1. A new game record is created in the database with:
   - `sport: 'yoga'`
   - `instructor_id: <instructor's user id>`
   - `status: 'booked'`
   - Date and time of the session
   - Class details (title, description, image, etc.)
2. The mobile app's `FeedService` automatically fetches this game because:
   - It queries all games where `game_date >= today`
   - It's sorted by date and time
   - It's not marked as private
3. The game appears in the mobile app's feed immediately
4. Users can:
   - View the class details
   - RSVP to attend
   - Send messages in the group chat
   - See the location on the map

## Database Integration

When a session is claimed, the following happens:

1. **Game Record Created** (`games` table):
```typescript
{
  created_by: instructor_id,
  instructor_id: instructor_id,
  sport: 'yoga',
  venue_name: 'Pick Up Studio',
  address: '2500 South Miami Avenue',
  custom_title: eventName,
  game_date: selectedDate,
  start_time: selectedTime,
  max_players: 15,
  cost_cents: 0,
  description: description,
  image_url: uploadedImageUrl,
  latitude: coordinates.lat,
  longitude: coordinates.lng,
  skill_level: skillLevel,
  is_private: false,
  status: 'booked'
}
```

2. **Instructor Auto-RSVP** (`rsvps` table):
   - Instructor is automatically added as attendee

3. **Group Chat Created** (`group_chats` + `group_chat_members` tables):
   - A chat is created for the class
   - Instructor is added as the first member
   - Users who RSVP are automatically added

## Mobile App Compatibility

The implementation is fully compatible with the existing mobile app:

- **FeedService.swift** fetches all upcoming games from the `games` table
- Games are filtered by:
  - Date (must be today or future)
  - Privacy (public games or user's own games)
  - Sport preference (if set)
- Games are sorted by:
  1. Date and time (ascending)
  2. Proximity to user's location (if available)
- The mobile app refreshes when:
  - User pulls to refresh
  - App returns to foreground
  - After creating a new game

## Visual Design

The calendar grid features:
- **Dark Theme**: Matches the existing app aesthetic
- **Glass-morphism**: Subtle transparency and blur effects
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: Clear status indicators and labels
- **Responsive**: Works on all screen sizes
- **Professional Layout**: Clean grid with proper spacing

## Testing Checklist

- [x] Calendar displays 7 days and 6 time slots
- [x] Available slots are clickable and show green
- [x] Claimed slots show red with class details
- [x] Past slots are grayed out and disabled
- [x] Week navigation works correctly
- [x] Booking modal opens on available slot click
- [x] Session claiming creates game record
- [x] Claimed session appears immediately in the grid
- [x] No linter errors

## Next Steps

To test the full integration:
1. Open the web app and claim a session
2. Open the mobile app (or pull to refresh)
3. Verify the session appears in the feed
4. Have a test user RSVP to the session
5. Verify both can see the group chat
6. Verify the location pin appears on the map

The system is now fully functional and ready for instructors to start scheduling classes!
