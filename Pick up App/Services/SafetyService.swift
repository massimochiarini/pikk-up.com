//
//  SafetyService.swift
//  Sports App 1
//
//  User Safety & Moderation Service
//  Handles blocking, reporting, and content moderation

import Foundation
import Supabase
import Combine

@MainActor
class SafetyService: ObservableObject {
    private let supabase = SupabaseManager.shared.client
    
    @Published var blockedUserIds: Set<UUID> = []
    @Published var isLoading = false
    
    // MARK: - Block User
    
    /// Block a user (prevents seeing their content and receiving messages)
    func blockUser(userId: UUID, blockedUserId: UUID) async throws {
        struct BlockInsert: Encodable {
            let user_id: String
            let blocked_user_id: String
        }
        
        let blockData = BlockInsert(
            user_id: userId.uuidString,
            blocked_user_id: blockedUserId.uuidString
        )
        
        do {
            try await supabase
                .from("blocked_users")
                .insert(blockData)
                .execute()
            
            blockedUserIds.insert(blockedUserId)
            print("✅ User blocked successfully")
        } catch {
            print("❌ Block user error: \(error)")
            throw NSError(domain: "SafetyService", code: -1, 
                         userInfo: [NSLocalizedDescriptionKey: "Failed to block user. Please try again."])
        }
    }
    
    /// Unblock a user
    func unblockUser(userId: UUID, blockedUserId: UUID) async throws {
        do {
            try await supabase
                .from("blocked_users")
                .delete()
                .eq("user_id", value: userId.uuidString)
                .eq("blocked_user_id", value: blockedUserId.uuidString)
                .execute()
            
            blockedUserIds.remove(blockedUserId)
        } catch {
            throw NSError(domain: "SafetyService", code: -1,
                         userInfo: [NSLocalizedDescriptionKey: "Failed to unblock user: \(error.localizedDescription)"])
        }
    }
    
    /// Check if a user is blocked
    func isUserBlocked(_ userId: UUID) -> Bool {
        return blockedUserIds.contains(userId)
    }
    
    /// Fetch all blocked users for current user
    func fetchBlockedUsers(userId: UUID) async throws {
        struct BlockedUser: Decodable {
            let blocked_user_id: String
        }
        
        do {
            let response: [BlockedUser] = try await supabase
                .from("blocked_users")
                .select("blocked_user_id")
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            
            blockedUserIds = Set(response.compactMap { UUID(uuidString: $0.blocked_user_id) })
        } catch {
            print("Error fetching blocked users: \(error)")
        }
    }
    
    // MARK: - Report Content
    
    enum ReportType: String, Codable, CaseIterable {
        case harassment = "harassment"
        case spam = "spam"
        case inappropriate = "inappropriate"
        case fake = "fake_profile"
        case safety = "safety_concern"
        case other = "other"
        
        var displayName: String {
            switch self {
            case .harassment: return "Harassment or bullying"
            case .spam: return "Spam or scam"
            case .inappropriate: return "Inappropriate content"
            case .fake: return "Fake profile"
            case .safety: return "Safety concern"
            case .other: return "Other"
            }
        }
    }
    
    enum ReportableContentType: String, Codable {
        case user = "user"
        case message = "message"
        case game = "game"
        case post = "post"
    }
    
    /// Report a user or content
    func reportContent(
        reporterId: UUID,
        contentType: ReportableContentType,
        contentId: UUID,
        reportType: ReportType,
        description: String?
    ) async throws {
        struct ReportInsert: Encodable {
            let reporter_id: String
            let content_type: String
            let content_id: String
            let report_type: String
            let description: String?
        }
        
        let report = ReportInsert(
            reporter_id: reporterId.uuidString,
            content_type: contentType.rawValue,
            content_id: contentId.uuidString,
            report_type: reportType.rawValue,
            description: description
        )
        
        do {
            try await supabase
                .from("reports")
                .insert(report)
                .execute()
            
            print("✅ Report submitted successfully")
        } catch {
            print("❌ Report submission error: \(error)")
            throw NSError(domain: "SafetyService", code: -1,
                         userInfo: [NSLocalizedDescriptionKey: "Failed to submit report. Please try again."])
        }
    }
}

