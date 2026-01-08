# 🔔 Push Notifications Setup Guide

## Current Status: ⚠️ NOT CONFIGURED

Your push notification infrastructure is built but needs configuration. This guide will walk you through **every step** to get push notifications working.

## Quick Diagnosis

Run this checklist to identify what's missing:

- [ ] APNs Key created in Apple Developer Portal
- [ ] Push Notifications capability added in Xcode
- [ ] Edge Function deployed to Supabase
- [ ] Supabase secrets configured
- [ ] Database webhooks created
- [ ] Device tokens being registered
- [ ] Testing on physical device (not simulator)

## Part 1: Apple Developer Portal Setup (15 minutes)

### Step 1: Create APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Sign in with your Apple Developer account
3. Navigate to **Certificates, Identifiers & Profiles**
4. Click on **Keys** in the sidebar
5. Click the **+** button to create a new key
6. Configure the key:
   - **Key Name:** "Pickup Push Notifications" (or your app name)
   - Check ✅ **Apple Push Notifications service (APNs)**
7. Click **Continue**, then **Register**
8. **CRITICAL:** Click **Download** and save the `.p8` file
   - ⚠️ You can ONLY download this ONCE
   - Save it somewhere safe (like your project folder)
   - File name will be like: `AuthKey_XXXXXXXXXX.p8`
9. **Note the Key ID** - shown on the download page (looks like: `AB12CD34EF`)

### Step 2: Get Your Team ID

1. Still in Apple Developer Portal
2. Click on your name in the top right
3. Click **View Membership**
4. Your **Team ID** is displayed (looks like: `XYZ1234ABC`)
5. **Write it down** - you'll need it

### Step 3: Enable Push Notifications for Your App ID

1. In Apple Developer Portal → **Identifiers**
2. Select your app's **App ID** (Bundle ID)
3. Scroll down to **Capabilities**
4. Check ✅ **Push Notifications**
5. Click **Save**

**What you should have now:**
- ✅ `.p8` file downloaded
- ✅ Key ID noted down
- ✅ Team ID noted down
- ✅ Push Notifications enabled for your App ID

## Part 2: Xcode Project Configuration (5 minutes)

### Step 1: Add Push Notifications Capability

1. Open your Xcode project: `Sports App 1.xcodeproj`
2. Select your **target** in the left sidebar
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability** button (top left)
5. Search for and add: **Push Notifications**
6. You should now see "Push Notifications" in the capabilities list

### Step 2: Add Background Modes

1. Still in **Signing & Capabilities** tab
2. Click **+ Capability** again
3. Add **Background Modes**
4. In Background Modes, check ✅ **Remote notifications**

### Step 3: Verify Bundle ID

1. In **General** tab, verify your **Bundle Identifier**
2. Write it down - you'll need it
3. Should look like: `com.yourcompany.pickup` or similar

**What you should have now:**
- ✅ Push Notifications capability added
- ✅ Background Modes → Remote notifications enabled
- ✅ Bundle ID noted down

## Part 3: Supabase Configuration (10 minutes)

### Step 1: Install Supabase CLI (if not already installed)

```bash
# macOS
brew install supabase/tap/supabase

# Or download from: https://github.com/supabase/cli
```

### Step 2: Login to Supabase

```bash
cd /Users/massimo/Desktop/pickup
supabase login
# This will open a browser to authenticate
```

### Step 3: Link Your Project

```bash
# Find your project reference ID in Supabase Dashboard URL
# URL looks like: https://supabase.com/dashboard/project/xkesrtakogrsrurvsmnp
# The ID is: xkesrtakogrsrurvsmnp

supabase link --project-ref xkesrtakogrsrurvsmnp
```

### Step 4: Set Secrets

```bash
# Replace these with YOUR actual values

# Your Key ID from Part 1, Step 1
supabase secrets set APNS_KEY_ID="AB12CD34EF"

# Your Team ID from Part 1, Step 2
supabase secrets set APNS_TEAM_ID="XYZ1234ABC"

# Your Bundle ID from Part 2, Step 3
supabase secrets set APNS_BUNDLE_ID="com.yourcompany.pickup"

# Your .p8 file contents from Part 1, Step 1
# Replace path with YOUR actual path
supabase secrets set APNS_PRIVATE_KEY="$(cat ~/Downloads/AuthKey_XXXXXXXXXX.p8)"

# Environment: "development" for testing, "production" for App Store
# Start with development
supabase secrets set APNS_ENVIRONMENT="development"
```

