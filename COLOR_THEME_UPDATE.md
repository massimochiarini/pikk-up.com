# Color Theme Update - From Pickleball Neon to Yoga Zen

## Overview
Removed all neon green/bright colors and replaced with sophisticated grays and blacks for a calm yoga aesthetic.

## Color Changes Summary

### Primary Colors (Before → After)
- **Neon Green** `#D3FD00` → **Dark Gray** `#1F2937`
- **Neon Green Dark** `#B8E000` → **Darker Gray** `#111827`
- **Sky Blue** `#4A9EBF` → **Medium Gray** `#6B7280`
- **Sky Blue Light** `#7BB8D0` → **Light Gray** `#9CA3AF`
- **Brand Blue** `#0013F7` → **Dark Gray** `#374151`

### Updated Files

#### iOS App
1. **`Pick up App/Components/Theme.swift`**
   - Primary button colors: Neon green → Dark gray
   - Card gradients: Bright colors → Gray gradients
   - Glow effects: Neon glow → Subtle shadows
   - Text on buttons: Dark → White (for contrast on dark buttons)

2. **`Pick up App/Models/Sport.swift`**
   - Yoga color: Purple `#C4B5FD` → Gray `#6B7280`
   - Pickleball color: Neon green `#D3FD00` → Light gray `#9CA3AF`
   - Tennis color: Sky blue `#4A9EBF` → Dark gray `#4B5563`

#### Web App
3. **`app/globals.css`**
   - CSS variables updated to gray palette
   - Primary: `#D3FD00` → `#1F2937`
   - Primary dark: `#B8E000` → `#111827`
   - Accent: `#4A9EBF` → `#6B7280`

4. **`lib/theme.ts`**
   - All sport themes (pickleball, yoga, both) now use gray palette
   - Background changed from navy → white
   - Gradients changed to gray-to-gray instead of neon

## New Color Palette

### Grays (Main Palette)
```
White      #FFFFFF  - Background
Light Gray #F5F5F5  - Card backgrounds
Light Gray #E5E7EB  - Subtle backgrounds
Medium Gray #9CA3AF - Accents, secondary text
Gray       #6B7280  - Secondary elements
Dark Gray  #4B5563  - Tertiary elements
Darker Gray #374151 - Primary buttons (light)
Dark Gray  #1F2937  - Primary buttons
Darkest    #111827  - Primary buttons (dark)
Black      #000000  - Primary text
```

### Semantic Colors (Unchanged)
- Success: `#00C853` (Green)
- Warning: `#FFB300` (Amber)
- Error: `#FF3D57` (Red)

## Visual Changes

### Before (Pickleball)
- ⚡ Bright neon green buttons
- 🌈 Colorful gradients
- 💚 High energy, vibrant feel
- 🎾 Sporty, athletic aesthetic

### After (Yoga)
- 🖤 Sophisticated gray buttons
- 🌫️ Subtle gray gradients
- 🧘 Calm, zen, minimal feel
- 🕊️ Peaceful, meditative aesthetic

## Components Affected

### Automatically Updated (via AppTheme)
- All buttons using `PrimaryButtonStyle`
- All buttons using `CoralButtonStyle`
- Welcome screen icons and buttons
- Pills and badges
- Card gradients
- Glow effects

### No Code Changes Needed
Any component using:
- `AppTheme.neonGreen`
- `AppTheme.primary`
- `AppTheme.playerCardGradient`
- `AppTheme.gameCardGradient`
- `AppTheme.neonGradient`
- `.pillStyle()`
- `.outlinePillStyle()`

These automatically use the new gray colors.

## Testing Checklist

### iOS App
- [ ] Welcome/Onboarding screen (Sign Up button should be dark gray)
- [ ] Primary action buttons (should be dark gray with white text)
- [ ] Game cards (should have gray gradients)
- [ ] Yoga class icons (should be gray)
- [ ] Tab bar selections
- [ ] Sport filters

### Web App
- [ ] Home page buttons
- [ ] Class schedule grid
- [ ] Booking modal buttons
- [ ] Navigation elements

## Rollback (if needed)
If you need to revert to neon green:
```swift
// In Theme.swift
static let neonGreen = Color(hex: "D3FD00")
static let neonGreenDark = Color(hex: "B8E000")
```

```css
/* In globals.css */
--primary-color: #D3FD00;
--primary-dark: #B8E000;
```

## Next Steps
1. Rebuild iOS app (Cmd+B)
2. Test on simulator
3. Refresh web app
4. Verify all buttons and UI elements
