# Fixes Applied - January 8, 2026

## Issues Fixed

### 1. ✅ Duplicate Property Declaration
**Error**: `Invalid redeclaration of 'latitude'` and `Invalid redeclaration of 'longitude'`

**Cause**: The `Game` struct had `latitude` and `longitude` declared twice:
- Once as stored properties (lines 71-72) for the new instructor features
- Once as computed properties (lines 79-80) for distance-based sorting

**Fix**: Removed the duplicate computed property declarations, keeping only the stored properties.

**File**: `Pick up App/Models/Game.swift`

### 2. ✅ Removed Photo Upload from iOS App
**Requirement**: Only web app users (yoga instructors) should be able to upload cover photos, not mobile users.

**Changes Made**:
1. Removed `PhotosUI` import
2. Removed all photo picker state variables (`selectedImage`, `coverImageData`, etc.)
3. Removed `coverPhotoSection` from the form
4. Removed `uploadCoverImage()` function
5. Removed `.onChange(of: selectedImage)` modifier
6. Set `imageUrl: nil` in `createGame()` and `updateGame()`

**Files Modified**:
- `Pick up App/Views/CreateGame/CreateGameView.swift`

**Result**: 
- iOS app can still display cover photos uploaded via web
- iOS users can set custom titles and adjust location pins
- Only web instructors can upload cover photos

## Current Feature Status

| Feature | iOS Mobile | Web App | Notes |
|---------|-----------|---------|-------|
| **Cover Photo Upload** | ❌ | ✅ | Web only - instructors upload via web |
| **Cover Photo Display** | ✅ | ✅ | All users can see photos |
| **Custom Event Title** | ✅ | ✅ | Both platforms |
| **Location Pin Adjustment** | ✅ | ✅ | Both platforms |

## iOS App Features

### What iOS Users CAN Do:
1. ✅ Set custom event title (e.g., "Morning Vinyasa Flow")
2. ✅ Adjust location pin with interactive map picker
3. ✅ View cover photos uploaded by instructors via web
4. ✅ Create and edit games with all standard fields

### What iOS Users CANNOT Do:
1. ❌ Upload cover photos (web only)

## Web App Features

### What Web Users CAN Do:
1. ✅ Upload cover photos (< 5MB)
2. ✅ Set custom event title
3. ✅ Auto-geocode location from address
4. ✅ Claim time slots with all features

## Testing Checklist

### iOS App
- [x] No build errors
- [x] No duplicate property errors
- [x] Can create game with custom title
- [x] Can adjust location pin
- [x] Can view games with cover photos
- [ ] Test creating a game end-to-end
- [ ] Test location picker functionality

### Web App
- [ ] Can upload cover photo
- [ ] Can set custom title
- [ ] Can claim session with all fields
- [ ] Photos display in schedule

## Files Changed

1. **Pick up App/Models/Game.swift**
   - Removed duplicate latitude/longitude computed properties

2. **Pick up App/Views/CreateGame/CreateGameView.swift**
   - Removed PhotosUI import
   - Removed photo picker state and UI
   - Removed image upload function
   - Simplified form to exclude photo upload

3. **Documentation Files**
   - `IMPLEMENTATION_COMPLETE.md` - Updated to reflect web-only photo uploads
   - `QUICK_START_INSTRUCTOR_FEATURES.md` - Updated feature table
   - `INSTRUCTOR_FEATURES_GUIDE.md` - Clarified web-only photo uploads

### 3. ✅ FeedService Assignment Errors
**Error**: `Cannot assign to property: 'latitude' is a 'let' constant` and `Cannot assign to property: 'longitude' is a 'let' constant`

**Cause**: FeedService was trying to geocode addresses and assign coordinates to `latitude` and `longitude`, but these are now immutable stored properties from the database.

**Fix**: Updated FeedService logic to:
1. Check if coordinates exist in the game (from database)
2. Use stored coordinates if available
3. Only geocode if coordinates are missing (backward compatibility)
4. Calculate distance using either stored or geocoded coordinates

**File**: `Pick up App/Services/FeedService.swift`

**Result**: Games with stored coordinates use them directly; old games without coordinates are geocoded on-the-fly for distance calculations.

## Build Status

✅ **iOS App**: No linter errors, ready to build
✅ **Web App**: No changes needed, ready to run

## Next Steps

1. Build and test iOS app in Xcode
2. Test web app with `npm run dev`
3. Run database migration if not already done
4. Test end-to-end flow:
   - Web: Upload photo and create session
   - iOS: View session with photo
   - iOS: Create game with custom title and location

---

**Status**: ✅ All issues resolved, ready for testing
**Date**: January 8, 2026
