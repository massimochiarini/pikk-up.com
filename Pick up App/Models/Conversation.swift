//
//  Conversation.swift
//  Sports App 1
//

import Foundation

enum ConversationContextType: String, Codable, Sendable {
    case post = "post"
    case game = "game"
    case profile = "profile"
}

struct Conversation: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let participant1: UUID
    let participant2: UUID
    let contextType: String?
    let contextId: UUID?
    let lastMessageAt: Date?
    let lastMessagePreview: String?
    let createdAt: Date
    
    var context: ConversationContextType? {
        guard let type = contextType else { return nil }
        return ConversationContextType(rawValue: type)
    }
    
    func otherParticipant(currentUserId: UUID) -> UUID {
        participant1 == currentUserId ? participant2 : participant1
    }
    
    var timeAgo: String {
        guard let lastMessage = lastMessageAt else { return "" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: lastMessage, relativeTo: Date())
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case participant1 = "participant_1"
        case participant2 = "participant_2"
        case contextType = "context_type"
        case contextId = "context_id"
        case lastMessageAt = "last_message_at"
        case lastMessagePreview = "last_message_preview"
        case createdAt = "created_at"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Conversation, rhs: Conversation) -> Bool {
        lhs.id == rhs.id
    }
}

// For creating new conversations
struct NewConversation: Encodable, Sendable {
    let participant1: UUID
    let participant2: UUID
    let contextType: String?
    let contextId: UUID?
    
    enum CodingKeys: String, CodingKey {
        case participant1 = "participant_1"
        case participant2 = "participant_2"
        case contextType = "context_type"
        case contextId = "context_id"
    }
}

// Conversation with other participant's profile for display
struct ConversationWithProfile: Identifiable, Sendable, Hashable {
    let conversation: Conversation
    let otherProfile: Profile
    let unreadCount: Int
    
    var id: UUID { conversation.id }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: ConversationWithProfile, rhs: ConversationWithProfile) -> Bool {
        lhs.id == rhs.id
    }
}

