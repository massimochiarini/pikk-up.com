//
//  MessageService.swift
//  Sports App 1
//

import Foundation
import Combine
import Supabase

@MainActor
class MessageService: ObservableObject {
    @Published var conversations: [ConversationWithProfile] = []
    @Published var groupChats: [GroupChatWithDetails] = []
    @Published var messages: [Message] = []
    @Published var groupMessages: [GroupMessage] = []
    @Published var isLoading = false
    @Published var unreadCount: Int = 0
    
    private let supabase = SupabaseManager.shared.client
    private var messageChannel: RealtimeChannelV2?
    private var groupMessageChannel: RealtimeChannelV2?
    
    // Decoder configured to handle ISO8601 dates from Supabase
    private var iso8601Decoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try ISO8601 with fractional seconds first
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: dateString) {
                return date
            }
            
            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            if let date = formatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
        }
        return decoder
    }
    
    // MARK: - Conversations
    
    func fetchConversations(userId: UUID) async {
        isLoading = true
        
        do {
            // Fetch conversations where user is a participant
            let fetchedConversations: [Conversation] = try await supabase
                .from("conversations")
                .select()
                .or("participant_1.eq.\(userId.uuidString),participant_2.eq.\(userId.uuidString)")
                .order("last_message_at", ascending: false)
                .execute()
                .value
            
            // Fetch profiles for other participants
            var conversationsWithProfiles: [ConversationWithProfile] = []
            
            for conversation in fetchedConversations {
                let otherUserId = conversation.otherParticipant(currentUserId: userId)
                
                // Fetch other user's profile
                if let profile: Profile = try? await supabase
                    .from("profiles")
                    .select()
                    .eq("id", value: otherUserId.uuidString)
                    .single()
                    .execute()
                    .value {
                    
                    // Count unread messages
                    let unreadMessages: [Message] = try await supabase
                        .from("messages")
                        .select()
                        .eq("conversation_id", value: conversation.id.uuidString)
                        .neq("sender_id", value: userId.uuidString)
                        .is("read_at", value: nil)
                        .execute()
                        .value
                    
                    conversationsWithProfiles.append(
                        ConversationWithProfile(
                            conversation: conversation,
                            otherProfile: profile,
                            unreadCount: unreadMessages.count
                        )
                    )
                }
            }
            
            conversations = conversationsWithProfiles
            unreadCount = conversations.reduce(0) { $0 + $1.unreadCount }
            
        } catch {
            // Gracefully handle missing table or other errors
            // This prevents crashes when the conversations table doesn't exist yet
            print("⚠️ Conversations not available: \(error.localizedDescription)")
            conversations = []
            unreadCount = 0
        }
        
        isLoading = false
    }
    
    // MARK: - Messages
    
    func fetchMessages(conversationId: UUID) async {
        do {
            let fetchedMessages: [Message] = try await supabase
                .from("messages")
                .select()
                .eq("conversation_id", value: conversationId.uuidString)
                .order("created_at", ascending: true)
                .execute()
                .value
            
            messages = fetchedMessages
        } catch {
            print("Error fetching messages: \(error)")
        }
    }
    
    func sendMessage(conversationId: UUID, senderId: UUID, content: String) async throws {
        let newMessage = NewMessage(
            conversationId: conversationId,
            senderId: senderId,
            content: content
        )
        
        let message: Message = try await supabase
            .from("messages")
            .insert(newMessage)
            .select()
            .single()
            .execute()
            .value
        
        // Add to local messages
        messages.append(message)
    }
    
    func markMessagesAsRead(conversationId: UUID, userId: UUID) async {
        do {
            try await supabase
                .from("messages")
                .update(["read_at": ISO8601DateFormatter().string(from: Date())])
                .eq("conversation_id", value: conversationId.uuidString)
                .neq("sender_id", value: userId.uuidString)
                .is("read_at", value: nil)
                .execute()
        } catch {
            print("Error marking messages as read: \(error)")
        }
    }
    
    // MARK: - Start Conversation
    
    func startConversation(
        with otherUserId: UUID,
        currentUserId: UUID,
        contextType: ConversationContextType?,
        contextId: UUID?
    ) async throws -> Conversation {
        // Check if conversation already exists
        let existingConversations: [Conversation] = try await supabase
            .from("conversations")
            .select()
            .or("and(participant_1.eq.\(currentUserId.uuidString),participant_2.eq.\(otherUserId.uuidString)),and(participant_1.eq.\(otherUserId.uuidString),participant_2.eq.\(currentUserId.uuidString))")
            .execute()
            .value
        
        if let existing = existingConversations.first {
            return existing
        }
        
        // Create new conversation
        let newConversation = NewConversation(
            participant1: currentUserId,
            participant2: otherUserId,
            contextType: contextType?.rawValue,
            contextId: contextId
        )
        
        let conversation: Conversation = try await supabase
            .from("conversations")
            .insert(newConversation)
            .select()
            .single()
            .execute()
            .value
        
        return conversation
    }
    
    // MARK: - Real-time Subscriptions
    
    func subscribeToMessages(conversationId: UUID) async {
        messageChannel = supabase.realtimeV2.channel("messages-\(conversationId.uuidString)")
        
        let insertions = messageChannel?.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "messages",
            filter: "conversation_id=eq.\(conversationId.uuidString)"
        )
        
        Task {
            if let insertions = insertions {
                for await insertion in insertions {
                    if let message = try? insertion.decodeRecord(as: Message.self, decoder: iso8601Decoder) {
                        await MainActor.run {
                            if !self.messages.contains(where: { $0.id == message.id }) {
                                self.messages.append(message)
                            }
                        }
                    }
                }
            }
        }
        
        await messageChannel?.subscribe()
    }
    
    func unsubscribeFromMessages() async {
        await messageChannel?.unsubscribe()
        messageChannel = nil
    }
    
    // MARK: - Get Context Label
    
    func getContextLabel(for conversation: Conversation) async -> String? {
        guard let contextType = conversation.context,
              let contextId = conversation.contextId else {
            return nil
        }
        
        switch contextType {
        case .post:
            // Fetch post headline
            if let post: Post = try? await supabase
                .from("posts")
                .select()
                .eq("id", value: contextId.uuidString)
                .single()
                .execute()
                .value {
                return "From: \"\(post.headline)\""
            }
            
        case .game:
            // Fetch game name
            if let game: Game = try? await supabase
                .from("games")
                .select()
                .eq("id", value: contextId.uuidString)
                .single()
                .execute()
                .value {
                return "From: \(game.venueName)"
            }
            
        case .profile:
            return "Direct message"
        }
        
        return nil
    }
    
    // MARK: - Group Chats
    
    func fetchGroupChats(userId: UUID) async {
        do {
            // Fetch group chat IDs where user is a member
            let memberships: [GroupChatMember] = try await supabase
                .from("group_chat_members")
                .select()
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            
            let groupChatIds = memberships.map { $0.groupChatId }
            
            guard !groupChatIds.isEmpty else {
                groupChats = []
                return
            }
            
            // Fetch group chats
            var groupChatsWithDetails: [GroupChatWithDetails] = []
            
            for groupChatId in groupChatIds {
                if let groupChat: GroupChat = try? await supabase
                    .from("group_chats")
                    .select()
                    .eq("id", value: groupChatId.uuidString)
                    .single()
                    .execute()
                    .value {
                    
                    // Get member count
                    let members: [GroupChatMember] = try await supabase
                        .from("group_chat_members")
                        .select()
                        .eq("group_chat_id", value: groupChatId.uuidString)
                        .execute()
                        .value
                    
                    // Get associated game
                    let game: Game? = try? await supabase
                        .from("games")
                        .select()
                        .eq("id", value: groupChat.gameId.uuidString)
                        .single()
                        .execute()
                        .value
                    
                    groupChatsWithDetails.append(
                        GroupChatWithDetails(
                            groupChat: groupChat,
                            memberCount: members.count,
                            game: game
                        )
                    )
                }
            }
            
            // Sort by last message
            groupChats = groupChatsWithDetails.sorted {
                ($0.groupChat.lastMessageAt ?? $0.groupChat.createdAt) >
                ($1.groupChat.lastMessageAt ?? $1.groupChat.createdAt)
            }
            
        } catch {
            print("⚠️ Group chats not available: \(error.localizedDescription)")
            groupChats = []
        }
    }
    
    // MARK: - Group Messages
    
    func fetchGroupMessages(groupChatId: UUID) async {
        do {
            let fetchedMessages: [GroupMessage] = try await supabase
                .from("group_messages")
                .select()
                .eq("group_chat_id", value: groupChatId.uuidString)
                .order("created_at", ascending: true)
                .execute()
                .value
            
            groupMessages = fetchedMessages
        } catch {
            print("Error fetching group messages: \(error)")
        }
    }
    
    func sendGroupMessage(groupChatId: UUID, senderId: UUID, content: String, replyTo: GroupMessage? = nil) async throws {
        let newMessage = NewGroupMessage(
            groupChatId: groupChatId,
            senderId: senderId,
            content: content,
            replyToId: replyTo?.id,
            replyToContent: replyTo?.content,
            replyToSenderId: replyTo?.senderId
        )
        
        let message: GroupMessage = try await supabase
            .from("group_messages")
            .insert(newMessage)
            .select()
            .single()
            .execute()
            .value
        
        // Add to local messages
        groupMessages.append(message)
    }
    
    func getGroupChatMembers(groupChatId: UUID) async throws -> [GroupChatMemberWithProfile] {
        let members: [GroupChatMember] = try await supabase
            .from("group_chat_members")
            .select()
            .eq("group_chat_id", value: groupChatId.uuidString)
            .execute()
            .value
        
        var membersWithProfiles: [GroupChatMemberWithProfile] = []
        
        for member in members {
            if let profile: Profile = try? await supabase
                .from("profiles")
                .select()
                .eq("id", value: member.userId.uuidString)
                .single()
                .execute()
                .value {
                membersWithProfiles.append(
                    GroupChatMemberWithProfile(member: member, profile: profile)
                )
            }
        }
        
        return membersWithProfiles
    }
    
    // MARK: - Group Chat Real-time Subscriptions
    
    func subscribeToGroupMessages(groupChatId: UUID) async {
        groupMessageChannel = supabase.realtimeV2.channel("group-messages-\(groupChatId.uuidString)")
        
        let insertions = groupMessageChannel?.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "group_messages",
            filter: "group_chat_id=eq.\(groupChatId.uuidString)"
        )
        
        Task {
            if let insertions = insertions {
                for await insertion in insertions {
                    if let message = try? insertion.decodeRecord(as: GroupMessage.self, decoder: iso8601Decoder) {
                        await MainActor.run {
                            if !self.groupMessages.contains(where: { $0.id == message.id }) {
                                self.groupMessages.append(message)
                            }
                        }
                    }
                }
            }
        }
        
        await groupMessageChannel?.subscribe()
    }
    
    func unsubscribeFromGroupMessages() async {
        await groupMessageChannel?.unsubscribe()
        groupMessageChannel = nil
    }
    
    // MARK: - Group Chat Management
    
    func createGroupChat(gameId: UUID, name: String) async throws -> GroupChat {
        let newGroupChat = NewGroupChat(gameId: gameId, name: name)
        
        let groupChat: GroupChat = try await supabase
            .from("group_chats")
            .insert(newGroupChat)
            .select()
            .single()
            .execute()
            .value
        
        return groupChat
    }
    
    func addMemberToGroupChat(groupChatId: UUID, userId: UUID) async throws {
        let newMember = NewGroupChatMember(groupChatId: groupChatId, userId: userId)
        
        try await supabase
            .from("group_chat_members")
            .insert(newMember)
            .execute()
    }
    
    func removeMemberFromGroupChat(groupChatId: UUID, userId: UUID) async throws {
        try await supabase
            .from("group_chat_members")
            .delete()
            .eq("group_chat_id", value: groupChatId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
    }
    
    func getGroupChatForGame(gameId: UUID) async throws -> GroupChat? {
        let groupChat: GroupChat? = try? await supabase
            .from("group_chats")
            .select()
            .eq("game_id", value: gameId.uuidString)
            .single()
            .execute()
            .value
        
        return groupChat
    }
    
    // MARK: - Delete/Leave Chats
    
    /// Leave a group chat (removes user from the group)
    func leaveGroupChat(groupChatId: UUID, userId: UUID) async throws {
        try await supabase
            .from("group_chat_members")
            .delete()
            .eq("group_chat_id", value: groupChatId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
        
        // Remove from local state
        groupChats.removeAll { $0.groupChat.id == groupChatId }
    }
    
    /// Delete a direct conversation
    func deleteConversation(conversationId: UUID) async throws {
        // First delete all messages in the conversation
        try await supabase
            .from("messages")
            .delete()
            .eq("conversation_id", value: conversationId.uuidString)
            .execute()
        
        // Then delete the conversation itself
        try await supabase
            .from("conversations")
            .delete()
            .eq("id", value: conversationId.uuidString)
            .execute()
        
        // Remove from local state
        conversations.removeAll { $0.conversation.id == conversationId }
    }
    
    // MARK: - Fetch Profiles
    
    /// Fetch profiles for a list of user IDs
    func fetchProfiles(userIds: [UUID]) async throws -> [Profile] {
        guard !userIds.isEmpty else { return [] }
        
        // Build the filter for multiple IDs
        let idStrings = userIds.map { $0.uuidString }
        
        let profiles: [Profile] = try await supabase
            .from("profiles")
            .select()
            .in("id", values: idStrings)
            .execute()
            .value
        
        return profiles
    }
}

