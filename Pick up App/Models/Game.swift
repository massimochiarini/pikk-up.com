//
//  Game.swift
//  Pick Up Yoga
//
//  Renamed from Game to support yoga class sessions
//  All references to "game" maintained for database compatibility
//

import Foundation
import SwiftUI

// Class level enum for yoga sessions
enum SkillLevel: String, Codable, CaseIterable, Sendable {
    case beginner = "beginner"
    case intermediate = "intermediate"
    case advanced = "advanced"
    
    var displayName: String {
        switch self {
        case .beginner: return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced: return "Advanced"
        }
    }
    
    var shortName: String {
        switch self {
        case .beginner: return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced: return "Advanced"
        }
    }
    
    var color: Color {
        switch self {
        case .beginner: return Color(hex: "22C55E") // Green
        case .intermediate: return Color(hex: "F59E0B") // Amber/Orange
        case .advanced: return Color(hex: "EF4444") // Red
        }
    }
    
    var icon: String {
        switch self {
        case .beginner: return "leaf.fill"
        case .intermediate: return "flame.fill"
        case .advanced: return "bolt.fill"
        }
    }
}

struct Game: Codable, Identifiable, Hashable, Sendable {
    
    static func == (lhs: Game, rhs: Game) -> Bool {
        lhs.id == rhs.id && lhs.rsvpCount == rhs.rsvpCount
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    let id: UUID
    let createdBy: UUID
    let instructorId: UUID? // Set when created via web app by an instructor
    let sport: String // Always "yoga" for this app
    let venueName: String // Studio name
    let address: String // Studio address
    let gameDate: Date // Class date
    let startTime: String // Class start time
    let maxPlayers: Int // Max participants for the class
    let costCents: Int // Class cost
    let description: String? // Class description
    let imageUrl: String? // Class or instructor image
    let isPrivate: Bool // Private class
    let skillLevel: SkillLevel? // Class level
    let customTitle: String? // Custom class title (e.g., "Vinyasa Flow", "Hot Yoga")
    let latitude: Double?
    let longitude: Double?
    let createdAt: Date
    
    // Computed property for RSVP count (participants)
    var rsvpCount: Int = 0
    
    // Distance from user (populated by geocoding)
    var distanceFromUser: Double? // Distance in miles from user's location
    
    var isFree: Bool {
        costCents == 0
    }
    
    /// Returns true if this class was created via the web app (by an instructor)
    /// Web-managed classes should not be editable from mobile
    var isWebManaged: Bool {
        instructorId != nil
    }
    
    var costDisplay: String {
        if isFree {
            return "Free"
        } else {
            let dollars = Double(costCents) / 100.0
            return String(format: "$%.0f", dollars)
        }
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"
        return formatter.string(from: gameDate)
    }
    
    var formattedTime: String {
        // startTime comes as "HH:mm:ss" from Supabase
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "HH:mm:ss"
        
        let outputFormatter = DateFormatter()
        outputFormatter.dateFormat = "h:mm a"
        
        if let date = inputFormatter.date(from: startTime) {
            return outputFormatter.string(from: date)
        }
        return startTime
    }
    
    var shortAddress: String {
        // Extract city from full address (e.g., "1200 Meridian Ave, Miami Beach, FL" -> "Miami Beach")
        let components = address.components(separatedBy: ", ")
        if components.count >= 2 {
            return components[1]
        }
        return address
    }
    
    /// Returns true if the class has already started (date + start time is in the past)
    var hasPassed: Bool {
        // Parse start time (format: "HH:mm:ss")
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm:ss"
        
        guard let timeDate = timeFormatter.date(from: startTime) else {
            return false
        }
        
        // Get the time components from the parsed time
        let calendar = Calendar.current
        let timeComponents = calendar.dateComponents([.hour, .minute, .second], from: timeDate)
        
        // Combine class date with start time
        var gameDateComponents = calendar.dateComponents([.year, .month, .day], from: gameDate)
        gameDateComponents.hour = timeComponents.hour
        gameDateComponents.minute = timeComponents.minute
        gameDateComponents.second = timeComponents.second
        
        guard let gameDateTime = calendar.date(from: gameDateComponents) else {
            return false
        }
        
        // Compare to current time
        return gameDateTime < Date()
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdBy = "created_by"
        case instructorId = "instructor_id"
        case sport
        case venueName = "venue_name"
        case address
        case gameDate = "game_date"
        case startTime = "start_time"
        case maxPlayers = "max_players"
        case costCents = "cost_cents"
        case description
        case imageUrl = "image_url"
        case isPrivate = "is_private"
        case skillLevel = "skill_level"
        case customTitle = "custom_title"
        case latitude
        case longitude
        case createdAt = "created_at"
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        createdBy = try container.decode(UUID.self, forKey: .createdBy)
        instructorId = try container.decodeIfPresent(UUID.self, forKey: .instructorId)
        sport = try container.decodeIfPresent(String.self, forKey: .sport) ?? "yoga" // Default to yoga
        venueName = try container.decode(String.self, forKey: .venueName)
        address = try container.decode(String.self, forKey: .address)
        
        // Handle date string
        let dateString = try container.decode(String.self, forKey: .gameDate)
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        gameDate = dateFormatter.date(from: dateString) ?? Date()
        
        startTime = try container.decode(String.self, forKey: .startTime)
        maxPlayers = try container.decode(Int.self, forKey: .maxPlayers)
        costCents = try container.decode(Int.self, forKey: .costCents)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        imageUrl = try container.decodeIfPresent(String.self, forKey: .imageUrl)
        isPrivate = try container.decodeIfPresent(Bool.self, forKey: .isPrivate) ?? false
        skillLevel = try container.decodeIfPresent(SkillLevel.self, forKey: .skillLevel)
        customTitle = try container.decodeIfPresent(String.self, forKey: .customTitle)
        latitude = try container.decodeIfPresent(Double.self, forKey: .latitude)
        longitude = try container.decodeIfPresent(Double.self, forKey: .longitude)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(createdBy, forKey: .createdBy)
        try container.encodeIfPresent(instructorId, forKey: .instructorId)
        try container.encode(sport, forKey: .sport)
        try container.encode(venueName, forKey: .venueName)
        try container.encode(address, forKey: .address)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        try container.encode(dateFormatter.string(from: gameDate), forKey: .gameDate)
        
        try container.encode(startTime, forKey: .startTime)
        try container.encode(maxPlayers, forKey: .maxPlayers)
        try container.encode(costCents, forKey: .costCents)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encodeIfPresent(imageUrl, forKey: .imageUrl)
        try container.encode(isPrivate, forKey: .isPrivate)
        try container.encodeIfPresent(skillLevel, forKey: .skillLevel)
        try container.encodeIfPresent(customTitle, forKey: .customTitle)
        try container.encodeIfPresent(latitude, forKey: .latitude)
        try container.encodeIfPresent(longitude, forKey: .longitude)
        try container.encode(createdAt, forKey: .createdAt)
    }
}

// For creating new classes (instructors only via web)
struct NewGame: Encodable, Sendable {
    let createdBy: UUID
    let sport: String  // Always "yoga"
    let venueName: String
    let address: String
    let gameDate: String
    let startTime: String
    let maxPlayers: Int
    let costCents: Int
    let description: String?
    let imageUrl: String?
    let isPrivate: Bool
    let skillLevel: SkillLevel?
    let customTitle: String?
    let latitude: Double?
    let longitude: Double?
    
