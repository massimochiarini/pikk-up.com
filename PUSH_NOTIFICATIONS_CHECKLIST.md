#  Push Notifications Quick Checklist

## ⚡ Super Quick Diagnosis

Run these 3 checks in order:

### 1️⃣ Database Check (2 minutes)
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as device_tokens FROM device_tokens;
SELECT COUNT(*) as webhooks FROM information_schema.triggers WHERE trigger_name LIKE '%push%';
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_push_tokens_for_conversation', 'get_push_tokens_for_group_chat');
```

**Expected:**
- `device_tokens`: > 0 (at least your test device)
- `webhooks`: 0 (should use webhooks, not triggers)
- Both function names should appear

**If NOT matching expected:**
- 0 tokens → App not registering tokens (see Step 2)
- Functions missing → Run `Database/schema.sql` Phase 13 & 14
- Webhooks found → Delete triggers, use Supabase Dashboard webhooks instead

### 2️⃣ Xcode Check (1 minute)

Open Xcode and check **Signing & Capabilities**:
- [ ] ✅ Push Notifications capability added
- [ ] ✅ Background Modes capability added
- [ ] ✅ Background Modes → Remote notifications checked

Run app on physical device and check console for:
```
📱 Device token: [hex string]
✅ Device token registered successfully
```

**If NOT appearing:**
- App not requesting permission
- User denied permission
- Not running on physical device (simulators don't support push)

### 3️⃣ Supabase Check (2 minutes)

**A. Check Secrets:**
```bash
supabase secrets list --project-ref xkesrtakogrsrurvsmnp
```

Should show:
- APNS_KEY_ID
- APNS_TEAM_ID  
- APNS_BUNDLE_ID
- APNS_PRIVATE_KEY
- APNS_ENVIRONMENT

**If missing:** Follow Part 3 of `PUSH_NOTIFICATIONS_SETUP.md`

**B. Check Edge Function:**

Go to Supabase Dashboard → Edge Functions

- [ ] `send-push-notification` is deployed
- [ ] Has recent invocations (after sending test message)
- [ ] Logs show no errors

**If not deployed:**
```bash
supabase functions deploy send-push-notification
```

**C. Check Webhooks:**

Go to Supabase Dashboard → Database → Webhooks

- [ ] Webhook for `group_messages` table → `INSERT` event → `send-push-notification` function
- [ ] Webhook for `messages` table → `INSERT` event → `send-push-notification` function

**If missing:** Follow Part 4 of `PUSH_NOTIFICATIONS_SETUP.md`

## 🎯 Decision Tree

```
START: No push notifications received

├─ Are device tokens in database?
│  ├─ NO → Problem: App not registering tokens
│  │      Solution: Check Xcode capabilities + test on physical device
│  └─ YES → Continue
│
├─ Are database functions created?
│  ├─ NO → Problem: Database setup incomplete
│  │      Solution: Run Database/schema.sql Phase 13 & 14
│  └─ YES → Continue
│
├─ Is Edge Function deployed?
│  ├─ NO → Problem: Edge Function not deployed
│  │      Solution: Run `supabase functions deploy send-push-notification`
│  └─ YES → Continue
│
├─ Are Supabase secrets set?
│  ├─ NO → Problem: APNs credentials not configured
│  │      Solution: Follow Part 1 & 3 of setup guide (get APNs key, set secrets)
│  └─ YES → Continue
│
├─ Are database webhooks created?
│  ├─ NO → Problem: Webhooks not triggering Edge Function
│  │      Solution: Create webhooks in Supabase Dashboard
│  └─ YES → Continue
│
└─ Check Edge Function logs for errors
   ├─ "Found 0 tokens" → Device tokens not being queried correctly
   ├─ "403 Forbidden" → Invalid APNs credentials
   ├─ "Invalid token" → Wrong environment (dev vs prod)
   └─ No logs → Webhooks not firing (recreate webhooks)
