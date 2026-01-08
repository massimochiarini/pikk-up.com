# Studio Schedule Grid - Restored & Updated

## Overview
Restored the weekly schedule grid showing available time slots for instructors to book at the studio. Updated with new time slots and modern design aesthetic.

## Changes Made

### 1. Updated Time Slots (`pickup-web/app/home/page.tsx`)

**New Time Slots:**
- 8:45 AM
- 10:15 AM
- 11:30 AM
- 4:00 PM
- 6:15 PM
- 7:30 PM

```typescript
const TIME_SLOTS = [
  { time: '08:45:00', display: '8:45 AM', duration: '1.25h' },
  { time: '10:15:00', display: '10:15 AM', duration: '1.25h' },
  { time: '11:30:00', display: '11:30 AM', duration: '1.25h' },
  { time: '16:00:00', display: '4:00 PM', duration: '1.25h' },
  { time: '18:15:00', display: '6:15 PM', duration: '1.25h' },
  { time: '19:30:00', display: '7:30 PM', duration: '1.25h' },
]
```

### 2. Restored Weekly Schedule Grid

The "This Week" section now displays:
- **Grid Layout**: 8 columns (1 for time labels + 7 days of the week)
- **Header Row**: Day names (Mon, Tue, Wed, etc.) and dates
- **Time Slot Rows**: Each time slot shows availability for all 7 days
- **Navigation**: Previous/Next week buttons to browse schedule

### 3. Updated TimeSlotCard Design (`pickup-web/components/TimeSlotCard.tsx`)

**Modern Aesthetic:**
- Black background theme matching the hero section
- White/gray color scheme instead of green/red
- Subtle hover effects with scale and shadow
- Light font weight for elegant look
- Improved spacing and border radius

**Card States:**
1. **Available**: 
   - Semi-transparent white background
   - "Available" + "Click to book" text
   - Hover effect with scale and glow

2. **Claimed/Booked**:
   - Dark gradient background
   - Shows class name and instructor
   - "w/ [Instructor Name]" format

3. **Past**:
   - Grayed out and faded
   - "Past" label
   - Non-interactive

## How It Works

### Booking Flow
1. Instructor clicks an available time slot
2. BookingModal opens with the selected date/time
3. Instructor enters:
   - Event name (custom class title)
   - Description
   - Skill level
   - Cover image
4. On submit, creates:
   - Game record with `instructor_id` set
   - RSVP for the instructor
   - Group chat for the class

### Data Structure
```typescript
{
  created_by: user.id,
  instructor_id: user.id,  // Key field for studio sessions
  sport: 'yoga',
  venue_name: 'Pick Up Studio',
  address: '2500 South Miami Avenue',
  custom_title: eventName,  // Custom class name
  game_date: selectedSlot.date,
  start_time: selectedSlot.time,
  max_players: 15,
  status: 'booked',
  // ... other fields
}
```

### Visual Layout

```
This Week
Jan 5 - Jan 11, 2026                    [←] [→]

        Mon     Tue     Wed     Thu     Fri     Sat     Sun
        Jan 5   Jan 6   Jan 7   Jan 8   Jan 9   Jan 10  Jan 11

8:45 AM  [Card] [Card] [Card] [Card] [Card] [Card] [Card]
10:15 AM [Card] [Card] [Card] [Card] [Card] [Card] [Card]
11:30 AM [Card] [Card] [Card] [Card] [Card] [Card] [Card]
4:00 PM  [Card] [Card] [Card] [Card] [Card] [Card] [Card]
6:15 PM  [Card] [Card] [Card] [Card] [Card] [Card] [Card]
7:30 PM  [Card] [Card] [Card] [Card] [Card] [Card] [Card]
```

## Design Details

### Card Styling
- **Size**: Fixed height of 96px (h-24)
- **Border Radius**: Rounded-xl (12px)
- **Spacing**: 12px gap between cards
- **Typography**: Font-light with tracking-wide
- **Transitions**: 300ms smooth transitions

### Color Palette
- **Available**: `bg-white/5` with `border-white/20`
- **Hover**: `bg-white/10` with `border-white/40`
- **Booked**: Gradient from `gray-800` to `gray-900`
- **Past**: `bg-gray-900/30` with 40% opacity

## Responsive Design
- Horizontal scroll on mobile devices
- Minimum width of 800px for the grid
- Full width on desktop screens
- Touch-friendly card sizes

## Integration
- Works seamlessly with the existing BookingModal
- Fetches and displays real-time availability
- Updates immediately after booking
- Shows instructor names for claimed slots

## Date
January 8, 2026
