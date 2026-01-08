# Crash Fix - Sport Preference Update

## Issue

App crashed with `SIGTERM` when toggling sport preferences in Settings.

## Root Cause

The `updateSportPreference()` function was:
1. Running async code without `@MainActor` annotation
2. Potentially updating UI from background thread
3. Had a stale default value in `HomeView` ("pickleball" instead of "both")

## Fixes Applied

### 1. Added @MainActor to Task

**File:** `Pick up App/Views/Settings/SettingsView.swift`

**Before:**
```swift
Task {
    do {
        // ... async operations
        await authService.refreshProfile()
    }
}
```

**After:**
```swift
Task { @MainActor in
    do {
        // ... async operations
        await authService.refreshProfile()
    }
}
```

This ensures all UI updates happen on the main thread.

### 2. Fixed Default Preference in HomeView

**File:** `Pick up App/Views/Home/HomeView.swift`

**Before:**
```swift
feedService.sportPreference = newPreference ?? "pickleball"
```

**After:**
```swift
feedService.sportPreference = newPreference ?? "both"
```

This matches the new default behavior.

### 3. Added Debug Logging

Added logging to track preference changes:
- ✅ Settings: `"✅ Sport preference updated to: \(preference)"`
- ✅ HomeView: `"🔄 Sport preference changed from X to Y"`
- ❌ Error: `"❌ Error updating sport preference: \(error)"`

## Testing

1. ✅ Open Settings
2. ✅ Toggle Pickleball off
3. ✅ App should NOT crash
4. ✅ Preference should save
5. ✅ Feed should refresh automatically
6. ✅ Only yoga sessions should appear

## Files Changed

1. `Pick up App/Views/Settings/SettingsView.swift`
   - Added `@MainActor` to Task
   - Added debug logging

2. `Pick up App/Views/Home/HomeView.swift`
   - Changed default from "pickleball" to "both"
   - Added debug logging

## Why This Happened

Swift's concurrency model requires UI updates to happen on the main actor. When we call `authService.refreshProfile()`, it updates `@Published` properties which trigger SwiftUI view updates. Without `@MainActor`, this could happen on a background thread, causing a crash.

## Prevention

Always use `@MainActor` when:
- Updating `@Published` properties
- Calling functions that update UI state
- Working with `@StateObject` or `@ObservedObject`

## Status

✅ Fixed and ready for testing
