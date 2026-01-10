#!/bin/bash

echo "🔄 Fixing App Icon Display Issue..."
echo ""

# Step 1: Shutdown all simulators
echo "1. Shutting down all simulators..."
xcrun simctl shutdown all
sleep 2

# Step 2: Delete the app from all booted simulators
echo "2. Deleting app from simulators..."
xcrun simctl uninstall booted com.massimo.Sports-App-1 2>/dev/null || true

# Step 3: Erase simulator content
echo "3. Erasing simulator content and settings..."
xcrun simctl erase all

# Step 4: Clean derived data for this project
echo "4. Cleaning derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/Sports*

echo ""
echo "✅ Done! Now:"
echo "   1. Open Xcode"
echo "   2. Clean Build Folder (Shift + Cmd + K)"
echo "   3. Build and Run (Cmd + R)"
echo ""
echo "Your app icon should now appear correctly!"
