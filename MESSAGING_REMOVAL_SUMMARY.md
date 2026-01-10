# Messaging Feature Removal - Summary

## Completed ✅

### Mobile App (iOS)
1. ✅ Removed Messages tab from navigation (ContentView.swift)
2. ✅ Deleted MessagesView, ConversationView, GroupConversationView
3. ✅ Deleted MessageService
4. ✅ Deleted Message, Conversation, GroupChat models
5. ✅ Created Sport enum to replace deleted type
6. ✅ Fixed FeedService syntax errors
7. ✅ Commented out message-related code in:
   - OtherProfileView (message button, invite sheet)
   - ProfileView (PostMiniCard)
   - GameService (group chat creation)
   - PlayerLookingCard (entire component)
8. ✅ Fixed Sport enum (added color, Identifiable)
9. ✅ Fixed various preview and reference issues

### Web App
1. ✅ Removed Messages link from Navbar
2. ✅ Added Text Blast link for instructors only
3. ✅ Deleted /app/messages/page.tsx
4. ✅ Created /app/text-blast/page.tsx with full instructor text blast feature

## Remaining Issues (Mobile App)

The following files still need messaging references removed:

### 1. GameDetailView.swift
- Remove `@StateObject private var messageService = MessageService()`
- Remove `@State private var groupChat: GroupChat?`
- Remove `@State private var members: [GroupChatMemberWithProfile] = []`
- Remove message-related functions
- Remove chat tab/section

### 2. CreatePostSheet.swift
- Remove `PostService` reference
- Comment out or remove entire post creation feature

## Text Blast Feature (Web App)

### Created: `/app/text-blast/page.tsx`

**Features:**
- Only visible to instructors (`is_instructor` flag)
- Select from your created classes
- Send text message to all students in the class
- Shows count of students with phone numbers
- Character limit: 320 characters
- Logs text blasts to `text_blasts` table

**Database Table Needed:**
```sql
CREATE TABLE text_blasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  recipient_count INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Benefits of This Change

1. **Simplified App**: Removed complex messaging system
2. **Instructor Control**: Instructors can now broadcast to all students at once
3. **Better Communication**: Text blasts reach students via SMS (more reliable than in-app messaging)
4. **Reduced Maintenance**: Less code to maintain and fewer potential bugs

## Integration with SMS Provider

The text blast feature currently logs messages to the database. To actually send SMS:

1. Add Twilio or similar SMS provider
2. Create an API endpoint in `/api/send-text-blast`
3. Update text-blast page to call this API
4. API should:
   - Verify instructor permission
   - Get student phone numbers
   - Send via SMS provider
   - Log to database

## Testing

### Mobile App:
- Build and run - ensure no Messages tab
- Verify app navigation works with only Home and My Classes tabs

### Web App:
- Login as instructor → see Text Blast in nav
- Login as student → should NOT see Text Blast
- Test sending a blast (currently just logs)

## Notes

- All messaging database tables can remain (conversations, messages, group_chats, etc.) - they just won't be accessed from the apps
- If you want to fully remove messaging from database, additional SQL migration scripts would be needed
- The mobile app may need additional cleanup in GameDetailView and any other views that reference messaging
