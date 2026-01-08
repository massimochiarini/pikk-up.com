# Web vs Mobile Session Management

## Overview

To prevent data inconsistencies and preserve instructor-specific features, sessions created on the web app **cannot be edited** from the mobile app. This ensures that:

- ✅ Cover photos aren't accidentally removed
- ✅ Custom titles are preserved
- ✅ Precise location pins remain accurate
- ✅ Instructor features stay intact

## How It Works

### Session Creation

**Web App (Instructors):**
- Creates sessions with `instructor_id` set
- Can add cover photos, custom titles, precise locations
- Full editing capabilities on web dashboard

**Mobile App (Players):**
- Creates games without `instructor_id`
- Standard game creation (no instructor features)
- Full editing capabilities on mobile

### Session Management

#### Web-Created Sessions (Yoga Studio)

**On Mobile App:**
- ❌ **Cannot edit** game details
- ✅ **Can join/leave** as a participant
- ✅ **Can chat** with other participants
- ✅ **Can view** all session details
- 🔔 Shows "Managed on web" badge

**On Web App:**
- ✅ Full editing capabilities
- ✅ Can update cover photo, title, location
- ✅ Can manage all session details

#### Mobile-Created Sessions (Pickup Games)

**On Mobile App:**
- ✅ Full editing capabilities
- ✅ Can update all game details
- ✅ Can delete game

**On Web App:**
- ✅ Visible in schedule
- ⚠️ Limited editing (depends on implementation)

## Visual Indicators

### Mobile App - Web-Managed Session

When viewing a web-created session as the host:

```
┌─────────────────────────────────────┐
│  Pick Up Studio                     │
│  2500 South Miami Avenue            │
│  Thu, Jan 8 at 5:00 PM              │
│                                     │
│  [🌐 Managed on web]                │
│  [Join] [Get Directions]            │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║ ℹ️ Studio Session             ║  │
│  ║                               ║  │
│  ║ This session was created on   ║  │
│  ║ the web app. To edit details, ║  │
│  ║ use the web dashboard. You    ║  │
│  ║ can still chat with           ║  │
│  ║ participants here.            ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘
```

### Mobile App - Mobile-Managed Session

When viewing a mobile-created game as the host:

```
┌─────────────────────────────────────┐
│  Dinko Pickleball                   │
│  Miami                              │
│  Fri, Jan 9 at 4:30 PM              │
│                                     │
│  [⚙️ Manage] [Get Directions]       │
│                                     │
│  (Full editing capabilities)        │
└─────────────────────────────────────┘
```

## Technical Implementation

### Database Schema

The `instructor_id` field determines management:

```sql
games table:
  - instructor_id UUID (nullable)
    - NULL = mobile-created game (editable on mobile)
    - NOT NULL = web-created session (view-only on mobile)
```

### Code Changes

**File: `Pick up App/Models/Game.swift`**
- Added `instructorId: UUID?` property
- Added `isWebManaged` computed property
- Returns `true` if `instructorId != nil`

**File: `Pick up App/Views/GameDetail/GameDetailView.swift`**
- Updated "Manage" button logic:
  - Shows "Manage" button only for mobile-created games
  - Shows "Managed on web" badge for web-created sessions
- Added info banner explaining web management
- Removed edit sheet for web-managed sessions

### Web App

**File: `pickup-web/app/home/page.tsx`**
- Sets `instructor_id: user.id` when claiming sessions
- This marks the session as web-managed

## User Experience

### For Instructors (Web App Users)

1. **Claim a session** on the web app
2. Add cover photo, custom title, adjust location pin
3. **View on mobile** - see all details, chat with participants
4. **Edit on web** - make any changes to session details

### For Players (Mobile App Users)

1. **Create a game** on mobile app
2. **Edit anytime** on mobile app
3. **View web sessions** - join and chat, but can't edit

### For Hosts of Web Sessions

When you open your web-created session on mobile:

1. ✅ See all session details (photo, title, location)
2. 🔔 See "Managed on web" badge
3. ℹ️ See info banner explaining web management
4. ✅ Can still join and chat with participants
5. 🌐 Edit details by going to web dashboard

## Benefits

### Data Integrity
- ✅ Cover photos won't be accidentally removed
- ✅ Custom titles stay consistent
- ✅ Location pins remain precise

### Clear Separation
- ✅ Web features stay on web
- ✅ Mobile features stay on mobile
- ✅ No confusion about where to edit

### Better UX
- ✅ Clear visual indicators
- ✅ Helpful info messages
- ✅ No accidental data loss

## Future Enhancements

Potential improvements:

1. **Text Blast Feature**
   - Add "Send Message to All" button for hosts
   - Send announcement to all participants
   - Available on both web and mobile

2. **View-Only Editing**
   - Allow viewing edit form but disable save
   - Show "Edit on web" link

3. **Quick Actions**
   - Cancel session (with notification to all)
   - Update time (with notification to all)
   - These could be allowed from mobile

## Testing

### Test Scenario 1: Web-Created Session

1. ✅ Create session on web app
2. ✅ Open mobile app as host
3. ✅ Verify "Managed on web" badge appears
4. ✅ Verify info banner is shown
5. ✅ Verify "Manage" button is NOT shown
6. ✅ Verify can still join and chat

### Test Scenario 2: Mobile-Created Game

1. ✅ Create game on mobile app
2. ✅ Open game details as host
3. ✅ Verify "Manage" button appears
4. ✅ Verify can edit all details
5. ✅ Verify can delete game

### Test Scenario 3: Participant View

1. ✅ Join web-created session
2. ✅ Verify no management options
3. ✅ Verify can join/leave
4. ✅ Verify can chat

## Summary

This separation ensures:
- 🎯 **Instructors** manage their studio sessions on the web
- 🎯 **Players** manage their pickup games on mobile
- 🎯 **Everyone** can participate and chat regardless of platform
- 🎯 **No data loss** from cross-platform editing conflicts
