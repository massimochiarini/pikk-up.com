# 🚀 Quick Start - Instructor Features

## ⚡ 3-Minute Setup

### 1️⃣ Database (2 minutes)
```bash
# Option A: Supabase Dashboard
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Copy/paste: Database/add_instructor_features.sql
3. Click "Run"

# Option B: Terminal
./setup_instructor_features.sh
```

### 2️⃣ iOS App (1 minute)
```bash
1. Open Xcode: Sports App 1.xcodeproj
2. Right-click: Pick up App/Views/CreateGame/
3. Add Files → Select: LocationPickerView.swift
4. Build (Cmd+R)
```

### 3️⃣ Web App (30 seconds)
```bash
cd pickup-web
npm run dev
```

## ✅ Test It Works

### iOS Test (30 seconds)
1. Tap "+" → Enter "Morning Yoga"
2. Tap "Adjust Pin Location" → Drag map → Save
3. Create game → Check it shows custom title ✓

### Web Test (30 seconds)
1. Click time slot → Upload photo → Enter "Sunset Flow"
2. Claim session → Check schedule shows custom title ✓

## 🎯 What You Get

| Feature | iOS | Web | Display |
|---------|-----|-----|---------|
| Cover Photo | ❌ (Web only) | ✅ File Upload | GameCard |
| Custom Title | ✅ Text Field | ✅ Text Input | All Views |
| Location Pin | ✅ Map Picker | ✅ Auto-geocode | Map Pins |

## 📝 Quick Reference

### Cover Photo
- **Max**: 5MB
- **Where**: CreateGameView / BookingModal
- **Storage**: `game-images` bucket

### Custom Title
- **Required**: Yes
- **Example**: "Morning Vinyasa Flow"
- **Shows**: Instead of venue name

### Location Pin
- **iOS**: Drag map to adjust
- **Web**: Auto from address
- **Precision**: ~0.1m accuracy

## 🆘 Quick Fixes

**Photo won't upload?**
→ Check file size < 5MB

**Title not showing?**
→ Run database migration

**Location wrong?**
→ iOS: Use "Center on Address" button

**Build error?**
→ Add LocationPickerView.swift to Xcode

## 📚 Full Docs

- **Complete Guide**: `INSTRUCTOR_FEATURES_GUIDE.md`
- **Implementation**: `IMPLEMENTATION_COMPLETE.md`
- **Summary**: `INSTRUCTOR_FEATURES_SUMMARY.md`

---

**Status**: ✅ Ready to use!
**Time to setup**: ~3 minutes
**Questions?**: Check troubleshooting in full docs
