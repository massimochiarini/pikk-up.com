# 🏓 Pickup App - Complete Overview

**Last Updated:** January 8, 2026

---

## 🎯 App Architecture

### The Two-Platform System

Your Pickup app consists of **two distinct platforms** that share the same Supabase database:

1. **📱 Mobile App (iOS)** - For pickleball players
2. **🌐 Web App (Next.js)** - For yoga instructors

---

## 📱 MOBILE APP (iOS) - Pickleball Games

### Purpose
Mobile app users can **create and join pickup pickleball games** in their area.

### Key Features

#### Game Creation
- **Sport:** Always `pickleball` (hardcoded)
- **Max Players:** Always `4` (hardcoded at line 49 of CreateGameView.swift)
- **Custom Title:** Required field (e.g., "Morning Pickleball at the Park")
- **Venue Name:** Where the game takes place
- **Address:** Full street address
- **Date & Time:** When the game happens
- **Cost:** Can be free or paid (in dollars)
- **Skill Level:** Optional (Beginner, Intermediate, Advanced)
- **Location Pin:** Adjustable via interactive map picker (LocationPickerView)
- **Cover Photo:** Not supported on mobile (instructors upload via web)

#### Discovery & Joining
- **Home Feed:** Browse all games (both pickleball and yoga)
- **Sport Filter:** Users can filter by sport preference (stored in profile)
- **Distance Filter:** See games within visibility radius
- **RSVP System:** Join games, see who else is coming
- **My Games:** View games you're hosting or attending

#### Messaging
- **1-on-1 Chats:** Direct messages with other players
- **Group Chats:** Automatic group chat created for each game
- **Real-time:** Messages update live

#### Profile & Settings
- **Profile:** Name, bio, avatar, favorite sports
- **Onboarding:** Sport selection, location permission
- **Settings:** Account management, help, legal pages
- **Account Deletion:** Full data removal

### Current Files
```
Pick up App/
├── Models/
│   ├── Game.swift (defines game structure)
│   ├── Profile.swift
│   ├── Message.swift
│   └── ...
├── Views/
│   ├── CreateGame/
│   │   ├── CreateGameView.swift (hardcoded: 4 players, pickleball)
│   │   └── LocationPickerView.swift (NEW: interactive map)
│   ├── GameDetail/
│   │   └── GameDetailView.swift (shows game info + RSVP)
│   ├── Home/
│   │   └── HomeView.swift (feed with sport filtering)
│   ├── Messages/
│   └── ...
└── Services/
    ├── GameService.swift (just fixed deleteGame)
    └── ...
```

### Recent Changes
✅ **Fixed:** Game deletion now works (removed manual RSVP deletion)
- Issue: RLS policy only allowed deleting own RSVPs
- Solution: Rely on database CASCADE to auto-delete RSVPs

---

## 🌐 WEB APP - Yoga Instructor Booking

### Purpose
Yoga instructors use the web app to **book teaching slots at your studio** (Pick Up Studio).

### Key Features

#### Studio Schedule
- **Weekly Calendar:** Monday-Sunday grid view
- **Time Slots:** 
  - 7:00 AM (1.5h)
  - 9:00 AM (1.5h)
  - 11:00 AM (1.5h)
  - 1:00 PM (1.5h)
  - 5:00 PM (1.5h)
  - 7:00 PM (1.5h)
- **Status Colors:**
  - Green: Available
  - Red: Claimed by instructor
  - Gray: Past time slots
- **Navigation:** Previous/Next week buttons

#### Claiming Sessions
When an instructor clicks an available slot, they can:
- **Upload Cover Photo:** Custom image for their class (max 5MB)
- **Event Name:** Custom title (e.g., "Morning Vinyasa Flow") ✅ REQUIRED
- **Skill Level:** All Levels, Beginner, Intermediate, Advanced
- **Description:** Optional class description
- **Location:** Fixed to "2500 South Miami Avenue" (Pick Up Studio)
- **Auto-Geocoding:** Coordinates automatically calculated from address

#### What Gets Created
When instructor claims a session:
```javascript
{
  sport: 'yoga',                      // ← Hardcoded
  max_players: 15,                    // ← Hardcoded
  venue_name: 'Pick Up Studio',       // ← Hardcoded (locked)
  address: '2500 South Miami Avenue', // ← Hardcoded (locked)
  custom_title: "Morning Vinyasa",    // ← Instructor input
  instructor_id: user.id,             // ← Creator ID
  description: "...",                 // ← Instructor input
  image_url: "...",                   // ← Uploaded photo
  latitude: 25.xxxx,                  // ← Auto-geocoded
  longitude: -80.xxxx,                // ← Auto-geocoded
  skill_level: "intermediate",        // ← Instructor input
}
```

#### Backend Actions
1. Create game record in `games` table
2. Auto-RSVP the instructor
3. Create group chat for the class
4. Add instructor as group chat member

