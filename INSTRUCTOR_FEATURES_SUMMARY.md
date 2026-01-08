# Instructor Features - Implementation Summary

## ✅ Completed Features

### 1. Cover Photo Upload
**Status**: ✅ Complete

**Implementation**:
- **Database**: Added `image_url` column support and created `game-images` storage bucket
- **iOS App**: PhotosPicker integration in CreateGameView with image upload to Supabase Storage
- **Web App**: File input with preview and upload functionality in BookingModal
- **Display**: GameCard shows custom cover photo if available, falls back to default images

**Files Modified**:
- `Database/add_instructor_features.sql` - Storage bucket and policies
- `Pick up App/Views/CreateGame/CreateGameView.swift` - Photo picker and upload
- `Pick up App/Components/GameCard.swift` - Display custom images
- `pickup-web/components/BookingModal.tsx` - Web upload interface

### 2. Custom Event Title
**Status**: ✅ Complete

**Implementation**:
- **Database**: Added `custom_title` column to games table
- **iOS App**: Text field for custom title in CreateGameView
- **Web App**: Event name field in BookingModal (required)
- **Display**: Custom title displayed instead of venue name in both apps

**Files Modified**:
- `Database/add_instructor_features.sql` - Schema update
- `Pick up App/Models/Game.swift` - Added customTitle property
- `Pick up App/Views/CreateGame/CreateGameView.swift` - Title input field
- `Pick up App/Components/GameCard.swift` - Display custom title
- `pickup-web/lib/supabase.ts` - Updated Game type
- `pickup-web/components/BookingModal.tsx` - Title input
- `pickup-web/components/TimeSlotCard.tsx` - Display custom title

### 3. Precise Location Pin
**Status**: ✅ Complete

**Implementation**:
- **Database**: Added `latitude` and `longitude` columns to games table
- **iOS App**: New LocationPickerView with draggable map interface
- **Web App**: Auto-geocoding from address with coordinate storage
- **Features**: 
  - Drag map to adjust pin position
  - "Center on Address" button for auto-location
  - Coordinate display
  - Saved coordinates used for precise map pins

**Files Modified**:
- `Database/add_instructor_features.sql` - Schema update
- `Pick up App/Models/Game.swift` - Added latitude/longitude properties
- `Pick up App/Views/CreateGame/CreateGameView.swift` - Location picker button
- `Pick up App/Views/CreateGame/LocationPickerView.swift` - NEW FILE - Map picker UI
- `pickup-web/components/BookingModal.tsx` - Geocoding integration

## 📁 Files Created

1. **Database/add_instructor_features.sql**
   - Schema changes for new features
   - Storage bucket creation
   - Storage policies

2. **Pick up App/Views/CreateGame/LocationPickerView.swift**
   - Full-screen map picker
   - Draggable pin interface
   - Geocoding support

3. **INSTRUCTOR_FEATURES_GUIDE.md**
   - Comprehensive documentation
   - Usage examples
   - Troubleshooting guide

4. **setup_instructor_features.sh**
   - Setup script for database migration
   - Step-by-step guide

## 🔄 Files Modified

### iOS App
1. **Pick up App/Models/Game.swift**
   - Added: `customTitle`, `latitude`, `longitude` to Game struct
   - Updated: NewGame and GameUpdate structs
   - Updated: CodingKeys and encode/decode methods

2. **Pick up App/Views/CreateGame/CreateGameView.swift**
   - Added: Cover photo upload with PhotosPicker
   - Added: Custom title text field
   - Added: Location picker button and sheet
   - Added: Image upload to Supabase Storage
   - Updated: Form validation to require custom title
   - Updated: createGame() and updateGame() methods

3. **Pick up App/Components/GameCard.swift**
   - Added: Display custom title if available
   - Added: Display custom cover photo if available
   - Updated: imageURL computed property

### Web App
1. **pickup-web/lib/supabase.ts**
   - Added: `custom_title`, `latitude`, `longitude` to Game type

2. **pickup-web/components/BookingModal.tsx**
   - Added: Cover photo upload with preview
   - Added: Custom title field (required)
   - Added: Location address field with geocoding
   - Added: Image upload to Supabase Storage
   - Updated: Form submission to include new fields

