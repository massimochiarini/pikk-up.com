#!/bin/bash

# Email Confirmation Setup Script - Updated
# This will set up your Resend API key and deploy the email function

echo "📧 Setting up Email Confirmations for Pick Up"
echo "=============================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Login to Supabase
echo "🔐 Step 1: Login to Supabase..."
echo "This will open your browser. Please authenticate."
echo ""
supabase login

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo ""
echo "✅ Logged in successfully"
echo ""

# Link the project
echo "🔗 Step 2: Link your Supabase project..."
echo ""
echo "You'll need your Project ID from your Supabase dashboard."
echo "Find it at: https://supabase.com/dashboard/project/YOUR_PROJECT_ID"
echo ""
supabase link

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to link project. Please check your project ID."
    exit 1
fi

echo ""
echo "✅ Project linked successfully"
echo ""

# Set the API key
echo "🔑 Step 3: Setting RESEND_API_KEY secret..."
supabase secrets set RESEND_API_KEY=re_WqG5KfRa_KsXELjj3jggztdycFGgZpakY

if [ $? -eq 0 ]; then
    echo "✅ API key set successfully"
    echo ""
else
    echo "❌ Failed to set API key"
    exit 1
fi

# Deploy the function
echo "🚀 Step 4: Deploying send-booking-confirmation function..."
supabase functions deploy send-booking-confirmation

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 Email confirmations are now active!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next steps:"
    echo "1. Test by booking a session through a public link"
    echo "2. Check your email for the confirmation"
    echo "3. ⚠️  IMPORTANT: Regenerate your Resend API key"
    echo "   (You shared it publicly - go to resend.com dashboard)"
    echo ""
else
    echo "❌ Failed to deploy function"
    exit 1
fi
