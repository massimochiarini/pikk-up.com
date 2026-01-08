//
//  Connection.swift
//  Sports App 1
//

import Foundation

enum ConnectionType: String, Codable, Sendable {
    case playedTogether = "played_together"
    case friend = "friend"
    case messaged = "messaged"
    
    var displayText: String {
        switch self {
        case .playedTogether: return "Played together"
        case .friend: return "Friend"
        case .messaged: return "Messaged"
        }
    }
    
    var icon: String {
        switch self {
        case .playedTogether: return "figure.2.arms.open"
        case .friend: return "person.2.fill"
        case .messaged: return "message.fill"
        }
    }
}

struct Connection: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let userId: UUID
    let connectedUserId: UUID
    let connectionType: String
    let createdAt: Date
    
    var type: ConnectionType? {
        ConnectionType(rawValue: connectionType)
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case connectedUserId = "connected_user_id"
        case connectionType = "connection_type"
        case createdAt = "created_at"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Connection, rhs: Connection) -> Bool {
        lhs.id == rhs.id
    }
}

// For creating new connections
struct NewConnection: Encodable, Sendable {
    let userId: UUID
    let connectedUserId: UUID
    let connectionType: String
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case connectedUserId = "connected_user_id"
        case connectionType = "connection_type"
    }
}

// Connection with profile data
struct ConnectionWithProfile: Identifiable, Sendable, Hashable {
    let connection: Connection
    let profile: Profile
    
    var id: UUID { connection.id }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: ConnectionWithProfile, rhs: ConnectionWithProfile) -> Bool {
        lhs.id == rhs.id
    }
}

