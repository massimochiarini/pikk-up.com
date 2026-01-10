# 🔧 Fix Guest Booking Form

## Issue
The public booking form was showing an error: "Could not find the 'guest_email' column of 'rsvps' in the schema cache"

This happens because the database migration for guest bookings hasn't been applied yet.

## ✅ What Was Fixed
1. **Removed phone number field** from the booking form (as requested)
2. **Created database migration guide** to add guest booking support

## 🚀 How to Apply the Fix

### Step 1: Run Database Migration

You need to run the SQL migration in your Supabase dashboard to add the guest booking columns.

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the entire SQL script below
6. Click "Run" (or press Cmd+Enter)

```sql
-- =====================================================
-- GUEST BOOKINGS: Add support for public booking links
-- =====================================================

-- Step 1: Make user_id nullable to support guest RSVPs
ALTER TABLE rsvps ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add guest information columns
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_first_name TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_last_name TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Step 3: Update unique constraint to handle both user and guest RSVPs
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS unique_game_user;

CREATE UNIQUE INDEX IF NOT EXISTS unique_game_user_rsvp 
ON rsvps(game_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_game_guest_rsvp 
ON rsvps(game_id, guest_email) 
WHERE guest_email IS NOT NULL;

-- Step 4: Add check constraint
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS rsvp_user_or_guest;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_user_or_guest 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_first_name IS NOT NULL AND guest_last_name IS NOT NULL AND guest_email IS NOT NULL)
);

-- Step 5: Update RLS policies to allow guest bookings
DROP POLICY IF EXISTS "Users can create their own rsvps" ON rsvps;
CREATE POLICY "Users and guests can create rsvps" ON rsvps
    FOR INSERT WITH CHECK (
      (user_id = auth.uid()) OR 
      (user_id IS NULL AND guest_email IS NOT NULL)
    );

DROP POLICY IF EXISTS "Users can delete their own rsvps" ON rsvps;
CREATE POLICY "Users can delete their own rsvps" ON rsvps
    FOR DELETE USING (user_id = auth.uid());

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_email ON rsvps(guest_email) WHERE guest_email IS NOT NULL;

DROP INDEX IF EXISTS idx_rsvps_user_id;
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id) WHERE user_id IS NOT NULL;

-- Done!
SELECT 'Migration completed successfully! Guest bookings are now enabled.' as status;
```

### Step 2: Verify the Migration

After running the SQL, you should see:
```
Migration completed successfully! Guest bookings are now enabled.
```

### Step 3: Test the Booking Form

1. Create a session in your app (as an instructor)
2. Get the public booking link (it should look like: `https://your-domain.com/book/[game-id]`)
3. Open the link in an incognito/private browser window
4. Fill out the form with:
   - First Name
   - Last Name
   - Email
5. Click "Reserve My Spot"
6. You should see a success message ✅

## 📋 What Changed in the Code

### File: `app/book/[id]/page.tsx`

**Removed:**
- Phone number state variable
- Phone number input field
- Phone number from the RSVP submission

**Result:**
- Cleaner, simpler booking form
- Only essential information collected (name + email)

## 🔍 How It Works

### Database Schema

After the migration, the `rsvps` table supports two types of bookings:

1. **Authenticated User RSVPs:**
   - `user_id` is set (UUID)
   - Guest fields are NULL

2. **Guest RSVPs (Public Bookings):**
   - `user_id` is NULL
   - `guest_first_name`, `guest_last_name`, `guest_email` are set
   - `guest_phone` is optional (currently not collected)

### Security

- Guests can only CREATE RSVPs (cannot delete them)
- Authenticated users can create and delete their own RSVPs
- Duplicate prevention works for both types:
  - Users: One RSVP per game per `user_id`
  - Guests: One RSVP per game per `guest_email`

## ✨ Features

- ✅ Public booking links work without authentication
- ✅ Email validation to prevent duplicates
- ✅ Session capacity checks (no overbooking)
- ✅ Guest info stored securely
- ✅ RSVPs visible to instructors in the app
- ✅ Clean, simple booking form

## 🎯 Next Steps

After applying the migration, you can:

1. **Share booking links** with students/clients
2. **View all bookings** (both users and guests) in your app
3. **Send emails** to guests using the stored email addresses
4. **Track attendance** through the RSVP system

## Need Help?

If you encounter any issues:
1. Check that you ran the entire SQL script in Supabase
2. Verify your app is connected to the correct Supabase project
3. Clear your browser cache and try again
4. Check the browser console for any error messages

---

**Date Fixed:** January 10, 2026
**Files Modified:** `app/book/[id]/page.tsx`
**Database Changes:** Guest RSVP columns added to `rsvps` table