    enum CodingKeys: String, CodingKey {
        case createdBy = "created_by"
        case sport
        case venueName = "venue_name"
        case address
        case gameDate = "game_date"
        case startTime = "start_time"
        case maxPlayers = "max_players"
        case costCents = "cost_cents"
        case description
        case imageUrl = "image_url"
        case isPrivate = "is_private"
        case skillLevel = "skill_level"
        case customTitle = "custom_title"
        case latitude
        case longitude
    }
}

// For updating existing classes (instructors only via web)
struct GameUpdate: Encodable, Sendable {
    var venueName: String?
    var address: String?
    var gameDate: String?
    var startTime: String?
    var maxPlayers: Int?
    var costCents: Int?
    var description: String?
    var isPrivate: Bool?
    var skillLevel: SkillLevel?
    var customTitle: String?
    var imageUrl: String?
    var latitude: Double?
    var longitude: Double?
    
    enum CodingKeys: String, CodingKey {
        case venueName = "venue_name"
        case address
        case gameDate = "game_date"
        case startTime = "start_time"
        case maxPlayers = "max_players"
        case costCents = "cost_cents"
        case description
        case isPrivate = "is_private"
        case skillLevel = "skill_level"
        case customTitle = "custom_title"
        case imageUrl = "image_url"
        case latitude
        case longitude
    }
}