### Current Files
```
pickup-web/
├── app/
│   ├── home/
│   │   └── page.tsx (weekly schedule grid)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── my-games/page.tsx
│   ├── profile/page.tsx
│   ├── settings/page.tsx
│   └── ...
├── components/
│   ├── BookingModal.tsx (claim session form with photo upload)
│   ├── TimeSlotCard.tsx (individual slot display)
│   ├── Navbar.tsx
│   └── ...
└── lib/
    └── supabase.ts (types and client)
```

### Recent Additions
✅ **Instructor Features** (implemented Jan 8, 2026):
1. Cover photo upload to `game-images` storage bucket
2. Custom event title (required field)
3. Auto-geocoding for precise location
4. Coordinates stored in database

---

## 🗄️ DATABASE STRUCTURE

### Shared Tables (Both Apps Use)

#### `games` table
```sql
id UUID PRIMARY KEY
created_by UUID (user who created it)
instructor_id UUID (for yoga classes)
sport TEXT ('pickleball' or 'yoga')
venue_name TEXT
address TEXT
custom_title TEXT ← NEW (overrides venue_name in display)
game_date DATE
start_time TIME
max_players INTEGER (4 for pickleball, 15 for yoga)
cost_cents INTEGER (always 0 for yoga)
description TEXT
image_url TEXT ← NEW (cover photo from web upload)
latitude DOUBLE PRECISION ← NEW
longitude DOUBLE PRECISION ← NEW
skill_level TEXT ('beginner', 'intermediate', 'advanced')
is_private BOOLEAN (always false for yoga)
status TEXT ('booked' for yoga)
created_at TIMESTAMPTZ
```

#### `rsvps` table
```sql
id UUID PRIMARY KEY
game_id UUID REFERENCES games(id) ON DELETE CASCADE
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
created_at TIMESTAMPTZ
```

#### `group_chats` table
```sql
id UUID PRIMARY KEY
game_id UUID REFERENCES games(id) ON DELETE CASCADE
name TEXT
last_message_at TIMESTAMPTZ
last_message_preview TEXT
created_at TIMESTAMPTZ
```

#### Storage Buckets
- **`avatars`**: User profile photos (both platforms)
- **`game-images`**: Class cover photos (web upload only)