**IMPORTANT:** When you submit to App Store, change to:
```bash
supabase secrets set APNS_ENVIRONMENT="production"
```

### Step 5: Deploy Edge Function

```bash
cd /Users/massimo/Desktop/pickup
supabase functions deploy send-push-notification
```

You should see:
```
Deploying send-push-notification (project ref: xkesrtakogrsrurvsmnp)
Deployed send-push-notification
```

**What you should have now:**
- ✅ Supabase CLI installed and logged in
- ✅ Project linked
- ✅ All secrets configured
- ✅ Edge Function deployed

## Part 4: Database Webhooks Setup (5 minutes)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/xkesrtakogrsrurvsmnp)
2. Click **Database** → **Webhooks** in the left sidebar
3. Click **Enable Webhooks** (if needed)
4. Click **Create a new hook**

**Webhook 1: Group Messages**
- Name: `push-notification-group-messages`
- Table: `group_messages`
- Events: Check ✅ **Insert**
- Type: **Supabase Edge Function**
- Edge Function: Select `send-push-notification`
- HTTP Headers: Leave empty
- Click **Create webhook**

**Webhook 2: Direct Messages**
- Name: `push-notification-messages`
- Table: `messages`
- Events: Check ✅ **Insert**
- Type: **Supabase Edge Function**
- Edge Function: Select `send-push-notification`
- HTTP Headers: Leave empty
- Click **Create webhook**

### Option B: Via SQL (Alternative)

