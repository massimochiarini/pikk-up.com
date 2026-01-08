# Account Deletion Feature - Setup Instructions

## Overview
This implementation adds account deletion functionality to comply with Apple's App Store Guideline 5.1.1(v) - Data Collection and Storage.

## What Was Implemented

### 1. Database Function (`delete_account_function.sql`)
A secure database function that allows authenticated users to delete their own accounts. This function:
- Uses `SECURITY DEFINER` to execute with elevated privileges
- Validates the user is authenticated
- Deletes the user from `auth.users` table
- Automatically cascades to delete all related data (profiles, posts, messages, games, RSVPs, connections, etc.)

### 2. AuthService (`AuthService.swift`)
Added `deleteAccount()` method that:
- Unregisters the device token for push notifications
- Calls the database RPC function to delete the user account
- Clears all local state and UserDefaults
- Handles errors appropriately

### 3. Settings UI (`SettingsView.swift`)
Added "Delete Account" button in the Account section that:
- Appears below the "Sign Out" option
- Shows a clear confirmation dialog with warning message
- Explains that the action is permanent and irreversible
- Lists what data will be deleted
- Handles errors with user-friendly alerts

## Setup Instructions

### Step 1: Run the Database Migration

You **MUST** run the SQL function in your Supabase database before the app can delete accounts:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `delete_account_function.sql`
6. Click **Run** to execute the query

**File to run:** `/Users/massimo/Desktop/pickup/Database/delete_account_function.sql`

### Step 2: Verify the Function

After running the migration, verify it was created successfully:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'delete_user' 
AND routine_schema = 'public';
```

You should see one result showing the `delete_user` function.

### Step 3: Test the Implementation

1. Build and run the app in Xcode
2. Sign in with a test account
3. Navigate to Settings
4. Scroll to the Account section
5. Tap "Delete Account"
6. Verify the confirmation dialog appears with appropriate warnings
7. Confirm deletion
8. Verify the user is signed out and returned to the auth screen
9. Try to sign in again with the deleted account - it should fail

### Step 4: Verify Data Deletion in Database

After testing, verify in Supabase that:
- The user is removed from `auth.users`
- The profile is removed from `profiles` table
- All related messages, posts, games, etc. are deleted

## What Happens When an Account is Deleted

When a user deletes their account, the following data is **permanently deleted**:

1. **User Profile**: Name, username, bio, avatar, location, favorite sports
2. **Games Created**: All games they created
3. **Game RSVPs**: Their participation in other games
4. **Posts**: All "Looking to Play" posts
5. **Messages**: All 1-on-1 conversations and group messages
6. **Connections**: All friend and connection records
7. **Device Tokens**: Push notification tokens
8. **Group Chat Memberships**: Participation in game group chats

This deletion is handled automatically by the database `ON DELETE CASCADE` constraints.

## Apple App Store Guidelines Compliance

This implementation satisfies Apple's requirements:

✅ **Account deletion is easy to find**: Located in Settings under the Account section, right below Sign Out

✅ **Clear warning provided**: Confirmation dialog explains the action is permanent and lists what will be deleted

✅ **No unnecessary obstacles**: Single confirmation dialog with simple Cancel/Delete options (no forced email/phone verification)

✅ **Immediate deletion**: Account and data are deleted immediately upon confirmation

✅ **Not just deactivation**: Account is fully deleted, not just disabled

## Response to App Store Review

When resubmitting your app, you can include this message in App Review Information:

> **Account Deletion Feature:**
> Users can delete their accounts by navigating to Settings > Account > Delete Account. The feature includes a clear warning that the action is permanent and will delete all user data including profile, games, messages, and connections. The deletion happens immediately upon confirmation.

## Technical Notes

- The database function uses `SECURITY DEFINER` which allows it to delete from `auth.users` table
- The function is granted to `authenticated` role only - unauthenticated users cannot call it
- The function validates the user is logged in using `auth.uid()`
- All related data is deleted via `ON DELETE CASCADE` foreign key constraints
- Device tokens are unregistered before deletion to stop push notifications

## Security Considerations

- ✅ Users can only delete their own account (validated by `auth.uid()`)
- ✅ Function requires authentication
- ✅ No way to delete other users' accounts
- ✅ Confirmation dialog prevents accidental deletion
- ✅ Error handling prevents partial deletions

## Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify the SQL function was created successfully
3. Ensure the user is authenticated before attempting deletion
4. Check that all RLS policies are properly configured