3. **pickup-web/app/home/page.tsx**
   - Updated: handleClaimSession to accept new parameters
   - Updated: Session creation to include custom_title, image_url, latitude, longitude

4. **pickup-web/components/TimeSlotCard.tsx**
   - Updated: Display custom_title instead of description

### Database
1. **Database/add_instructor_features.sql**
   - Added: `custom_title` column
   - Added: `latitude` and `longitude` columns
   - Created: `game-images` storage bucket
   - Created: Storage policies for image access

## 🎯 How It Works

### Cover Photo Flow
1. Instructor selects photo from device/computer
2. Photo is validated (< 5MB, image type)
3. Preview is shown
4. On submit, photo is uploaded to Supabase Storage bucket `game-images`
5. Public URL is stored in `games.image_url`
6. GameCard/TimeSlotCard displays the custom photo

### Custom Title Flow
1. Instructor enters custom title (e.g., "Morning Vinyasa Flow")
2. Title is stored in `games.custom_title`
3. Display components check for custom_title first
4. Falls back to venue_name if no custom title

### Location Pin Flow
1. **iOS**: 
   - Tap "Adjust Pin Location"
   - Map opens with current location
   - Drag map to position center pin
   - Tap "Save Location" to store coordinates
2. **Web**: 
   - Enter address
   - Auto-geocoding converts to lat/lng
   - Coordinates stored in database
3. Coordinates used for precise map markers in app

## 🧪 Testing Instructions

### Database Setup
```bash
# Run the migration
./setup_instructor_features.sh

# Or manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of Database/add_instructor_features.sql
# 3. Run
```

### iOS App Testing
1. Open CreateGameView
2. Tap photo upload area → Select image
3. Enter custom title (e.g., "Sunset Yoga")
4. Tap "Adjust Pin Location" → Drag map → Save
5. Fill other fields and create game
6. Verify game appears with custom title and photo

### Web App Testing
1. Navigate to home page (schedule)
2. Click available time slot
3. Upload cover photo
4. Enter event name
5. Adjust address if needed
6. Claim session
7. Verify session shows custom title in schedule

## 📊 Database Schema

```sql
-- New columns in games table
ALTER TABLE games ADD COLUMN custom_title TEXT;
ALTER TABLE games ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE games ADD COLUMN longitude DOUBLE PRECISION;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-images', 'game-images', true);
```

## 🔐 Security

- **Storage Policies**: 
  - Anyone can view images (public bucket)
  - Only authenticated users can upload
  - Users can update/delete their own images

- **RLS Policies**: 
  - Existing game RLS policies apply
  - Only game creators can update their games

## 🚀 Deployment Checklist

- [x] Database migration script created
- [x] iOS models updated
- [x] iOS UI components updated
- [x] Web app types updated
- [x] Web app UI components updated
- [x] Storage bucket created
- [x] Storage policies configured
- [x] Documentation written
- [x] Setup script created

## 📝 Next Steps

1. **Run Database Migration**
   ```bash
   ./setup_instructor_features.sh
   ```

2. **Test in Development**
   - iOS app: Build and run
   - Web app: `npm run dev`

3. **Verify Storage Bucket**
   - Check Supabase Dashboard → Storage
   - Ensure `game-images` bucket exists
   - Verify policies are active

4. **Deploy to Production**
   - Run migration on production database
   - Deploy iOS app update
   - Deploy web app update

## 🐛 Known Issues / Limitations

- Image size limited to 5MB
- No image compression before upload (consider adding)
- Location picker on web is basic (could add interactive map)
- No image cropping functionality

## 💡 Future Enhancements

- [ ] Image compression before upload
- [ ] Image cropping/editing
- [ ] Multiple photos per class
- [ ] Interactive map picker for web app
- [ ] Saved location presets
- [ ] Photo gallery for instructors
- [ ] Drag-and-drop photo upload

## 📞 Support

If you encounter issues:
1. Check database migration ran successfully
2. Verify storage bucket exists and policies are correct
3. Check console for error messages
4. Review INSTRUCTOR_FEATURES_GUIDE.md for troubleshooting

---

**Implementation Date**: January 8, 2026
**Status**: ✅ Complete and Ready for Testing
