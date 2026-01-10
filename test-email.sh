#!/bin/bash

# Test Email Function with Correct URL

echo "🧪 Testing Email Function..."
echo ""

curl -i --location --request POST \
  'https://xkesrtakogrsrurvsmnp.supabase.co/functions/v1/send-booking-confirmation' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZXNydGFrb2dyc3J1cnZzbW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MzMwNjMsImV4cCI6MjA1MjMwOTA2M30.pFGQ7EzqG1vKqZSAw5hOYPSWcDf7aOVxB_fZG5L5234' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "massimochiarini@outlook.com",
    "guestName": "Test User",
    "sessionTitle": "Morning Yoga",
    "sessionDate": "Saturday, Jan 11, 2026",
    "sessionTime": "7:00 PM",
    "venueName": "Pick Up Studio",
    "venueAddress": "2500 South Miami Avenue",
    "instructorName": "Massimo",
    "cost": 0,
    "bookingId": "test-12345"
  }'

echo ""
echo ""
echo "Check your email at: massimochiarini@outlook.com"
echo "Also check spam folder!"
