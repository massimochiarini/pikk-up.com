//
//  ProfileView.swift
//  Sports App 1
//

import SwiftUI
import Auth
import Supabase

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    
    @State private var pastSessions: [Game] = []
    @State private var showEditProfile = false
    @State private var showSettings = false
    
    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Profile header
                    profileHeader
                    
                    // Action buttons
                    actionButtons
                        .padding(.top, 20)
                        .padding(.horizontal, 24)
                    
                    // Past Sessions
                    pastSessionsSection
                        .padding(.top, 32)
                    
                    Spacer(minLength: 100)
                }
            }
            .background(AppTheme.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showSettings = true }) {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
                    .environmentObject(authService)
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
                    .environmentObject(authService)
                    .environmentObject(NotificationService.shared)
            }
        }
        .task {
            await loadProfileData()
        }
    }
    
    // MARK: - Profile Header
    
    private var profileHeader: some View {
        VStack(spacing: 16) {
            // Avatar
            AvatarView(
                url: authService.currentProfile?.avatarUrl,
                initials: authService.currentProfile?.initials ?? "?",
                size: 100,
                borderColor: AppTheme.neonGreen,
                borderWidth: 3,
                showBorder: true
            )
            
            // Name and username
            VStack(spacing: 4) {
                Text(authService.currentProfile?.fullName ?? "")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                
                if let username = authService.currentProfile?.username {
                    Text("@\(username)")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
            
            // Bio
            if let bio = authService.currentProfile?.bio, !bio.isEmpty {
                Text(bio)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundColor(AppTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            // Sports badges
            if let sports = authService.currentProfile?.sports, !sports.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(sports) { sport in
                            SportBadge(sport: sport, style: .subtle)
                        }
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
        .padding(.top, 20)
    }
    
    // MARK: - Action Buttons
    
    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button(action: { showEditProfile = true }) {
                Text("Edit Profile")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(AppTheme.onPrimary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(AppTheme.neonGreen)
                    .cornerRadius(AppTheme.cornerRadiusMedium)
                    .shadow(color: AppTheme.neonGlow, radius: 4, x: 0, y: 2)
            }
            
            Button(action: shareProfile) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                    .frame(width: 44, height: 44)
                    .background(AppTheme.divider)
                    .cornerRadius(AppTheme.cornerRadiusMedium)
            }
        }
    }
    
    // MARK: - Past Sessions
    
    private var pastSessionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Past Sessions")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(AppTheme.textPrimary)
                .padding(.horizontal, 24)
            
            if pastSessions.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "calendar.badge.clock")
                        .font(.system(size: 48))
                        .foregroundColor(AppTheme.textTertiary)
                    
                    Text("No past sessions yet")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                    
                    Text("Classes you attend will appear here")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(AppTheme.textTertiary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                VStack(spacing: 12) {
                    ForEach(pastSessions) { session in
                        GameCardCompact(
                            game: session,
                            onTap: {},
                            isJoined: true
                        )
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }
    
    // MARK: - Actions
    
    private func loadProfileData() async {
        guard let userId = authService.currentUser?.id else { return }
        
        // Load past sessions (games user attended via RSVP)
        await fetchPastSessions(userId: userId)
    }
    
    private func fetchPastSessions(userId: UUID) async {
        do {
            let supabase = SupabaseManager.shared.client
            
            // Get all RSVPs for this user
            let rsvps: [RSVP] = try await supabase
                .from("rsvps")
                .select()
                .eq("user_id", value: userId)
                .execute()
                .value
            
            let gameIds = rsvps.map { $0.gameId }
            
            if !gameIds.isEmpty {
                // Fetch all games user has RSVPed to
                let allGames: [Game] = try await supabase
                    .from("games")
                    .select()
                    .in("id", values: gameIds)
                    .order("game_date", ascending: false)
                    .order("start_time", ascending: false)
                    .execute()
                    .value
                
                // Filter to only past sessions
                let now = Date()
                let past = allGames.filter { game in
                    let sessionDateTime = Calendar.current.date(
                        bySettingHour: Int(game.startTime.prefix(2)) ?? 0,
                        minute: Int(game.startTime.dropFirst(3).prefix(2)) ?? 0,
                        second: 0,
                        of: game.gameDate
                    ) ?? game.gameDate
                    return sessionDateTime < now
                }
                
                await MainActor.run {
                    pastSessions = past
                }
            }
        } catch {
            print("❌ [ProfileView] Error fetching past sessions: \(error)")
        }
    }
    
    private func shareProfile() {
        // Implement share functionality
    }
}

// REMOVED: Posts feature disabled
/*
struct PostMiniCard: View {
    let post: PostWithProfile
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Gradient header
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.playerCardGradient)
                    .frame(height: 60)
                
                Image(systemName: post.sportType.icon)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.white.opacity(0.9))
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(post.headline)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                    .lineLimit(2)
                
                Text(post.timeAgo)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(AppTheme.textSecondary)
            }
        }
    }
}
*/

// MARK: - Profile Settings Sheet (Legacy - kept for backwards compatibility)

struct ProfileSettingsSheet: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    Button(action: signOut) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .foregroundColor(AppTheme.error)
                            Text("Sign Out")
                                .foregroundColor(AppTheme.error)
                        }
                    }
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
    
    private func signOut() {
        Task {
            try? await authService.signOut()
            dismiss()
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthService())
}

