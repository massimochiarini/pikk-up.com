//
//  Message.swift
//  Sports App 1
//

import Foundation

struct Message: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let conversationId: UUID
    let senderId: UUID
    let content: String
    let readAt: Date?
    let createdAt: Date
    
    var isRead: Bool {
        readAt != nil
    }
    
    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: createdAt, relativeTo: Date())
    }
    
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
    
    enum CodingKeys: String, CodingKey {
        case id
        case conversationId = "conversation_id"
        case senderId = "sender_id"
        case content
        case readAt = "read_at"
        case createdAt = "created_at"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Message, rhs: Message) -> Bool {
        lhs.id == rhs.id
    }
}

// For sending new messages
struct NewMessage: Encodable, Sendable {
    let conversationId: UUID
    let senderId: UUID
    let content: String
    
    enum CodingKeys: String, CodingKey {
        case conversationId = "conversation_id"
        case senderId = "sender_id"
        case content
    }
}

