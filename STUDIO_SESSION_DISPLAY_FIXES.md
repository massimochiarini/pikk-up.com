# Studio Session Display Fixes

## Overview
Fixed the display of studio sessions (yoga classes booked via web app) in the iOS app to properly show custom class names, instructor avatars, and use "attending" instead of "players".

## Changes Made

### 1. GameCardNew Component (`Pick up App/Components/Cards/GameCardNew.swift`)
- **Custom Title Display**: Added logic to show `customTitle` (custom class name) instead of `venueName` for studio sessions
- **Instructor Avatar**: Added instructor profile fetching and avatar display next to the class name
- **Attendance Label**: Changed "players" to "attending" for studio sessions
- **Detection**: Uses `game.instructorId != nil` to identify studio sessions

### 2. GameCardCompact Component (`Pick up App/Components/Cards/GameCardNew.swift`)
- Same fixes as GameCardNew for the compact card variant
- Shows instructor avatar (24px size for compact view)
- Uses "attending" label for studio sessions

### 3. MyGamesView (`Pick up App/Views/MyGames/MyGamesView.swift`)
- Updated both the full game card and history card to show custom titles
- Changed "players" to "attending" for studio sessions in both views

### 4. GameDetailView (`Pick up App/Views/GameDetail/GameDetailView.swift`)
- Updated title section to show custom class name
- Changed "Players" section header to "Attending" for studio sessions
- Updated share text to use custom title
- Updated map item name to use custom title

### 5. GameCard Component (`Pick up App/Components/GameCard.swift`)
- Already had custom title support
- Added "attending" label for studio sessions

## Technical Details

### Studio Session Detection
```swift
private var isStudioSession: Bool {
    game.instructorId != nil
}
```

### Display Title Logic
```swift
private var displayTitle: String {
    if let customTitle = game.customTitle, !customTitle.isEmpty {
        return customTitle
    }
    return game.venueName
}
```

### Instructor Profile Fetching
```swift
@State private var instructorProfile: Profile?

private func fetchInstructorProfile(instructorId: UUID) async {
    let profileService = ProfileService()
    do {
        instructorProfile = try await profileService.fetchProfile(userId: instructorId)
    } catch {
        print("❌ Failed to fetch instructor profile: \(error)")
    }
}
```

### Avatar Display
```swift
if isStudioSession, let instructor = instructorProfile {
    AvatarView(
        url: instructor.avatarUrl,
        initials: instructor.initials,
        size: 32,
        showBorder: false
    )
}
```

## Result

Studio sessions now display:
- ✅ Custom class name (e.g., "Morning Flow Yoga") instead of "Pick Up Studio"
- ✅ Instructor avatar next to the class name
- ✅ "#/15 attending" instead of "#/4 players"
- ✅ Consistent display across all views (Home, My Games, Game Detail)

## Database Fields Used

- `instructor_id`: UUID of the instructor who created the session (set by web app)
- `custom_title`: Custom name for the class (e.g., "Morning Flow Yoga")
- `max_players`: Capacity for the session (e.g., 15 for yoga classes)

## Date
January 8, 2026
