#!/bin/bash

# Pickup Web App Startup Script
# This script will check dependencies and start the development server

echo "🎾 Starting Pickup Web App..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found!"
    echo "Creating .env.local from template..."
    cp env.local.example .env.local
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local with your Supabase credentials!"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Environment configured"
echo ""
echo "🚀 Starting development server..."
echo "📱 App will open at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

