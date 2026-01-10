# Leave Group Chat Button UI Fix

## Issue
The "Leave" button on the group chat swipe action had incorrect styling:
- ❌ Red background (default destructive button styling)
- ❌ Icon color didn't match the dark theme
- ❌ Text wasn't white as requested

## Fix Applied

### Before:
```swift
Button(role: .destructive) {
    // ...
} label: {
    Label("Leave", systemImage: "rectangle.portrait.and.arrow.right")
}
```

### After:
```swift
Button {
    // ...
} label: {
    VStack(spacing: 4) {
        ZStack {
            Circle()
                .fill(Color.white)      // White circle background
                .frame(width: 44, height: 44)
            
            Image(systemName: "rectangle.portrait.and.arrow.right")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.black)  // Black icon
        }
        
        Text("Leave")
            .font(.system(size: 12, weight: .medium))
            .foregroundColor(.white)      // White text
    }
}
.tint(AppTheme.background)  // Dark background for swipe area
```

## Changes Made

✅ **White circle with black icon**
- Circle background: `Color.white`
- Icon color: `.black`
- Icon: Door/exit symbol

✅ **White "Leave" text**
- Text color: `.white`
- Proper font sizing and weight

✅ **Dark background**
- Swipe action background: `AppTheme.background` (dark)
- Matches the overall dark UI theme

## Visual Result

The Leave button now displays correctly:
- ⚪ White circular button
- 🚪 Black door icon inside the white circle
- "Leave" text in white below the circle
- Dark background behind the swipe action

This matches the dark UI theme perfectly and provides clear visual hierarchy.

## File Modified
- `/Pick up App/Views/Messages/MessagesView.swift` (Line 174-194)
