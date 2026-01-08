# Profile Photo Upload Feature - January 8, 2026

## Overview
Added the ability to view and update profile photos on the web app.

## Features Added

### 1. **Profile Photo Upload** ✅
Users can now upload a custom profile photo that replaces the default gradient circle with their initials.

**Features**:
- Click on avatar to upload photo
- Hover effect shows "Change Photo"
- Maximum file size: 5MB
- Supported formats: All image types (JPEG, PNG, GIF, WebP)
- Photos stored in Supabase `avatars` storage bucket

### 2. **Profile Photo Display** ✅
Profile photos are displayed throughout the app:
- Profile page (large, 128px)
- Navigation bar (small, 40px)
- Future: Game cards, messages, etc.

### 3. **Remove Photo** ✅
Users can remove their profile photo and revert to the default gradient circle.

**Features**:
- "Remove Photo" button appears below avatar when photo exists
- Deletes photo from storage
- Updates profile to use default avatar

## How It Works

### Upload Flow
1. User hovers over avatar on profile page
2. "Change Photo" overlay appears
3. User clicks to select image
4. Image validation (< 5MB, image type)
5. Old avatar deleted from storage (if exists)
6. New image uploaded to `/avatars/{user_id}/{timestamp}.{ext}`
7. Public URL generated
8. Profile updated with `avatar_url`
9. Navbar refreshes to show new avatar

### Storage Structure
```
Supabase Storage: avatars/
├── {user_id_1}/
│   ├── 1704729600000.jpg
│   └── 1704816000000.png
├── {user_id_2}/
│   └── 1704902400000.jpg
```

### Fallback Behavior
If no avatar is uploaded:
- Shows gradient circle (sky-blue to neon-green)
- Displays first letter of first name
- Consistent across entire app

## User Experience

### Profile Page
**With Photo**:
- Shows uploaded photo (128x128px, circular)
- Hover: "Change Photo" overlay
- "Remove Photo" button below

**Without Photo**:
- Shows gradient circle with initial
- Hover: "Change Photo" overlay
- No remove button

### Navigation Bar
**With Photo**:
- Shows uploaded photo (40x40px, circular)
- Border and shadow for polish

**Without Photo**:
- Shows gradient circle with initial
- Consistent with profile page

## Technical Implementation

### Files Modified

1. **pickup-web/app/profile/page.tsx**
   - Added `handleImageUpload()` function
   - Added `handleRemoveAvatar()` function
   - Updated avatar display section
   - Added upload overlay with hover effect
   - Added remove button

2. **pickup-web/components/Navbar.tsx**
   - Updated avatar to show profile photo if exists
   - Falls back to gradient circle with initial

### Storage Bucket
- **Bucket**: `avatars` (already exists from schema)
- **Public**: Yes (read-only for everyone)
- **Permissions**:
  - View: Everyone
  - Upload: Authenticated users
  - Delete: User's own photos only

### Database
- **Table**: `profiles`
- **Column**: `avatar_url` (TEXT, nullable)
- Stores public URL from Supabase Storage

## Security & Validation

### File Validation
- **Max size**: 5MB
- **Type check**: Must be image/* MIME type
- **Error handling**: User-friendly error messages

### Storage Security
- Users can only delete their own photos
- Path includes user ID: `/avatars/{user_id}/...`
- RLS policies enforce user ownership

### URL Security
- Public URLs are read-only
- No authentication required to view
- Cannot modify without authentication

## Error Handling

### Upload Errors
- File too large → "Image must be less than 5MB"
- Invalid type → "Please select an image file"
- Network error → "Failed to upload image"

### Remove Errors
- Network error → "Failed to remove image"
- Storage error → Logs to console

### Display
- Errors shown in red banner at top of form
- Success messages in green banner
- Loading states during upload/remove

## Future Enhancements

### Potential Improvements
1. **Image Cropping**
   - Allow users to crop before upload
   - Ensure consistent aspect ratio

2. **Image Compression**
   - Auto-compress large images
   - Reduce storage usage

3. **Multiple Sizes**
   - Generate thumbnails (small, medium, large)
   - Optimize for different display contexts

4. **Drag & Drop**
   - Drag image onto avatar to upload
   - Better UX for desktop users

5. **Avatar Everywhere**
   - Show in game participant lists
   - Show in message threads
   - Show in RSVPs

6. **Profile Gallery**
   - Allow multiple photos
   - Gallery view on profile

## Testing Checklist

### Upload
- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Upload GIF image
- [ ] Try file > 5MB (should fail)
- [ ] Try non-image file (should fail)
- [ ] Verify photo appears in navbar
- [ ] Refresh page - photo persists

### Remove
- [ ] Click "Remove Photo"
- [ ] Verify photo removed from storage
- [ ] Verify gradient circle appears
- [ ] Refresh page - still shows gradient

### Display
- [ ] Photo appears on profile page
- [ ] Photo appears in navbar
- [ ] Photo is circular
- [ ] Hover shows "Change Photo"
- [ ] Loading states work correctly

### Edge Cases
- [ ] Upload multiple times (old photo deleted)
- [ ] Cancel file picker (no error)
- [ ] Slow network (loading states)
- [ ] Very small image (scales correctly)
- [ ] Very large dimensions (resizes)

## Usage Example

### First Time Upload
1. Navigate to Profile page
2. Hover over default avatar (gradient with "M")
3. Click on "Change Photo"
4. Select image from computer
5. Wait for upload (shows "Uploading..." spinner)
6. Photo appears, success message shows
7. Navigate away - photo appears in navbar

### Changing Photo
1. Navigate to Profile page
2. Hover over current photo
3. Click "Change Photo"
4. Select new image
5. Old photo automatically deleted
6. New photo appears

### Removing Photo
1. Navigate to Profile page
2. Click "Remove Photo" button
3. Photo deleted from storage
4. Gradient circle with initial appears
5. Remove button disappears

---

**Status**: ✅ Complete and ready to use
**Storage**: Supabase Storage (`avatars` bucket)
**Database**: `profiles.avatar_url` column
**Max Size**: 5MB per image
**Formats**: All image types