If webhooks UI doesn't work, you can use Supabase's trigger approach instead. See `Database/setup_push_notification_triggers.sql` (I'll create this for you).

**What you should have now:**
- ✅ Webhook created for `group_messages` table
- ✅ Webhook created for `messages` table

## Part 5: Testing (10 minutes)

### Step 1: Build and Install on Physical Device

⚠️ **CRITICAL:** Push notifications DO NOT work on simulators. You MUST test on a real iPhone or iPad.

1. Connect your physical iOS device to your Mac
2. In Xcode, select your device from the device selector
3. Click **Run** (▶️) to build and install

### Step 2: Grant Notification Permissions

1. When app launches, you should see notification permission prompt
2. Tap **Allow**
3. Check the console in Xcode for this log:
   ```
   📱 Device token: [64-character hex string]
   ✅ Device token registered successfully
   ```

### Step 3: Verify Device Token is Saved

1. Go to Supabase Dashboard → **Table Editor**
2. Open the `device_tokens` table
3. You should see a row with:
   - Your user ID
   - A long token string
   - Platform: `ios`
   - Recent timestamp

**If you DON'T see a token:**
- Check Xcode console for errors
- Make sure you're on a physical device
- Make sure you granted permissions
- See Troubleshooting section below

### Step 4: Send a Test Message

1. Open your web app or another device
2. Send a message in a group chat or direct message
3. The device should receive a push notification

**Check:**
- Notification appears when app is in background
- Notification appears when app is in foreground
- Tapping notification opens the correct chat

## Part 6: Verification

Run these checks to confirm everything works:

### Check 1: Device Token Registered
```sql
-- Run in Supabase SQL Editor
SELECT 
    dt.user_id,
    p.first_name,
    p.last_name,
    dt.token,
    dt.platform,
    dt.created_at
FROM device_tokens dt
JOIN profiles p ON p.id = dt.user_id
ORDER BY dt.created_at DESC;

-- Should show your device token
```

### Check 2: Edge Function Logs
1. Supabase Dashboard → **Edge Functions**
2. Click on `send-push-notification`
3. Click **Logs** tab
4. Send a test message
5. You should see logs like:
   ```
   Received webhook: group_messages INSERT
   Found 1 tokens to notify
   ✅ Push sent to abc123...
   ```

### Check 3: APNs Response
Look for these in Edge Function logs:
- ✅ **200 OK**: Notification sent successfully
- ❌ **400 Bad Request**: Invalid payload
- ❌ **403 Forbidden**: Invalid APNs credentials
- ❌ **410 Gone**: Device token is no longer valid

## Troubleshooting

### Issue: "Failed to register for remote notifications"

**Possible causes:**
- Not testing on physical device
- Not connected to internet
- No push notification capability in Xcode

**Solutions:**
1. Make sure you're on a physical device (not simulator)
2. Check Signing & Capabilities has Push Notifications
3. Check device is connected to internet
4. Try deleting and reinstalling the app

### Issue: Device token not appearing in database

**Check Xcode console for:**
- `❌ Error registering device token: [error]`

**Possible causes:**
- User not authenticated yet
- RLS policy blocking insert
- Network error

**Solutions:**
1. Make sure user is logged in before registering token
2. Check RLS policies on `device_tokens` table
3. Check Supabase logs for errors

### Issue: No notification received

**Check Edge Function logs:**
1. Go to Supabase Dashboard → Edge Functions → send-push-notification → Logs
2. Send a test message
3. Look for errors

**Common issues:**
- **"Found 0 tokens to notify"**: Device token not in database
- **"403 Forbidden"**: Wrong APNs credentials
- **"Invalid token"**: Using production token with sandbox endpoint (or vice versa)
- **No logs at all**: Webhook not firing (check webhook configuration)

**Solutions:**
- Verify device token exists in database
- Double-check APNs credentials (Key ID, Team ID, Bundle ID)
- Verify `APNS_ENVIRONMENT` matches your build type
- Verify webhooks are created and enabled

### Issue: Notifications work in development but not production

**Cause:** You're using `development` environment for production build

**Solution:**
```bash
supabase secrets set APNS_ENVIRONMENT="production"
supabase functions deploy send-push-notification
```

### Issue: "Invalid key" error in logs

**Possible causes:**
- Wrong Key ID
- Wrong .p8 file contents
- .p8 file has extra characters/newlines

**Solutions:**
1. Verify Key ID matches your APNs key
2. Re-upload .p8 file contents:
   ```bash
   # Make sure file path is correct
   supabase secrets set APNS_PRIVATE_KEY="$(cat path/to/AuthKey_XXX.p8)"
   ```

## Advanced: Web Push Notifications

Currently, the web app doesn't support push notifications. To add web push:

1. Use Firebase Cloud Messaging (FCM) for web
2. Or implement Web Push API with VAPID keys
3. Modify `send-push-notification` Edge Function to support both APNs and FCM/Web Push

This is optional and can be added later.

## Environment Summary

| Environment | APNs Server | When to Use | APNS_ENVIRONMENT Value |
|-------------|-------------|-------------|------------------------|
| Development | `api.sandbox.push.apple.com` | Xcode local builds, debug builds | `development` |
| Production | `api.push.apple.com` | TestFlight builds, App Store builds | `production` |

## Security Notes

- ✅ Device tokens are stored securely in Supabase with RLS
- ✅ Edge Function uses service role key (server-side only)
- ✅ APNs private key is stored as Supabase secret (encrypted)
- ❌ Never commit `.p8` files to git
- ❌ Never expose APNs credentials in client code

## Monitoring

### Success Metrics
Track these in your Edge Function logs:
- Number of notifications sent per day
- Success rate (200 responses / total attempts)
- Failed tokens (410 responses indicate stale tokens)

### Cleanup
Periodically remove stale device tokens:
```sql
-- Find tokens that consistently fail
-- Then delete them from device_tokens table
```

## Cost Considerations

- **APNs**: Free (no Apple charges for push notifications)
- **Supabase Edge Functions**: Free tier includes 500K requests/month
- **Database**: Minimal impact, just storing tokens

## Next Steps

After push notifications work:

1. Add rich notifications (images, actions)
2. Add notification categories
3. Implement silent notifications for data sync
4. Add notification preferences in settings
5. Track notification analytics

## Support

If you're stuck:

1. Check Xcode console logs
2. Check Supabase Edge Function logs
3. Verify all secrets are set: `supabase secrets list`
4. Try deleting and recreating webhooks
5. Test with a fresh device token

## Quick Reference

### Commands
```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref xkesrtakogrsrurvsmnp

# Set secret
supabase secrets set KEY="value"

# List secrets
supabase secrets list

# Deploy function
supabase functions deploy send-push-notification

# View function logs
supabase functions logs send-push-notification
```

### Key Files
- `Pick up App/Services/NotificationService.swift` - iOS notification handling
- `Pick up App/AppDelegate.swift` - Token registration
- `supabase/functions/send-push-notification/index.ts` - Edge Function
- `Database/schema.sql` - Database schema with device_tokens table

Good luck! 🚀