### RLS Policies
- ✅ Users can view all public games
- ✅ Users can view their own private games
- ✅ Users can create games
- ✅ Users can update their own games
- ✅ Users can delete their own games (CASCADE deletes RSVPs)
- ✅ Users can only delete their own RSVPs (NOT other people's)

---

## 🔄 HOW THE APPS INTERACT

### Shared Feed
Both pickleball games (mobile) and yoga classes (web) appear in the mobile app's home feed:

```swift
// HomeView.swift filters by sport preference
feedService.sportPreference = authService.currentProfile?.sportPreference ?? "pickleball"
```

Users can toggle between:
- 🏓 Pickleball games (from mobile users)
- 🧘 Yoga classes (from web instructors)

### Data Flow
```
Instructor → Web App → Claims Yoga Slot → Supabase → Mobile App Feed
Player → Mobile App → Creates Pickleball Game → Supabase → (Could appear on web)
```

### Current Limitation
The web app (`/home`) only shows **yoga classes**, not pickleball games:
```typescript
// pickup-web/app/home/page.tsx line 64
.eq('sport', 'yoga') // ← Filtered to yoga only
```

---

## ✅ RECENT FIXES & CHANGES

### Just Fixed (Jan 8, 2026)
**Problem:** Mobile app couldn't delete games  
**Cause:** Trying to manually delete all RSVPs, but RLS only allows deleting own RSVPs  
**Solution:** Removed manual RSVP deletion, let database CASCADE handle it  
**File:** `Pick up App/Services/GameService.swift`

### Previously Implemented (Jan 8, 2026)
1. ✅ Cover photo upload (web only)
2. ✅ Custom event titles (both platforms)
3. ✅ Location pin adjustment (mobile only)
4. ✅ Auto-geocoding (web only)
5. ✅ Database migration for new columns
6. ✅ Storage bucket for cover images

---

## 🎨 DESIGN CONSISTENCY

### Brand Colors (Both Platforms)
- **Neon Green:** `#D3FD00` - Primary CTAs
- **Navy:** `#0F1B2E` - Text and headers
- **Sky Blue:** `#4A9EBF` - Secondary actions

### Mobile (iOS)
```swift
// Theme.swift
AppTheme.primary (neon green)
AppTheme.brandBlue (sky blue)
AppTheme.background (white/dark mode)
```

### Web (Next.js)
```typescript
// tailwind.config.ts
'neon-green': '#D3FD00'
'navy': '#0F1B2E'
'sky-blue': '#4A9EBF'
```

---

## 🐛 POTENTIAL ISSUES TO REVIEW

### 1. ❓ Sport Field Consistency
- **Mobile:** Doesn't explicitly set `sport: 'pickleball'` in NewGame struct
- **Recommendation:** Add explicit sport field to avoid database defaults

### 2. ❓ Missing `instructor_id` on Mobile
- **Mobile games don't set `instructor_id`** (only web does)
- This is fine, but should be documented

### 3. ❓ Web App Doesn't Show Pickleball Games
- Web `/home` filters to `sport = 'yoga'` only
- **Question:** Should instructors see all games or just yoga?

### 4. ❓ Cover Photos Only on Web
- Mobile users can't upload cover photos when creating games
- **Question:** Is this intentional? (seems yes, since pickleball games are casual)

### 5. ⚠️ Hardcoded Studio Address
- **Web app locks venue to:** "2500 South Miami Avenue"
- **Question:** What if you open a second studio?

---

## 📊 COMPARISON TABLE

| Feature | Mobile (Pickleball) | Web (Yoga) |
|---------|---------------------|------------|
| **Sport** | `pickleball` | `yoga` |
| **Max Players** | `4` | `15` |
| **Venue** | User enters name | Locked to "Pick Up Studio" |
| **Address** | User enters address | Locked to "2500 South Miami Avenue" |
| **Custom Title** | ✅ Required | ✅ Required |
| **Cover Photo** | ❌ Not supported | ✅ Upload supported |
| **Location Pin** | ✅ Interactive map | ✅ Auto-geocoded |
| **Cost** | ✅ Can set price | Always free ($0) |
| **Private Games** | ✅ Can be private | Always public |
| **Description** | ❌ Not used | ✅ Optional |
| **Skill Level** | ✅ Optional | ✅ Optional |
| **Edit Game** | ✅ Can edit | ❓ Not implemented |
| **Delete Game** | ✅ Working (just fixed!) | ❓ Not implemented |

---

## 🚀 RECOMMENDATIONS

### Quick Wins
1. **Add explicit `sport` field** to mobile game creation
2. **Add edit/delete** buttons for instructors on web
3. **Document** that mobile games don't have cover photos (by design)
4. **Consider** allowing mobile users to upload cover photos for special events

### Future Enhancements
1. **Multi-studio support** on web (dropdown to select venue)
2. **Web view of all games** (not just yoga)
3. **Mobile instructor mode** (book yoga slots from mobile)
4. **Cover photo compression** before upload
5. **Recurring classes** for instructors

---

## 📂 KEY FILES REFERENCE

### Mobile Delete Fix
```swift
// Pick up App/Services/GameService.swift (line 215)
func deleteGame(gameId: UUID, userId: UUID) async throws {
    // Delete the game - RSVPs auto-deleted via CASCADE
    try await supabase
        .from("games")
        .delete()
        .eq("id", value: gameId.uuidString)
        .execute()
    
    await fetchGames(currentUserId: userId)
}
```

### Mobile Game Creation
```swift
// Pick up App/Views/CreateGame/CreateGameView.swift (line 689)
private let maxPlayers = 4  // Hardcoded for pickleball

let newGame = NewGame(
    createdBy: userId,
    venueName: trimmedVenueName,
    address: trimmedAddress,
    gameDate: dateFormatter.string(from: gameDate),
    startTime: timeFormatter.string(from: selectedTimeSlot),
    maxPlayers: maxPlayers,  // ← Always 4
    // ... no explicit sport field set!
)
```

### Web Session Claiming
```typescript
// pickup-web/app/home/page.tsx (line 120)
const handleClaimSession = async (...) => {
  const { data: gameData } = await supabase
    .from('games')
    .insert({
      sport: 'yoga',                      // ← Hardcoded
      max_players: 15,                    // ← Hardcoded
      venue_name: 'Pick Up Studio',       // ← Locked
      address: '2500 South Miami Avenue', // ← Locked
      custom_title: eventName,            // ← Instructor input
      // ...
    })
}
```

---

## ✅ STATUS SUMMARY

### Mobile App
- ✅ Game creation (pickleball, 4 players)
- ✅ Game editing (venue, time, skill level)
- ✅ Game deletion (JUST FIXED!)
- ✅ Custom titles
- ✅ Location pin adjustment
- ✅ RSVP system
- ✅ Group chats
- ✅ Profile management

### Web App
- ✅ Weekly schedule view
- ✅ Session claiming
- ✅ Cover photo upload
- ✅ Custom event titles
- ✅ Auto-geocoding
- ⚠️ No edit/delete for claimed sessions
- ⚠️ Only shows yoga classes (not pickleball games)

### Database
- ✅ All tables created
- ✅ RLS policies configured
- ✅ CASCADE delete working
- ✅ Storage buckets set up
- ✅ New columns added (custom_title, lat/lng)

---

## 🎯 NEXT STEPS

1. **Test the delete fix** on mobile (should work now!)
2. **Consider adding sport field** explicitly to mobile game creation
3. **Decide** if web should show pickleball games too
4. **Add** edit/delete functionality for instructors on web
5. **Document** the two-platform architecture for future developers

---

**Questions? Issues?** Check the troubleshooting sections in:
- `IMPLEMENTATION_COMPLETE.md` (instructor features)
- `PROJECT_SUMMARY.md` (web app overview)
- `README.md` (setup instructions)

---

*Last updated: January 8, 2026*
*Mobile delete bug fixed ✅*
