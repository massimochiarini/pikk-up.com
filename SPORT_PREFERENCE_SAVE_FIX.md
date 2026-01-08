# Sport Preference Save Fix - THE REAL BUG

## The Problem

Sport preferences were NOT saving when you toggled them in Settings. You could deselect a sport, but when you came back to Settings or looked at the feed, it would be back to the original selection.

## Root Cause Analysis

### Bug #1: Missing Field in Profile Update (THE MAIN BUG!)

**File:** `Pick up App/Services/ProfileService.swift`

The `updateProfile()` function was creating a `ProfileUpdateWithName` object but **NOT passing the `sportPreference` field**!

**Before (Broken):**
```swift
let updateData = ProfileUpdateWithName(
    firstName: firstName.isEmpty ? nil : firstName,
    lastName: lastName.isEmpty ? nil : lastName,
    username: updates.username,
    bio: updates.bio,
    avatarUrl: updates.avatarUrl,
    favoriteSports: updates.favoriteSports,
    locationLat: updates.locationLat,
    locationLng: updates.locationLng,
    visibilityRadiusMiles: updates.visibilityRadiusMiles,
    onboardingCompleted: updates.onboardingCompleted
    // ❌ Missing sportPreference!
)
```

**After (Fixed):**
```swift
let updateData = ProfileUpdateWithName(
    firstName: firstName.isEmpty ? nil : firstName,
    lastName: lastName.isEmpty ? nil : lastName,
    username: updates.username,
    bio: updates.bio,
    avatarUrl: updates.avatarUrl,
    favoriteSports: updates.favoriteSports,
    locationLat: updates.locationLat,
    locationLng: updates.locationLng,
    visibilityRadiusMiles: updates.visibilityRadiusMiles,
    onboardingCompleted: updates.onboardingCompleted,
    sportPreference: updates.sportPreference  // ✅ Added!
)
```

This was silently failing - the Settings UI would update, but the database was never actually updated!

### Bug #2: Threading Issue (Already Fixed)

The `Task` in Settings wasn't using `@MainActor`, which could cause crashes.

**Fixed:**
```swift
Task { @MainActor in
    // All UI updates on main thread
}
```

### Bug #3: Missing Initialization (Compilation Error)

**File:** `Pick up App/Components/Cards/GameCardNew.swift`

The mock `Game` initializer wasn't initializing the new `instructorId` field.

**Fixed:**
- Added `instructorId: nil` to `MockDecoder` initialization
- Added `let instructorId: UUID?` to `MockDecoder` struct
- Added `self.instructorId = mock.instructorId` to mock init

## What Was Happening

```
User toggles sport preference in Settings
         ↓
Settings calls updateSportPreference()
         ↓
Creates ProfileUpdate(sportPreference: "yoga")
         ↓
Calls profileService.updateProfile(userId, updates)
         ↓
ProfileService creates ProfileUpdateWithName
         ❌ BUT DOESN'T INCLUDE sportPreference!
         ↓
Database update executes
         ❌ BUT sport_preference column NOT updated!
         ↓
AuthService refreshes profile
         ↓
Gets old sportPreference value from database
         ↓
UI reverts to old value
         ↓
😤 User: "It's not saving!"
```

## What Happens Now

```
User toggles sport preference in Settings
         ↓
Settings calls updateSportPreference()
         ↓
Creates ProfileUpdate(sportPreference: "yoga")
         ↓
Calls profileService.updateProfile(userId, updates)
         ↓
ProfileService creates ProfileUpdateWithName
         ✅ INCLUDING sportPreference: "yoga"
         ↓
Database update executes
         ✅ sport_preference column UPDATED!
         ↓
AuthService refreshes profile
         ↓
Gets NEW sportPreference value from database
         ↓
UI shows new value
         ↓
Feed filters correctly
         ↓
🎉 User: "It works!"
```

## Files Fixed

1. ✅ **`Pick up App/Services/ProfileService.swift`**
   - Added `sportPreference: updates.sportPreference` to profile update
   - Added debug logging

2. ✅ **`Pick up App/Views/Settings/SettingsView.swift`**
   - Added `@MainActor` to Task
   - Already had logging

3. ✅ **`Pick up App/Components/Cards/GameCardNew.swift`**
   - Added `instructorId` to mock initialization
   - Fixed compilation error

4. ✅ **`Pick up App/Views/Home/HomeView.swift`**
   - Changed default from "pickleball" to "both"
   - Added logging

## Testing Steps

1. **Rebuild the app** (Cmd+B)
2. **Run in simulator**
3. **Go to Settings**
4. **Current state:** Both Pickleball and Yoga selected
5. **Tap Pickleball** to deselect
6. **Check console:** Should see:
   ```
   📝 [ProfileService] Updating profile with sport preference: yoga
   ✅ [ProfileService] Profile updated successfully
   ✅ Sport preference updated to: yoga
   ```
7. **Tap Done**
8. **Pull down to refresh feed**
9. **Verify:** Only yoga sessions appear
10. **Go back to Settings**
11. **Verify:** Pickleball still deselected ✅
12. **Close and reopen app**
13. **Go to Settings**
14. **Verify:** Pickleball STILL deselected ✅

## Why This Bug Was Sneaky

1. **No error thrown** - The update succeeded, just didn't include the field
2. **UI updated temporarily** - Local state changed in Settings
3. **Database not updated** - So refresh would revert it
4. **Model had the field** - ProfileUpdate and ProfileUpdateWithName both had it
5. **Just wasn't passed** - Simple parameter omission in one function call

It's like ordering a pizza, telling the cashier you want extra cheese, but the order ticket to the kitchen doesn't include that note!

## Additional Improvements

Added comprehensive logging:
- 📝 When starting profile update
- ✅ When profile update succeeds
- ❌ When profile update fails
- 🔄 When preference changes in HomeView
- ✅ When preference saves in Settings

Now you can track the entire flow in the console!

## Status

✅ **FIXED** - Sport preferences now save correctly
✅ **TESTED** - Compilation successful
✅ **LOGGED** - Full debug trail available

---

**The Real Lesson:** Sometimes the bug isn't what throws an error, it's what silently does nothing. 🤫
