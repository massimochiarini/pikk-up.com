//
//  Post.swift
//  Sports App 1
//

import Foundation

struct Post: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let userId: UUID
    let sport: String
    let headline: String
    let timeWindow: String?
    let expiresAt: Date?
    let isActive: Bool
    let locationLat: Double?
    let locationLng: Double?
    let createdAt: Date
    
    var sportType: Sport {
        Sport(rawValue: sport) ?? .other
    }
    
    var isExpired: Bool {
        if let expiresAt = expiresAt {
            return expiresAt < Date()
        }
        return false
    }
    
    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: createdAt, relativeTo: Date())
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case sport
        case headline
        case timeWindow = "time_window"
        case expiresAt = "expires_at"
        case isActive = "is_active"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case createdAt = "created_at"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Post, rhs: Post) -> Bool {
        lhs.id == rhs.id
    }
}

// For creating new posts
struct NewPost: Encodable, Sendable {
    let userId: UUID
    let sport: String
    let headline: String
    let timeWindow: String?
    let expiresAt: Date?
    let locationLat: Double?
    let locationLng: Double?
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case sport
        case headline
        case timeWindow = "time_window"
        case expiresAt = "expires_at"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
    }
}

// Post with embedded profile for feed display
struct PostWithProfile: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let userId: UUID
    let sport: String
    let headline: String
    let timeWindow: String?
    let expiresAt: Date?
    let isActive: Bool
    let locationLat: Double?
    let locationLng: Double?
    let createdAt: Date
    let profiles: Profile?
    
    var sportType: Sport {
        Sport(rawValue: sport) ?? .other
    }
    
    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: createdAt, relativeTo: Date())
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case sport
        case headline
        case timeWindow = "time_window"
        case expiresAt = "expires_at"
        case isActive = "is_active"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case createdAt = "created_at"
        case profiles
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: PostWithProfile, rhs: PostWithProfile) -> Bool {
        lhs.id == rhs.id
    }
}

