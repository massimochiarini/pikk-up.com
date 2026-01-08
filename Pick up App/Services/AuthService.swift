//
//  AuthService.swift
//  Sports App 1
//

import Foundation
import Combine
import Supabase

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var currentUser: Supabase.User?
    @Published var currentProfile: Profile?
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var hasCompletedOnboarding = false
    @Published var hasSeenWelcome = false
    
    private let supabase = SupabaseManager.shared.client
    
    init() {
        // Check if welcome has been seen before
        hasSeenWelcome = UserDefaults.standard.bool(forKey: "hasSeenWelcome")
        
        Task {
            await checkSession()
        }
    }
    
    func checkSession() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let session = try await supabase.auth.session
            currentUser = session.user
            isAuthenticated = true
            await fetchProfile()
            
            // Check onboarding status - prefer database flag, fallback to UserDefaults
            if let profile = currentProfile, let dbOnboarding = profile.onboardingCompleted {
                hasCompletedOnboarding = dbOnboarding
            } else {
                hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding_\(session.user.id)")
            }
        } catch {
            currentUser = nil
            isAuthenticated = false
        }
    }
    
    func markWelcomeSeen() {
        UserDefaults.standard.set(true, forKey: "hasSeenWelcome")
        hasSeenWelcome = true
    }
    
    func signUp(email: String, password: String, firstName: String, lastName: String) async throws {
        let response = try await supabase.auth.signUp(
            email: email,
            password: password,
            data: [
                "first_name": .string(firstName),
                "last_name": .string(lastName)
            ]
        )
        
        currentUser = response.user
        isAuthenticated = true
        hasCompletedOnboarding = false
        await fetchProfile()
        
        // Register any pending device token for push notifications
        await registerPendingDeviceToken()
    }
    
    func signIn(email: String, password: String) async throws {
        let response = try await supabase.auth.signIn(
            email: email,
            password: password
        )
        
        currentUser = response.user
        isAuthenticated = true
        
        await fetchProfile()
        
        // Check onboarding status - prefer database flag
        if let profile = currentProfile, let dbOnboarding = profile.onboardingCompleted {
            hasCompletedOnboarding = dbOnboarding
        } else {
            hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding_\(response.user.id)")
        }
        
        // Register any pending device token for push notifications
        await registerPendingDeviceToken()
    }
    
    func signOut() async throws {
        // Unregister device token before signing out
        if let userId = currentUser?.id {
            await NotificationService.shared.unregisterDeviceToken(userId: userId)
        }
        
        try await supabase.auth.signOut()
        currentUser = nil
        currentProfile = nil
        isAuthenticated = false
        hasCompletedOnboarding = false
    }
    
    func deleteAccount() async throws {
        guard let userId = currentUser?.id else {
            throw NSError(domain: "AuthService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No user logged in"])
        }
        
        // Unregister device token before deleting account
        await NotificationService.shared.unregisterDeviceToken(userId: userId)
        
        // Delete the user account from Supabase Auth
        // This will cascade delete all related data (profiles, posts, messages, etc.)
        // due to ON DELETE CASCADE constraints in the database schema
        try await supabase.rpc("delete_user").execute()
        
        // Clear UserDefaults
        UserDefaults.standard.removeObject(forKey: "hasCompletedOnboarding_\(userId)")
        UserDefaults.standard.removeObject(forKey: "pendingDeviceToken")
        
        // Clear local state
        currentUser = nil
        currentProfile = nil
        isAuthenticated = false
        hasCompletedOnboarding = false
    }
    
    func completeOnboarding() {
        guard let userId = currentUser?.id else { return }
        
        // Store in UserDefaults as backup
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding_\(userId)")
        hasCompletedOnboarding = true
        
        // Database flag is updated in OnboardingView when profile is saved
        
        // Refresh profile
        Task {
            await fetchProfile()
        }
    }
    
    func fetchProfile() async {
        guard let userId = currentUser?.id else { return }
        
        do {
            let profile: Profile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: userId.uuidString)
                .single()
                .execute()
                .value
            
            currentProfile = profile
            
            // Sync onboarding status from database
            if let dbOnboarding = profile.onboardingCompleted {
                hasCompletedOnboarding = dbOnboarding
            }
        } catch {
            print("Error fetching profile: \(error)")
        }
    }
    
    func refreshProfile() async {
        await fetchProfile()
    }
    
    // MARK: - Profile helpers
    
    var userFirstName: String {
        currentProfile?.firstName ?? currentUser?.userMetadata["first_name"]?.stringValue ?? ""
    }
    
    var userLastName: String {
        currentProfile?.lastName ?? currentUser?.userMetadata["last_name"]?.stringValue ?? ""
    }
    
    var userDisplayName: String {
        currentProfile?.fullName ?? currentUser?.email ?? "User"
    }
    
    var userInitials: String {
        currentProfile?.initials ?? "?"
    }
    
    var userAvatarUrl: String? {
        currentProfile?.avatarUrl
    }
    
    var userUsername: String? {
        currentProfile?.username
    }
    
    // MARK: - Push Notifications
    
    /// Register any pending device token that was received before user logged in
    private func registerPendingDeviceToken() async {
        guard let userId = currentUser?.id,
              let pendingToken = UserDefaults.standard.string(forKey: "pendingDeviceToken") else {
            return
        }
        
        // Convert token string back to Data
        var tokenData = Data()
        var temp = pendingToken
        while temp.count > 0 {
            let startIndex = temp.startIndex
            let endIndex = temp.index(startIndex, offsetBy: 2)
            if let byte = UInt8(temp[startIndex..<endIndex], radix: 16) {
                tokenData.append(byte)
            }
            temp = String(temp[endIndex...])
        }
        
        await NotificationService.shared.registerDeviceToken(tokenData, userId: userId)
        
        // Clear pending token
        UserDefaults.standard.removeObject(forKey: "pendingDeviceToken")
    }
}
