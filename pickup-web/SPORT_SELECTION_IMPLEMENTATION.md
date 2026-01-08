# Sport Selection Implementation

## Overview
Sport selection has been successfully added to the signup flow for the web app, allowing users to choose between Pickleball, Yoga, or Both. The selected sport controls the app's theme throughout the entire application.

## What Was Implemented

### 1. Database Changes
- **File**: `Database/add_sport_preference_column.sql`
- Added `sport_preference` column to the `profiles` table
- Constraint: Only accepts 'pickleball', 'yoga', or 'both'
- Default: 'pickleball' (for backward compatibility)
- Indexed for efficient querying

**To apply**: Run the SQL file in your Supabase SQL Editor

### 2. Type Updates
- **File**: `pickup-web/lib/supabase.ts`
- Added `sport_preference?: 'pickleball' | 'yoga' | 'both'` to the Profile type

### 3. Theme System
- **File**: `pickup-web/lib/theme.ts` (new)
- Defines color palettes for each sport:
  - **Pickleball**: Neon green (#D3FD00) with navy
  - **Yoga**: Light purple (#C4B5FD) with complementary colors
  - **Both**: Gradient blending green and purple
- Provides utilities to apply themes dynamically

### 4. Theme Provider
- **File**: `pickup-web/components/ThemeProvider.tsx` (new)
- React Context that manages the current theme
- Automatically loads user's sport preference from database
- Applies theme CSS variables to the document root
- Exposes `useTheme()` hook for components

### 5. Layout Integration
- **File**: `pickup-web/app/layout.tsx`
- Wrapped the app with `ThemeProvider`
- Theme is applied globally and persists across all pages

### 6. Signup Flow Update
- **File**: `pickup-web/app/auth/signup/page.tsx`
- Added new "sport selection" step between credentials and profile
- Three visual cards for selecting sport preference:
  - 🏓 Pickleball (green theme)
  - 🧘 Yoga (purple theme)
  - ✨ Both (gradient theme)
- Selected sport is saved to the database during profile creation
- Theme is applied immediately upon selection

### 7. CSS Updates
- **File**: `pickup-web/app/globals.css`
- Converted hardcoded colors to CSS variables:
  - `--primary-color`
  - `--primary-dark`
  - `--accent-color`
  - `--background-color`
  - `--text-color`
- Updated button and input styles to use CSS variables
- Special gradient handling for "both" theme

### 8. Tailwind Configuration
- **File**: `pickup-web/tailwind.config.ts`
- Added yoga theme colors:
  - `yoga-purple`: #C4B5FD
  - `yoga-purple-dark`: #A78BFA
  - `yoga-purple-light`: #DDD6FE
- Maintained existing pickleball colors

## Theme Colors

### Pickleball Theme
- Primary: #D3FD00 (Neon green)
- Primary Dark: #B8E000
- Accent: #4A9EBF (Sky blue)
- Background: #0F1B2E (Navy)

### Yoga Theme
- Primary: #C4B5FD (Light purple)
- Primary Dark: #A78BFA (Medium purple)
- Accent: #DDD6FE (Lighter purple)
- Background: #1E1B4B (Deep indigo)

### Both Theme
- Primary: Linear gradient (green → purple)
- Primary Dark: Linear gradient (darker green → darker purple)
- Accent: #7BB8D0 (Sky blue light)
- Background: #0F1B2E (Navy)

## How It Works

1. **New User Signup Flow**:
   - Step 1: Enter email and password
   - Step 2: Select sport preference (Pickleball, Yoga, or Both)
   - Step 3: Complete profile details
   - Sport preference is saved to database

2. **Theme Application**:
   - ThemeProvider loads on app mount
   - Fetches user's sport_preference from database
   - Applies corresponding CSS variables to document root
   - All components using CSS variables automatically reflect the theme

3. **Existing Users**:
   - Default to 'pickleball' theme
   - Can update preference later (update functionality can be added to settings)

## Using Themes in Components

### Using the Theme Hook
```typescript
import { useTheme } from '@/components/ThemeProvider'

function MyComponent() {
  const { sportPreference, setSportPreference } = useTheme()
  
  // Access current theme
  console.log(sportPreference) // 'pickleball', 'yoga', or 'both'
  
  // Change theme (e.g., in settings)
  setSportPreference('yoga')
}
```

### Using CSS Variables in Styles
```css
.my-button {
  background: var(--primary-color);
  color: var(--text-color);
}

.my-button:hover {
  background: var(--primary-dark);
}
```

### Using Theme-Aware Classes
```tsx
// Button automatically uses theme colors
<button className="btn-primary">Click me</button>

// Input field automatically uses theme for focus state
<input className="input-field" />
```

## Testing

### Test the Signup Flow
1. Navigate to `/auth/signup`
2. Enter credentials
3. Select each sport option and verify:
   - Visual feedback on selection
   - Theme preview in the card
4. Complete profile
5. Verify theme persists on home page

### Test Each Theme
- **Pickleball**: Green buttons and accents
- **Yoga**: Purple buttons and accents
- **Both**: Gradient buttons and accents

## Future Enhancements

### Possible Additions
1. **Settings Page**: Allow users to change sport preference after signup
2. **Context-Based Theming**: Show yoga theme for yoga games, pickleball for pickleball games
3. **Additional Sports**: Easy to extend by adding to the theme.ts configuration
4. **Dark Mode**: Add dark mode variants for each sport theme
5. **Animated Transitions**: Smooth color transitions when theme changes

## Technical Notes

- All changes are web-only (mobile app untouched)
- Backward compatible (existing users default to pickleball)
- No breaking changes to existing functionality
- Minimal UI changes, reuses existing components
- Type-safe with TypeScript throughout

## Files Modified
1. `Database/add_sport_preference_column.sql` - NEW
2. `pickup-web/lib/supabase.ts` - Added type
3. `pickup-web/lib/theme.ts` - NEW
4. `pickup-web/components/ThemeProvider.tsx` - NEW
5. `pickup-web/app/layout.tsx` - Wrapped with ThemeProvider
6. `pickup-web/app/auth/signup/page.tsx` - Added sport selection step
7. `pickup-web/app/globals.css` - CSS variables for theming
8. `pickup-web/tailwind.config.ts` - Added purple colors

