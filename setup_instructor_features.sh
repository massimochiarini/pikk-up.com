#!/bin/bash

# Setup script for instructor features
# This script helps set up the new instructor features in your Supabase database

echo "=========================================="
echo "Instructor Features Setup"
echo "=========================================="
echo ""

echo "This script will guide you through setting up:"
echo "1. Cover photo upload capability"
echo "2. Custom event titles"
echo "3. Precise location pins"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. You'll need to run the SQL manually."
    echo ""
    echo "Option 1: Install Supabase CLI"
    echo "  npm install -g supabase"
    echo ""
    echo "Option 2: Run SQL manually in Supabase Dashboard"
    echo "  1. Go to https://app.supabase.com"
    echo "  2. Select your project"
    echo "  3. Go to SQL Editor"
    echo "  4. Copy and paste the contents of Database/add_instructor_features.sql"
    echo "  5. Click 'Run'"
    echo ""
    read -p "Press Enter to continue..."
else
    echo "✅ Supabase CLI found"
    echo ""
    
    # Check if project is linked
    if [ ! -f ".supabase/config.toml" ]; then
        echo "⚠️  No Supabase project linked"
        echo ""
        echo "To link your project:"
        echo "  supabase link --project-ref YOUR_PROJECT_REF"
        echo ""
        read -p "Press Enter to continue..."
    else
        echo "Would you like to run the migration now? (y/n)"
        read -r response
        
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo ""
            echo "Running migration..."
            supabase db push Database/add_instructor_features.sql
            
            if [ $? -eq 0 ]; then
                echo "✅ Migration completed successfully!"
            else
                echo "❌ Migration failed. Please check the error above."
            fi
        fi
    fi
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. ✅ Run database migration (Database/add_instructor_features.sql)"
echo ""
echo "2. 📱 iOS App Updates:"
echo "   - Game model updated with new fields"
echo "   - CreateGameView includes cover photo upload"
echo "   - LocationPickerView added for precise pin placement"
echo ""
echo "3. 🌐 Web App Updates:"
echo "   - BookingModal includes cover photo upload"
echo "   - Custom title field added"
echo "   - Location geocoding integrated"
echo ""
echo "4. 🧪 Test the features:"
echo "   - Upload a cover photo"
echo "   - Set a custom event title"
echo "   - Adjust location pin"
echo ""
echo "5. 📖 Read the full guide:"
echo "   - See INSTRUCTOR_FEATURES_GUIDE.md"
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
