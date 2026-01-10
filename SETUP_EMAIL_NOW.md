# 🚀 Setup Email Confirmations - Quick Guide

## You have the API key! Let's activate it now.

### Option 1: Automatic Setup (Recommended)

I've created a setup script for you:

```bash
cd /Users/massimo/Desktop/pickup
./setup-email.sh
```

This will:
1. Set your Resend API key
2. Deploy the email function
3. Activate email confirmations

### Option 2: Manual Setup

If you don't have Supabase CLI installed:

#### Step 1: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or download from: https://github.com/supabase/cli/releases
```

#### Step 2: Login to Supabase

```bash
supabase login
```

#### Step 3: Link Your Project

```bash
cd /Users/massimo/Desktop/pickup
supabase link
```

It will ask for your project ref - find it in your Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

#### Step 4: Set the API Key

```bash
supabase secrets set RESEND_API_KEY=re_WqG5KfRa_KsXELjj3jggztdycFGgZpakY
```

#### Step 5: Deploy the Function

```bash
supabase functions deploy send-booking-confirmation
```

---

## ⚠️ CRITICAL: Security Issue

**You shared your API key in this chat!** 

After completing the setup, you must:

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Delete the current API key
3. Create a new one
4. Update it in Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_new_key
   ```

**Do this ASAP** to keep your account secure.

---

## 🧪 Testing

After setup:

1. Open your app
2. Go to any session's public booking link
3. Fill out the booking form
4. Submit
5. Check your email - you should receive a confirmation!

---

## 📧 What Guests Will Receive

```
✅ You're All Set!

Hi [Guest Name],

Your spot has been confirmed! 

[Session Details Card with:]
- Date & Time
- Location
- Instructor
- Cost
- What to Bring

Booking ID: #abc12345
```

---

## Need Help?

- **Full guide:** See `EMAIL_CONFIRMATION_SETUP.md`
- **Quick reference:** See `EMAIL_QUICK_START.md`
- **System overview:** See `EMAIL_SYSTEM_SUMMARY.md`

---

## Next Steps After Setup

1. ✅ Test with a real booking
2. ⚠️ Regenerate your API key (security!)
3. 🎨 (Optional) Customize the email template
4. 🌐 (Optional) Verify your custom domain

---

**Ready to activate? Run the setup script above!** 🚀
