# ✅ You're Logged In! Next Steps:

## Step 2: Link Your Supabase Project

Run this command:

```bash
supabase link
```

When prompted for your **Project ID**:
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Click on your Pick Up project
3. Look at the URL - it will be: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`
4. Copy that project ID and paste it when asked

---

## Step 3: Set the API Key

After linking, run:

```bash
supabase secrets set RESEND_API_KEY=re_WqG5KfRa_KsXELjj3jggztdycFGgZpakY
```

---

## Step 4: Deploy the Email Function

Finally, deploy:

```bash
supabase functions deploy send-booking-confirmation
```

---

## OR: Run the Full Script

Now that you're logged in, you can run the automated script:

```bash
./setup-email.sh
```

It will:
1. ✅ Skip login (already done)
2. Ask for your project ID
3. Set the API key
4. Deploy the function
5. Done!

---

**Choose your path:**
- **Easy:** Run `./setup-email.sh` (automated)
- **Manual:** Run the 3 commands above one by one

Either way works! 🚀
