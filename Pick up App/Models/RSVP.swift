//
//  RSVP.swift
//  PickleballApp
//

import Foundation

struct RSVP: Codable, Identifiable, Sendable {
    let id: UUID
    let gameId: UUID
    let userId: UUID?  // ✨ FIXED: Now optional to support guest RSVPs
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case gameId = "game_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}

struct NewRSVP: Encodable, Sendable {
    let gameId: UUID
    let userId: UUID?  // ✨ FIXED: Now optional to support guest RSVPs
    
    enum CodingKeys: String, CodingKey {
        case gameId = "game_id"
        case userId = "user_id"
    }
}

// For fetching RSVPs with profile info
struct RSVPWithProfile: Codable, Identifiable, Sendable {
    let id: UUID
    let gameId: UUID
    let userId: UUID?  // ✨ FIXED: Now optional to support guest RSVPs
    let createdAt: Date
    let profiles: Profile?
    
    enum CodingKeys: String, CodingKey {
        case id
        case gameId = "game_id"
        case userId = "user_id"
        case createdAt = "created_at"
        case profiles
    }
}

