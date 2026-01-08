//
//  Profile.swift
//  Sports App 1
//

import Foundation

struct Profile: Codable, Identifiable, Sendable, Hashable {
    let id: UUID
    let firstName: String
    let lastName: String
    var username: String?
    var bio: String?
    var avatarUrl: String?
    var favoriteSports: [String]?
    var locationLat: Double?
    var locationLng: Double?
    var visibilityRadiusMiles: Int?
    var onboardingCompleted: Bool?
    var sportPreference: String?
    let createdAt: Date
    
    var fullName: String {
        "\(firstName) \(lastName)"
    }
    
    var displayName: String {
        if let username = username, !username.isEmpty {
            return "@\(username)"
        }
        return fullName
    }
    
    var initials: String {
        let firstInitial = firstName.prefix(1).uppercased()
        let lastInitial = lastName.prefix(1).uppercased()
        return "\(firstInitial)\(lastInitial)"
    }
    
    var sports: [Sport] {
        guard let sportStrings = favoriteSports else { return [] }
        return sportStrings.compactMap { Sport(rawValue: $0) }
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        case lastName = "last_name"
        case username
        case bio
        case avatarUrl = "avatar_url"
        case favoriteSports = "favorite_sports"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case visibilityRadiusMiles = "visibility_radius_miles"
        case onboardingCompleted = "onboarding_completed"
        case sportPreference = "sport_preference"
        case createdAt = "created_at"
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Profile, rhs: Profile) -> Bool {
        lhs.id == rhs.id
    }
}

// For updating profile
struct ProfileUpdate: Encodable, Sendable {
    var username: String?
    var bio: String?
    var avatarUrl: String?
    var favoriteSports: [String]?
    var locationLat: Double?
    var locationLng: Double?
    var visibilityRadiusMiles: Int?
    var onboardingCompleted: Bool?
    var sportPreference: String?
    
    enum CodingKeys: String, CodingKey {
        case username
        case bio
        case avatarUrl = "avatar_url"
        case favoriteSports = "favorite_sports"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case visibilityRadiusMiles = "visibility_radius_miles"
        case onboardingCompleted = "onboarding_completed"
        case sportPreference = "sport_preference"
    }
}

// For updating profile including name fields (used during onboarding)
struct ProfileUpdateWithName: Encodable, Sendable {
    var firstName: String?
    var lastName: String?
    var username: String?
    var bio: String?
    var avatarUrl: String?
    var favoriteSports: [String]?
    var locationLat: Double?
    var locationLng: Double?
    var visibilityRadiusMiles: Int?
    var onboardingCompleted: Bool?
    var sportPreference: String?
    
    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case username
        case bio
        case avatarUrl = "avatar_url"
        case favoriteSports = "favorite_sports"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case visibilityRadiusMiles = "visibility_radius_miles"
        case onboardingCompleted = "onboarding_completed"
        case sportPreference = "sport_preference"
    }
    
    // Custom encoding to skip nil values entirely
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        if let firstName = firstName { try container.encode(firstName, forKey: .firstName) }
        if let lastName = lastName { try container.encode(lastName, forKey: .lastName) }
        if let username = username { try container.encode(username, forKey: .username) }
        if let bio = bio { try container.encode(bio, forKey: .bio) }
        if let avatarUrl = avatarUrl { try container.encode(avatarUrl, forKey: .avatarUrl) }
        if let favoriteSports = favoriteSports { try container.encode(favoriteSports, forKey: .favoriteSports) }
        if let locationLat = locationLat { try container.encode(locationLat, forKey: .locationLat) }
        if let locationLng = locationLng { try container.encode(locationLng, forKey: .locationLng) }
        if let visibilityRadiusMiles = visibilityRadiusMiles { try container.encode(visibilityRadiusMiles, forKey: .visibilityRadiusMiles) }
        if let onboardingCompleted = onboardingCompleted { try container.encode(onboardingCompleted, forKey: .onboardingCompleted) }
        if let sportPreference = sportPreference { try container.encode(sportPreference, forKey: .sportPreference) }
    }
}

// For upserting profile (includes required fields for insert)
struct ProfileUpsert: Encodable, Sendable {
    let id: UUID
    let firstName: String
    let lastName: String
    var username: String?
    var bio: String?
    var avatarUrl: String?
    var favoriteSports: [String]?
    var locationLat: Double?
    var locationLng: Double?
    var visibilityRadiusMiles: Int?
    var onboardingCompleted: Bool?
    var sportPreference: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        case lastName = "last_name"
        case username
        case bio
        case avatarUrl = "avatar_url"
        case favoriteSports = "favorite_sports"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case visibilityRadiusMiles = "visibility_radius_miles"
        case onboardingCompleted = "onboarding_completed"
        case sportPreference = "sport_preference"
    }
}
