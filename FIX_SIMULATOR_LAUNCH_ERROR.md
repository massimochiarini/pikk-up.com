# Fix Simulator Launch Error - "Application failed preflight checks"

## The Error

```
Simulator device failed to launch com.sportsapp.sportsapp.Sports-App-1

The request was denied by service delegate (SBMainWorkspace) 
for reason: Busy ("Application failed preflight checks").
```

## Quick Fixes (Try in Order)

### Fix #1: Clean Build Folder

1. In Xcode: **Product → Clean Build Folder** (Cmd+Shift+K)
2. Wait for it to complete
3. **Product → Build** (Cmd+B)
4. Check for any errors in the build log
5. **Product → Run** (Cmd+R)

### Fix #2: Restart Simulator

1. **Stop** the app in Xcode (stop button)
2. In Simulator: **Device → Restart**
3. Wait for simulator to restart
4. Run the app again from Xcode (Cmd+R)

### Fix #3: Delete Derived Data

1. Close Xcode
2. Open Finder
3. Press **Cmd+Shift+G** (Go to Folder)
4. Paste: `~/Library/Developer/Xcode/DerivedData`
5. Find folders starting with "Sports-App-1" or "Sports_App_1"
6. **Delete them** (move to trash)
7. Reopen Xcode
8. **Product → Clean Build Folder** (Cmd+Shift+K)
9. **Product → Build** (Cmd+B)
10. **Product → Run** (Cmd+R)

### Fix #4: Reset Simulator

1. **Stop** the app in Xcode
2. In Simulator: **Device → Erase All Content and Settings**
3. Wait for simulator to reset
4. Run the app again from Xcode

### Fix #5: Check for Build Errors

1. In Xcode, click the **⚠️ icon** in the top bar
2. Look for any **red errors** (not just warnings)
3. Common issues:
   - Missing imports
   - Syntax errors
   - Type mismatches
   - Missing files

### Fix #6: Select Different Simulator

1. In Xcode, click the **device selector** (next to scheme)
2. Choose a different simulator (e.g., iPhone 15 Pro instead of iPhone 17 Pro)
3. Try running again

### Fix #7: Restart Xcode and Simulator

1. **Quit Xcode completely** (Cmd+Q)
2. **Quit Simulator** (Cmd+Q)
3. **Reopen Xcode**
4. **Product → Clean Build Folder**
5. **Product → Build**
6. **Product → Run**

---

## Most Likely Cause

This error usually happens when:
- There are **compilation errors** we didn't see
- The simulator is in a **bad state**
- **Cached build data** is corrupted

**Try Fix #1 and Fix #3 first** - they solve 90% of cases!

---

## If Still Not Working

Run this in Terminal to completely clean everything:

```bash
cd /Users/massimo/Desktop/pickup

# Clean Xcode build
rm -rf ~/Library/Developer/Xcode/DerivedData/*Sports*

# Clean SPM cache
rm -rf ~/Library/Caches/org.swift.swiftpm

# Clean build folder
xcodebuild clean -project "Sports App 1.xcodeproj" -scheme "Sports App 1"
```

Then open Xcode and build fresh.

---

## Check Build Errors

Look in the **Issue Navigator** (⚠️ icon in left sidebar) for any errors. If you see errors, let me know what they say and I'll help fix them!

---

**TL;DR:**
1. Xcode → Product → Clean Build Folder (Cmd+Shift+K)
2. Delete DerivedData folder
3. Restart Simulator
4. Build and Run again

This should fix it! 🔨
