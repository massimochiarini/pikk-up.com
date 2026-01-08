#!/bin/bash

# Configuration Checker Script
# Verifies that web and mobile apps are using the same Supabase instance

echo "🔍 Checking Supabase Configuration..."
echo "========================================"
echo ""

# Get mobile app config
MOBILE_CONFIG_FILE="Pick up App/Services/SupabaseManager.swift"
if [ -f "$MOBILE_CONFIG_FILE" ]; then
    MOBILE_URL=$(grep -o 'https://[^"]*' "$MOBILE_CONFIG_FILE" | head -1)
    echo "📱 Mobile App:"
    echo "   URL: $MOBILE_URL"
else
    echo "❌ Error: Could not find $MOBILE_CONFIG_FILE"
    exit 1
fi

# Get web app config
WEB_CONFIG_FILE="pickup-web/.env.local"
if [ -f "$WEB_CONFIG_FILE" ]; then
    WEB_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" "$WEB_CONFIG_FILE" | cut -d '=' -f2)
    echo ""
    echo "🌐 Web App:"
    echo "   URL: $WEB_URL"
else
    echo "❌ Error: Could not find $WEB_CONFIG_FILE"
    echo "   Have you created .env.local in the pickup-web directory?"
    exit 1
fi

# Compare
echo ""
echo "========================================"
if [ "$MOBILE_URL" = "$WEB_URL" ]; then
    echo "✅ SUCCESS: Both apps use the same Supabase instance"
    echo "   This is correct! ✓"
else
    echo "❌ CRITICAL ISSUE: Different Supabase instances!"
    echo ""
    echo "   Mobile: $MOBILE_URL"
    echo "   Web:    $WEB_URL"
    echo ""
    echo "   This explains why messages don't sync!"
    echo "   Fix: Update one to match the other."
fi
echo "========================================"
echo ""

# Additional checks
echo "📋 Additional Information:"
echo ""

# Check if web app is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web app is running on http://localhost:3000"
else
    echo "ℹ️  Web app is not running. Start with: cd pickup-web && npm run dev"
fi

# Check Node modules
if [ -d "pickup-web/node_modules" ]; then
    echo "✅ Web app dependencies are installed"
else
    echo "⚠️  Web app dependencies not installed. Run: cd pickup-web && npm install"
fi

# Check for common issues
echo ""
echo "💡 Quick Diagnostic:"
echo ""

# Check recent changes
if [ -d ".git" ]; then
    RECENT_CHANGES=$(git log --since="1 week ago" --oneline --name-only | grep -E "(GameService|MessageService|group_chat)" | wc -l)
    if [ $RECENT_CHANGES -gt 0 ]; then
        echo "ℹ️  Found $RECENT_CHANGES recent changes to messaging code"
        echo "   These changes may not be in the App Store version yet"
    fi
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. If URLs don't match, fix the configuration"
echo "   2. Run: Database/verify_messaging_setup.sql in Supabase"
echo "   3. Run: Database/fix_missing_group_chats.sql if needed"
echo "   4. Test the web app at http://localhost:3000"
echo "   5. If web works, issue is the App Store mobile version"
echo ""

