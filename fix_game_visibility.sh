#!/bin/bash

# Fix Game Visibility Issues
# This script updates the database to ensure all users can see both yoga and pickleball games

echo "🔧 Fixing sport preference to show all games..."

# Get Supabase credentials from environment or prompt
if [ -z "$SUPABASE_PROJECT_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Please set SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    echo ""
    echo "Example:"
    echo 'export SUPABASE_PROJECT_URL="https://your-project.supabase.co"'
    echo 'export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"'
    exit 1
fi

# Run the SQL migration
curl -X POST \
  "$SUPABASE_PROJECT_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d @Database/fix_sport_preference.sql

echo ""
echo "✅ Database updated! All users can now see both yoga and pickleball games."
echo ""
echo "📱 Next steps:"
echo "1. Restart your iOS simulator or rebuild the app"
echo "2. Pull down to refresh the feed on the mobile app"
echo "3. Your yoga session from Jan 8 at 5:00 PM should now appear!"
