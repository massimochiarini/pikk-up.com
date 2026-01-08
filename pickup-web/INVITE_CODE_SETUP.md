# Invite Code Setup Guide

## Overview
The web app now requires a valid invite code for signup, making it merchant/instructor-only. This prevents unauthorized users from creating accounts.

## How It Works

### User Experience
1. When a user tries to sign up, they must enter an invite code as the first field
2. If the invite code is missing, they'll see: **"Invite code is required"**
3. If the invite code is incorrect, they'll see: **"Invalid invite code. Please contact support to get a valid code."**
4. Only after entering a valid code can they proceed with account creation

### Security
- Invite codes are validated **before** creating the Supabase auth account
- Failed validation prevents the signup process from continuing
- Clear error messages guide users to contact support

## Configuration

### Setting Up Invite Codes

1. **Copy the example environment file** (if you haven't already):
   ```bash
   cd pickup-web
   cp env.local.example .env.local
   ```

2. **Edit `.env.local`** and set your valid invite codes:
   ```bash
   NEXT_PUBLIC_VALID_INVITE_CODES=INSTRUCTOR2024,MERCHANT2024,YOURCODE123
   ```

   - Use comma-separated values for multiple codes
   - Codes are case-sensitive
   - No spaces around codes (they'll be trimmed automatically)

3. **Restart your development server** to load the new environment variables:
   ```bash
   npm run dev
   ```

### Example Configuration

```env
# Valid invite codes (comma-separated)
NEXT_PUBLIC_VALID_INVITE_CODES=SPRING2024,INSTRUCTOR_INVITE,PICKLEBALL_PRO

# Example with single code
NEXT_PUBLIC_VALID_INVITE_CODES=MERCHANT2024
```

## Managing Invite Codes

### Adding New Codes
1. Edit `.env.local`
2. Add the new code to the comma-separated list
3. Restart the development server
4. Share the code with approved instructors

### Revoking Codes
1. Remove the code from `.env.local`
2. Restart the development server
3. Anyone trying to use the old code will be denied

### Production Deployment
For production (e.g., Vercel), set the environment variable in your hosting platform:
- **Variable Name**: `NEXT_PUBLIC_VALID_INVITE_CODES`
- **Variable Value**: `CODE1,CODE2,CODE3`

## Testing

### Test Valid Code
1. Go to `/auth/signup`
2. Enter a valid code from your `.env.local`
3. Complete email and password
4. Should proceed to profile setup

### Test Invalid Code
1. Go to `/auth/signup`
2. Enter `INVALID_CODE`
3. Try to submit
4. Should see error: "Invalid invite code. Please contact support to get a valid code."

### Test Missing Code
1. Go to `/auth/signup`
2. Leave invite code field empty
3. Try to submit
4. Should see error: "Invite code is required"

## UI Changes

The signup page now shows:
- Title: **"Create Instructor Account"** (was "Create Account")
- Subtitle: **"For approved instructors only"** (was "Join the pickleball community")
- First field is the **Invite Code** with a required indicator (*)
- Helper text below field: "Contact support if you don't have an invite code"

## Troubleshooting

### Issue: All codes are rejected
**Solution**: Ensure your `.env.local` file is in the `pickup-web` directory and the server has been restarted.

### Issue: Codes with spaces don't work
**Solution**: The validation automatically trims whitespace. Remove spaces from your codes in `.env.local`.

### Issue: Changes to `.env.local` not taking effect
**Solution**: Restart your development server (`npm run dev`).

## Security Considerations

⚠️ **Note**: Since this uses `NEXT_PUBLIC_` prefix, the codes are technically visible in the client-side JavaScript bundle. For maximum security in production, consider implementing a server-side API route that validates codes against a database table. However, for a small number of instructors/merchants, this client-side approach provides adequate protection against casual unauthorized signups.

## Mobile App
This feature is **web app only**. The mobile iOS app is unchanged and does not require invite codes.

