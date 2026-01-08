//
//  GroupChat.swift
//  Sports App 1
//

import Foundation

struct GroupChat: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let gameId: UUID
    let name: String
    let lastMessageAt: Date?
    let lastMessagePreview: String?
    let createdAt: Date
    
    var timeAgo: String {
        guard let lastMessage = lastMessageAt else { return "" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: lastMessage, relativeTo: Date())
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case gameId = "game_id"
        case name
        case lastMessageAt = "last_message_at"
        case lastMessagePreview = "last_message_preview"
        case createdAt = "created_at"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: GroupChat, rhs: GroupChat) -> Bool {
        lhs.id == rhs.id
    }
}

// For creating new group chats
struct NewGroupChat: Encodable, Sendable {
    let gameId: UUID
    let name: String
    
    enum CodingKeys: String, CodingKey {
        case gameId = "game_id"
        case name
    }
}

// Group chat member
struct GroupChatMember: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let groupChatId: UUID
    let userId: UUID
    let joinedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case groupChatId = "group_chat_id"
        case userId = "user_id"
        case joinedAt = "joined_at"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: GroupChatMember, rhs: GroupChatMember) -> Bool {
        lhs.id == rhs.id
    }
}

// For adding members to group chats
struct NewGroupChatMember: Encodable, Sendable {
    let groupChatId: UUID
    let userId: UUID
    
    enum CodingKeys: String, CodingKey {
        case groupChatId = "group_chat_id"
        case userId = "user_id"
    }
}

// Group message (separate from 1-to-1 messages)
struct GroupMessage: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let groupChatId: UUID
    let senderId: UUID
    let content: String
    let replyToId: UUID?
    let replyToContent: String?
    let replyToSenderId: UUID?
    let createdAt: Date
    
    var formattedTime: String {
        let formatter = DateFormatter()
        let calendar = Calendar.current
        
        if calendar.isDateInToday(createdAt) {
            formatter.dateFormat = "h:mm a"
        } else if calendar.isDateInYesterday(createdAt) {
            return "Yesterday"
        } else {
            formatter.dateFormat = "MMM d"
        }
        
        return formatter.string(from: createdAt)
    }
    
    func isSentBy(_ userId: UUID) -> Bool {
        senderId == userId
    }
    
    var hasReply: Bool {
        replyToId != nil
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case groupChatId = "group_chat_id"
        case senderId = "sender_id"
        case content
        case replyToId = "reply_to_id"
        case replyToContent = "reply_to_content"
        case replyToSenderId = "reply_to_sender_id"
        case createdAt = "created_at"
    }
    
    // Custom decoder to handle missing reply fields gracefully
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        groupChatId = try container.decode(UUID.self, forKey: .groupChatId)
        senderId = try container.decode(UUID.self, forKey: .senderId)
        content = try container.decode(String.self, forKey: .content)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        
        // Use decodeIfPresent for optional reply fields (handles both null and missing keys)
        replyToId = try container.decodeIfPresent(UUID.self, forKey: .replyToId)
        replyToContent = try container.decodeIfPresent(String.self, forKey: .replyToContent)
        replyToSenderId = try container.decodeIfPresent(UUID.self, forKey: .replyToSenderId)
    }
    
    // Standard memberwise initializer for creating instances in code
    init(id: UUID, groupChatId: UUID, senderId: UUID, content: String, replyToId: UUID?, replyToContent: String?, replyToSenderId: UUID?, createdAt: Date) {
        self.id = id
        self.groupChatId = groupChatId
        self.senderId = senderId
        self.content = content
        self.replyToId = replyToId
        self.replyToContent = replyToContent
        self.replyToSenderId = replyToSenderId
        self.createdAt = createdAt
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: GroupMessage, rhs: GroupMessage) -> Bool {
        lhs.id == rhs.id
    }
}

// For sending new group messages
struct NewGroupMessage: Encodable, Sendable {
    let groupChatId: UUID
    let senderId: UUID
    let content: String
    let replyToId: UUID?
    let replyToContent: String?
    let replyToSenderId: UUID?
    
    enum CodingKeys: String, CodingKey {
        case groupChatId = "group_chat_id"
        case senderId = "sender_id"
        case content
        case replyToId = "reply_to_id"
        case replyToContent = "reply_to_content"
        case replyToSenderId = "reply_to_sender_id"
    }
    
    // Custom encoding to skip nil values entirely (not encode as null)
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(groupChatId, forKey: .groupChatId)
        try container.encode(senderId, forKey: .senderId)
        try container.encode(content, forKey: .content)
        // Only encode reply fields if they have values
        if let replyToId = replyToId {
            try container.encode(replyToId, forKey: .replyToId)
        }
        if let replyToContent = replyToContent {
            try container.encode(replyToContent, forKey: .replyToContent)
        }
        if let replyToSenderId = replyToSenderId {
            try container.encode(replyToSenderId, forKey: .replyToSenderId)
        }
    }
}

// Group chat with member count and game info for display
struct GroupChatWithDetails: Identifiable, Sendable, Hashable {
    let groupChat: GroupChat
    let memberCount: Int
    let game: Game?
    
    var id: UUID { groupChat.id }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: GroupChatWithDetails, rhs: GroupChatWithDetails) -> Bool {
        lhs.id == rhs.id
    }
}

// Member with profile for display
struct GroupChatMemberWithProfile: Identifiable, Sendable, Hashable {
    let member: GroupChatMember
    let profile: Profile
    
    var id: UUID { member.id }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: GroupChatMemberWithProfile, rhs: GroupChatMemberWithProfile) -> Bool {
        lhs.id == rhs.id
    }
}
