# Instructor Features Guide

## Overview
This guide covers the new features added for yoga instructors to customize their class listings with cover photos, custom titles, and precise location pins.

## Features Added

### 1. Cover Photo Upload
**Web App Only**
- Instructors can upload a custom cover photo for their class (via web app)
- Maximum file size: 5MB
- Supported formats: All image types (JPEG, PNG, etc.)
- Photos are stored in Supabase storage bucket: `game-images`
- If no custom photo is uploaded, default sport-specific images are shown
- **Note**: Mobile users can *view* cover photos but cannot upload them

**How to Use:**
- **Web App**: Click the dashed box in the booking modal to select an image
- **iOS App**: Cover photos uploaded via web are displayed automatically in game cards

### 2. Custom Event Title
**Web App & iOS App**
- Instructors can set a custom title for their class (e.g., "Morning Vinyasa Flow")
- This title is displayed instead of the venue name in the app
- The venue name is still stored for reference but the custom title takes precedence in the UI

**How to Use:**
- **Web App**: Enter the event name in the "Event Name" field (required)
- **iOS App**: Enter the title in the "Event Title" field (required)

### 3. Precise Location Pin
**Web App & iOS App**
- Instructors can adjust the exact location of the pin on the map
- Useful for specifying exact locations like "back house" or specific building entrances
- Coordinates are stored as latitude/longitude in the database

**How to Use:**
- **Web App**: The address field automatically geocodes to set coordinates
- **iOS App**: 
  - Tap "Adjust Pin Location" button
  - Drag the map to position the center pin at the exact location
  - Tap "Center on Address" to auto-locate based on the address
  - Tap "Save Location" to confirm

## Database Schema Changes

### New Columns in `games` Table:
```sql
-- Custom event title (separate from venue name)
custom_title TEXT

-- Precise coordinates for location pin
latitude DOUBLE PRECISION
longitude DOUBLE PRECISION

-- Cover photo URL (existing field, now utilized)
image_url TEXT
```

### New Storage Bucket:
- **Bucket Name**: `game-images`
- **Public Access**: Yes (for displaying images)
- **Permissions**: 
  - Anyone can view
  - Authenticated users can upload
  - Users can update/delete their own images

## API Changes

### iOS Models Updated:
- `Game` model now includes: `customTitle`, `latitude`, `longitude`
- `NewGame` model now includes: `customTitle`, `latitude`, `longitude`
- `GameUpdate` model now includes: `customTitle`, `imageUrl`, `latitude`, `longitude`

### Web App Types Updated:
- `Game` type now includes: `custom_title`, `latitude`, `longitude`

## UI Changes

### iOS App (CreateGameView.swift)
1. **Cover Photo Section**: PhotosPicker for selecting images
2. **Custom Title Section**: Text field for event name
3. **Location Picker Section**: Button to open map picker
4. **LocationPickerView**: New full-screen map view with draggable pin

### Web App (BookingModal.tsx)
1. **Cover Photo Upload**: Click-to-upload area with preview
2. **Event Name Field**: Required text input
3. **Location Field**: Address input with auto-geocoding
4. **Coordinate Display**: Shows lat/lng when set

### Display Components
- **GameCard.swift**: Now displays custom title and cover photo
- **TimeSlotCard.tsx**: Shows custom title in claimed slots

## Usage Examples

### Example 1: Yoga Class with Cover Photo
```typescript
// Web App - Claiming a session
const handleClaimSession = async (
  eventName: "Sunset Yoga Flow",
  description: "Relaxing evening yoga session",
  skillLevel: "beginner",
  imageUrl: "https://...supabase.co/storage/v1/object/public/game-images/...",
  latitude: 25.761681,
  longitude: -80.191788
)
```

### Example 2: iOS Game Creation
```swift
let newGame = NewGame(
    createdBy: userId,
    venueName: "Pick Up Studio",
    address: "2500 South Miami Avenue",
    gameDate: "2026-01-15",
    startTime: "09:00:00",
    maxPlayers: 15,
    costCents: 0,
    description: "Beginner-friendly morning class",
    imageUrl: "https://...supabase.co/storage/v1/object/public/game-images/...",
    isPrivate: false,
    skillLevel: .beginner,
    customTitle: "Morning Vinyasa Flow",
    latitude: 25.761681,
    longitude: -80.191788
)
```

## Migration Steps

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, run:
psql < Database/add_instructor_features.sql
```

### 2. Update iOS App
- The Game model has been updated
- CreateGameView now includes new fields
- LocationPickerView has been added

### 3. Update Web App
- BookingModal component updated
- Game type updated in supabase.ts
- Home page updated to pass new parameters

## Testing Checklist

### Web App
- [ ] Upload a cover photo (< 5MB)
- [ ] Enter a custom event title
- [ ] Claim a session with all fields
- [ ] Verify the session appears with custom title in schedule
- [ ] Check that coordinates are saved

### iOS App
- [ ] Select a photo from photo library
- [ ] Enter a custom event title
- [ ] Open location picker and adjust pin
- [ ] Create a game with all fields
- [ ] Verify game appears with custom title in feed
- [ ] Check that cover photo displays correctly

## Troubleshooting

### Cover Photo Not Uploading
- Check file size (must be < 5MB)
- Verify storage bucket `game-images` exists
- Check storage policies are set correctly

### Location Pin Not Accurate
- Try using "Center on Address" button first
- Manually drag map to adjust
- Verify latitude/longitude are being saved

### Custom Title Not Showing
- Ensure `custom_title` field is not empty in database
- Check that GameCard/TimeSlotCard components are using the custom title
- Verify the Game model includes customTitle property

## Future Enhancements
- Image cropping/resizing before upload
- Multiple photos per class
- Location search within map picker
- Saved location presets
- Photo gallery for instructors

## Support
For issues or questions, check:
1. Database schema is up to date
2. Storage bucket permissions are correct
3. All model fields are properly mapped
4. UI components are reading the new fields
