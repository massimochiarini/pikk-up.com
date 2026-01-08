# Deploy Updates to Vercel

## Quick Deploy (3 Steps)

### Step 1: Stage Your Changes

```bash
cd /Users/massimo/Desktop/pickup

# Add the web app changes
git add pickup-web/

# Add database changes
git add Database/

# Add documentation (optional)
git add *.md
```

### Step 2: Commit Your Changes

```bash
git commit -m "Fix messaging DM functionality and update card styling"
```

### Step 3: Push to GitHub

```bash
git push origin 2026-01-06-xxkb
```

Vercel will **automatically detect the push** and deploy!

---

## What Happens After Push

1. **GitHub receives** your code
2. **Vercel detects** the push automatically
3. **Vercel builds** the updated site (~2-3 minutes)
4. **Vercel deploys** to: `pikk-up-com.vercel.app`
5. **You get a notification** (if you have email notifications on)

---

## Check Deployment Status

### Option 1: Vercel Dashboard
Go to: https://vercel.com/dashboard
- See build progress in real-time
- Get deployment URL
- Check for errors

### Option 2: Terminal
```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Check deployment status
vercel ls
```

---

## Changes Being Deployed

Your updates include:
- ✅ Fixed messaging/DM functionality (better error logging)
- ✅ Updated card styling (black background)
- ✅ Game card improvements (instructor name, no address)
- ✅ Sport filter fixes
- ✅ Profile photo updates
- ✅ Landing page redesign
- ✅ Various bug fixes

---

## If Something Goes Wrong

### Build Fails
- Check Vercel dashboard for error message
- Usually it's a TypeScript error or missing environment variable

### Site is Blank
- Check that Supabase environment variables are set in Vercel
- Go to: Vercel Project → Settings → Environment Variables

### Old Version Still Showing
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache
- Wait 1-2 minutes for CDN to update

---

## Run These Commands Now

Open Terminal and paste these one at a time:

```bash
# 1. Navigate to project
cd /Users/massimo/Desktop/pickup

# 2. Stage changes
git add pickup-web/ Database/ *.md

# 3. Commit
git commit -m "Update: Fix messaging DM, update styling, improve game cards"

# 4. Push to trigger deployment
git push origin 2026-01-06-xxkb
```

---

## After Deployment

1. ✅ Wait 2-3 minutes for build
2. ✅ Visit: https://pikk-up-com.vercel.app
3. ✅ Hard refresh (Cmd+Shift+R)
4. ✅ Test messaging functionality
5. ✅ Check that card styling is updated

---

**TL;DR:** Run these commands, wait 3 minutes, then check pikk-up-com.vercel.app! 🚀

```bash
cd /Users/massimo/Desktop/pickup
git add pickup-web/ Database/
git commit -m "Fix messaging and update styling"
git push origin 2026-01-06-xxkb
```
