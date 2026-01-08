//
//  ProfileService.swift
//  Sports App 1
//

import Foundation
import Combine
import Supabase
import UIKit

@MainActor
class ProfileService: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseManager.shared.client
    
    // MARK: - Fetch Profile
    
    func fetchProfile(userId: UUID) async throws -> Profile {
        let profile: Profile = try await supabase
            .from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
            .value
        
        return profile
    }
    
    /// Fetches profile, returns nil if not found instead of throwing
    func fetchProfileIfExists(userId: UUID) async -> Profile? {
        do {
            let profiles: [Profile] = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: userId.uuidString)
                .limit(1)
                .execute()
                .value
            return profiles.first
        } catch {
            return nil
        }
    }
    
    func fetchProfiles(userIds: [UUID]) async throws -> [Profile] {
        let uuidStrings = userIds.map { $0.uuidString }
        
        let profiles: [Profile] = try await supabase
            .from("profiles")
            .select()
            .in("id", values: uuidStrings)
            .execute()
            .value
        
        return profiles
    }
    
    // MARK: - Ensure Profile Exists
    
    /// Ensures the profile exists for the user, creating it if needed using an RPC function
    func ensureProfileExists(userId: UUID, firstName: String, lastName: String) async throws {
        // Call the RPC function that handles profile creation with SECURITY DEFINER
        try await supabase.rpc(
            "ensure_profile_exists",
            params: [
                "p_user_id": userId.uuidString,
                "p_first_name": firstName,
                "p_last_name": lastName
            ]
        ).execute()
    }
    
    // MARK: - Update Profile
    
    func updateProfile(userId: UUID, updates: ProfileUpdate, firstName: String = "", lastName: String = "") async throws {
        isLoading = true
        errorMessage = nil
        
        defer { isLoading = false }
        
        // First, ensure the profile exists (handles case where trigger didn't run)
        try await ensureProfileExists(
            userId: userId,
            firstName: firstName.isEmpty ? "User" : firstName,
            lastName: lastName.isEmpty ? "" : lastName
        )
        
        // Build update data including name fields if provided
        let updateData = ProfileUpdateWithName(
            firstName: firstName.isEmpty ? nil : firstName,
            lastName: lastName.isEmpty ? nil : lastName,
            username: updates.username,
            bio: updates.bio,
            avatarUrl: updates.avatarUrl,
            favoriteSports: updates.favoriteSports,
            locationLat: updates.locationLat,
            locationLng: updates.locationLng,
            visibilityRadiusMiles: updates.visibilityRadiusMiles,
            onboardingCompleted: updates.onboardingCompleted,
            sportPreference: updates.sportPreference
        )
        
        print("📝 [ProfileService] Updating profile with sport preference: \(updates.sportPreference ?? "nil")")
        
        // Now safely update the profile
        try await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", value: userId.uuidString)
            .execute()
        
        print("✅ [ProfileService] Profile updated successfully")
    }
    
    // MARK: - Username Validation
    
    func checkUsernameAvailable(username: String, excludingUserId: UUID? = nil) async throws -> Bool {
        var query = supabase
            .from("profiles")
            .select("id", head: true, count: .exact)
            .eq("username", value: username.lowercased())
        
        if let excludeId = excludingUserId {
            query = query.neq("id", value: excludeId.uuidString)
        }
        
        let response = try await query.execute()
        
        return response.count == 0
    }
    
    func validateUsername(_ username: String) -> (isValid: Bool, message: String?) {
        // Check length
        guard username.count >= 3 else {
            return (false, "Username must be at least 3 characters")
        }
        
        guard username.count <= 20 else {
            return (false, "Username must be 20 characters or less")
        }
        
        // Check for valid characters (letters, numbers, underscores)
        let allowedCharacters = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "_"))
        guard username.unicodeScalars.allSatisfy({ allowedCharacters.contains($0) }) else {
            return (false, "Username can only contain letters, numbers, and underscores")
        }
        
        // Check doesn't start with number
        guard !username.first!.isNumber else {
            return (false, "Username cannot start with a number")
        }
        
        return (true, nil)
    }
    
    // MARK: - Avatar Upload
    
    func uploadAvatar(userId: UUID, image: UIImage) async throws -> String {
        isLoading = true
        errorMessage = nil
        
        defer { isLoading = false }
        
        // Compress and resize image
        let maxSize: CGFloat = 500
        let resizedImage = resizeImage(image, maxSize: maxSize)
        
        guard let imageData = resizedImage.jpegData(compressionQuality: 0.8) else {
            throw ProfileError.imageProcessingFailed
        }
        
        // Use lowercase UUID to match Postgres auth.uid()::text format for RLS policies
        let fileName = "\(userId.uuidString.lowercased())/avatar.jpg"
        
        // Upload to Supabase Storage
        try await supabase.storage
            .from("avatars")
            .upload(
                path: fileName,
                file: imageData,
                options: FileOptions(
                    contentType: "image/jpeg",
                    upsert: true
                )
            )
        
        // Get public URL with cache-busting timestamp
        let publicURL = try supabase.storage
            .from("avatars")
            .getPublicURL(path: fileName)
        
        // Add cache-busting query parameter to prevent stale cached images
        let timestamp = Int(Date().timeIntervalSince1970)
        let cacheBustedURLString = "\(publicURL.absoluteString)?t=\(timestamp)"
        
        // Update profile with avatar URL using direct update (not upsert)
        try await updateAvatarUrl(userId: userId, avatarUrl: cacheBustedURLString)
        
        return cacheBustedURLString
    }
    
    /// Updates only the avatar URL without affecting other profile fields
    func updateAvatarUrl(userId: UUID, avatarUrl: String?) async throws {
        struct AvatarUpdate: Encodable {
            let avatar_url: String?
        }
        
        try await supabase
            .from("profiles")
            .update(AvatarUpdate(avatar_url: avatarUrl))
            .eq("id", value: userId.uuidString)
            .execute()
    }
    
    func deleteAvatar(userId: UUID) async throws {
        // Use lowercase UUID to match storage path format
        let fileName = "\(userId.uuidString.lowercased())/avatar.jpg"
        
        try await supabase.storage
            .from("avatars")
            .remove(paths: [fileName])
        
        // Use direct update to only clear avatar URL
        try await updateAvatarUrl(userId: userId, avatarUrl: nil)
    }
    
    // MARK: - Search Users
    
    func searchUsers(query: String, excludingUserId: UUID? = nil) async throws -> [Profile] {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }
        
        let searchTerm = query.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Search by username (case-insensitive partial match) or by name
        var profiles: [Profile] = try await supabase
            .from("profiles")
            .select()
            .or("username.ilike.%\(searchTerm)%,first_name.ilike.%\(searchTerm)%,last_name.ilike.%\(searchTerm)%")
            .limit(20)
            .execute()
            .value
        
        // Exclude current user from results
        if let excludeId = excludingUserId {
            profiles = profiles.filter { $0.id != excludeId }
        }
        
        return profiles
    }
    
    // MARK: - Profile Stats
    
    func fetchProfileStats(userId: UUID) async throws -> ProfileStats {
        // Count games joined
        let rsvps: [RSVP] = try await supabase
            .from("rsvps")
            .select()
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        // Count games created
        let gamesCreated: [Game] = try await supabase
            .from("games")
            .select()
            .eq("created_by", value: userId.uuidString)
            .execute()
            .value
        
        // Count connections
        let connections: [Connection] = try await supabase
            .from("connections")
            .select()
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        // Get unique sports from joined games
        let profile = try await fetchProfile(userId: userId)
        let sportsCount = profile.favoriteSports?.count ?? 0
        
        return ProfileStats(
            gamesPlayed: rsvps.count,
            gamesCreated: gamesCreated.count,
            sportsCount: sportsCount,
            connectionsCount: connections.count
        )
    }
    
    // MARK: - Helper Methods
    
    private func resizeImage(_ image: UIImage, maxSize: CGFloat) -> UIImage {
        let size = image.size
        
        guard size.width > maxSize || size.height > maxSize else {
            return image
        }
        
        let ratio = min(maxSize / size.width, maxSize / size.height)
        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}

// MARK: - Supporting Types

struct ProfileStats {
    let gamesPlayed: Int
    let gamesCreated: Int
    let sportsCount: Int
    let connectionsCount: Int
}

enum ProfileError: LocalizedError {
    case imageProcessingFailed
    case uploadFailed
    case profileNotFound
    
    var errorDescription: String? {
        switch self {
        case .imageProcessingFailed:
            return "Failed to process image"
        case .uploadFailed:
            return "Failed to upload avatar"
        case .profileNotFound:
            return "Profile not found"
        }
    }
}

