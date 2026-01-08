# Mobile Edit Restriction - Quick Summary

## What Changed

Web-created yoga sessions **cannot be edited** from the mobile app.

## Why

To prevent data loss:
- ❌ Cover photos being removed
- ❌ Custom titles being lost
- ❌ Location pins being reset

## What You'll See

### As Host of Web-Created Session (Mobile App)

**Before:**
```
[⚙️ Manage] button → Could edit and lose data
```

**After:**
```
[🌐 Managed on web] badge
ℹ️ Info banner: "This session was created on the web app. 
   To edit details, use the web dashboard."
```

### As Host of Mobile-Created Game

**No Change:**
```
[⚙️ Manage] button → Full editing capabilities
```

## Technical Details

**How it works:**
- Web app sets `instructor_id` when creating sessions
- Mobile app checks `game.isWebManaged` (true if `instructor_id` exists)
- If web-managed: hide edit button, show info badge

**Files changed:**
1. `Pick up App/Models/Game.swift`
   - Added `instructorId` property
   - Added `isWebManaged` computed property

2. `Pick up App/Views/GameDetail/GameDetailView.swift`
   - Updated button logic to check `isWebManaged`
   - Added info banner for web-managed sessions

## User Actions

### To Edit Web-Created Sessions:
1. Go to web app: `pikk-up-com.vercel.app/home`
2. Find your session in the schedule
3. Click to edit

### To Edit Mobile-Created Games:
1. Open game in mobile app
2. Tap "Manage" button
3. Edit as normal

## What You Can Still Do on Mobile

Even for web-created sessions:
- ✅ View all details
- ✅ Join/leave as participant
- ✅ Chat with participants
- ✅ Get directions
- ✅ See who's joined

## Future: Text Blast Feature

Coming soon - ability to send messages to all participants from mobile app, regardless of how session was created.

---

**TL;DR:** Web sessions = edit on web. Mobile games = edit on mobile. Simple! 🎯
