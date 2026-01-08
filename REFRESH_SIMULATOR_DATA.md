# How to Refresh Simulator Data

## Problem

The mobile app (real device/TestFlight) shows correct data (1/15), but Xcode simulator shows old cached data (1/4).

## Solutions

### Quick Fix #1: Pull to Refresh

1. **Run the app in simulator**
2. **Go to Home tab**
3. **Pull down from the top** (swipe down)
4. ✅ Feed refreshes and fetches latest data from database

### Quick Fix #2: Kill and Restart App

1. In simulator, swipe up from bottom (or double-click Home button)
2. Swipe up on the app to close it completely
3. Tap the app icon to reopen
4. ✅ App fetches fresh data on launch

### Quick Fix #3: Clean Build

1. In Xcode: **Product → Clean Build Folder** (Cmd+Shift+K)
2. **Product → Build** (Cmd+B)
3. **Product → Run** (Cmd+R)
4. ✅ Fresh build with no cached data

### Complete Reset (if needed)

If the above don't work, reset the simulator:

1. **Stop the app** in Xcode
2. **Simulator → Device → Erase All Content and Settings**
3. **Run the app again** from Xcode
4. **Sign in again**
5. ✅ Complete fresh start

## Why This Happens

- Simulator stores data locally
- Database was updated but app didn't re-fetch
- Pull-to-refresh or app restart triggers new fetch
- Real mobile app probably auto-refreshed or you restarted it

## Quick Test

After pulling to refresh, the card should show:
- ✅ "1/15 attending" (not "1/4")
- ✅ Custom title
- ✅ Instructor name
- ✅ No address line

---

**TL;DR:** Just **pull down to refresh** the feed in the simulator! 📲