```

## 📋 Full Setup Checklist

Use this to track your progress:

### Part 1: Apple Developer Portal
- [ ] Created APNs authentication key (.p8 file)
- [ ] Downloaded .p8 file (saved securely)
- [ ] Noted Key ID
- [ ] Noted Team ID
- [ ] Enabled Push Notifications for App ID

### Part 2: Xcode
- [ ] Added Push Notifications capability
- [ ] Added Background Modes capability
- [ ] Enabled Remote notifications in Background Modes
- [ ] Noted Bundle ID

### Part 3: Supabase CLI
- [ ] Installed Supabase CLI
- [ ] Logged in (`supabase login`)
- [ ] Linked project (`supabase link`)
- [ ] Set APNS_KEY_ID secret
- [ ] Set APNS_TEAM_ID secret
- [ ] Set APNS_BUNDLE_ID secret
- [ ] Set APNS_PRIVATE_KEY secret
- [ ] Set APNS_ENVIRONMENT secret
- [ ] Deployed Edge Function

### Part 4: Supabase Dashboard
- [ ] Created webhook for `group_messages` table
- [ ] Created webhook for `messages` table
- [ ] Webhooks point to `send-push-notification` function

### Part 5: Testing
- [ ] Built app on physical device
- [ ] Granted notification permission
- [ ] Device token appears in `device_tokens` table
- [ ] Sent test message
- [ ] Received push notification

## 🐛 Quick Troubleshooting

### "Failed to register for remote notifications"
→ Testing on simulator? Push only works on physical devices
→ No Push Notifications capability in Xcode

### Device token not in database
→ User not logged in when token was obtained
→ RLS policy blocking insert on `device_tokens`
→ Network error (check Xcode console)

### No notification received
→ Check Edge Function logs first
→ If "Found 0 tokens": Device token not in database
→ If "403 Forbidden": Wrong APNs credentials
→ If no logs at all: Webhooks not firing

### Works in development, not in production
→ Change `APNS_ENVIRONMENT` to "production"
→ Redeploy Edge Function
→ Production uses different APNs server

## 🔍 Diagnostic Tools

### Check Database Status
```sql
-- Run: Database/diagnose_push_notifications.sql
-- This gives you a complete diagnostic report
```

### Check Supabase Configuration
```bash
# List secrets
supabase secrets list --project-ref xkesrtakogrsrurvsmnp

# View Edge Function logs
supabase functions logs send-push-notification --project-ref xkesrtakogrsrurvsmnp
```

### Check iOS App
1. Build and run on physical device
2. Watch Xcode console for:
   - "📱 Device token: ..."
   - "✅ Device token registered successfully"
3. Check Settings → Notifications → Your App → Allow Notifications is ON

## 📞 Getting Help

**If stuck after following all steps:**

1. Run `Database/diagnose_push_notifications.sql` and review all sections
2. Check Edge Function logs in Supabase Dashboard
3. Check Xcode console output
4. Verify you're testing on a physical device, not simulator
5. Try deleting and reinstalling the app
6. Double-check all APNs credentials match

**Most common issues (95% of problems):**
1. Testing on simulator (won't work)
2. Secrets not set or set incorrectly
3. Webhooks not created
4. Edge Function not deployed
5. Wrong APNS_ENVIRONMENT for build type

## ⏱️ Time Estimate

| Task | Time | Can Skip? |
|------|------|-----------|
| Get APNs key from Apple | 10 min | No |
| Configure Xcode | 5 min | No |
| Set Supabase secrets | 5 min | No |
| Deploy Edge Function | 2 min | No |
| Create webhooks | 5 min | No |
| Test on device | 10 min | No |
| **TOTAL** | **~40 min** | - |

If you already have the APNs key: ~20 minutes
If everything is configured and you're just testing: ~5 minutes

## 🎓 Key Concepts

**Device Token:** Unique identifier for a specific app installation on a specific device. Changes when app is reinstalled.

**APNs:** Apple Push Notification service. Apple's service that delivers push notifications to iOS devices.

**Edge Function:** Supabase serverless function that runs when messages are created. Calls APNs to send notifications.

**Webhook:** Database trigger that calls the Edge Function when a row is inserted into `messages` or `group_messages`.

**Environment:** Development uses sandbox APNs server. Production uses production APNs server. Must match your build type.

## 🚀 Next Steps After It Works

1. Test notifications in all scenarios:
   - App in foreground
   - App in background
   - App closed
   - Multiple devices

2. Monitor Edge Function logs for success rate

3. Implement notification settings (let users mute chats)

4. Add rich notifications with images

5. Track notification open rates

6. Clean up stale device tokens periodically

Good luck! 🍀

