# Push Notification Edge Function

This Supabase Edge Function sends push notifications via Apple Push Notification service (APNs) when messages are created.

## Setup Instructions

### 1. Apple Developer Configuration

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create an **APNs Key**:
   - Go to **Keys** → **Create a key**
   - Enable "Apple Push Notifications service (APNs)"
   - Download the `.p8` file (you can only download it once!)
   - Note the **Key ID**

4. Note your **Team ID** (found in Membership section)

5. Enable Push Notifications in your App ID:
   - Go to **Identifiers** → Select your App ID
   - Enable "Push Notifications" capability

### 2. Xcode Project Configuration

1. Open your Xcode project
2. Select your target → **Signing & Capabilities**
3. Click **+ Capability** → Add **Push Notifications**
4. Add **Background Modes** → Enable "Remote notifications"

### 3. Supabase Secrets Configuration

Set these secrets in your Supabase project:

```bash
supabase secrets set APNS_KEY_ID="your_key_id"
supabase secrets set APNS_TEAM_ID="your_team_id"
supabase secrets set APNS_BUNDLE_ID="your.bundle.identifier"
supabase secrets set APNS_PRIVATE_KEY="$(cat path/to/AuthKey_XXXXXXXX.p8)"
supabase secrets set APNS_ENVIRONMENT="development"  # or "production" for App Store
```

### 4. Deploy the Edge Function

```bash
supabase functions deploy send-push-notification
```

### 5. Create Database Webhooks

In Supabase Dashboard → Database → Webhooks, create two webhooks:

**Webhook 1: Direct Messages**
- Name: `push-notification-messages`
- Table: `messages`
- Events: `INSERT`
- Type: Supabase Edge Function
- Function: `send-push-notification`

**Webhook 2: Group Messages**
- Name: `push-notification-group-messages`
- Table: `group_messages`
- Events: `INSERT`
- Type: Supabase Edge Function
- Function: `send-push-notification`

### 6. Run Database Migrations

Make sure you've run the latest schema.sql which includes:
- `device_tokens` table
- `get_push_tokens_for_conversation` function
- `get_push_tokens_for_group_chat` function

## Testing

1. Install the app on a physical iOS device (simulators don't support push notifications)
2. Sign in and grant notification permissions
3. Send a message from another account
4. You should receive a push notification

## Troubleshooting

### No notifications received
- Check that the device token is being saved (check `device_tokens` table)
- Verify APNs credentials are correct
- Check Edge Function logs in Supabase Dashboard
- Make sure you're testing on a physical device

### Invalid token errors
- Token may have expired or been revoked
- User may have uninstalled/reinstalled the app
- Consider implementing token cleanup for failed deliveries

### Development vs Production
- Use `api.sandbox.push.apple.com` for development builds
- Use `api.push.apple.com` for TestFlight/App Store builds
- Set `APNS_ENVIRONMENT` accordingly
