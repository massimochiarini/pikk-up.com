//
//  ProfileView.swift
//  Sports App 1
//

import SwiftUI
import Auth

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var profileService = ProfileService()
    @StateObject private var gameService = GameService()
    @StateObject private var postService = PostService()
    
    @State private var stats: ProfileStats?
    @State private var userGames: [Game] = []
    @State private var showEditProfile = false
    @State private var showSettings = false
    @State private var selectedSegment = 0
    
    private let segments = ["Games", "Posts", "Activity"]
    
    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Profile header
                    profileHeader
                    
                    // Stats row
                    statsRow
                        .padding(.top, 20)
                    
                    // Action buttons
                    actionButtons
                        .padding(.top, 20)
                        .padding(.horizontal, 24)
                    
                    // Segment control
                    segmentControl
                        .padding(.top, 24)
                    
                    // Content grid
                    contentGrid
                        .padding(.top, 16)
                    
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
    
    // MARK: - Stats Row
    
    private var statsRow: some View {
        HStack(spacing: 0) {
            StatItem(value: stats?.gamesPlayed ?? 0, label: "Games")
            
            Divider()
                .frame(height: 40)
            
            StatItem(value: authService.currentProfile?.sports.count ?? 0, label: "Sports")
            
            Divider()
                .frame(height: 40)
            
            StatItem(value: stats?.connectionsCount ?? 0, label: "Connections")
        }
        .padding(.horizontal, 24)
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
    
    // MARK: - Segment Control
    
    private var segmentControl: some View {
        HStack(spacing: 0) {
            ForEach(0..<segments.count, id: \.self) { index in
                Button(action: { selectedSegment = index }) {
                    VStack(spacing: 8) {
                        Text(segments[index])
                            .font(.system(size: 14, weight: selectedSegment == index ? .bold : .medium))
                            .foregroundColor(selectedSegment == index ? AppTheme.neonGreenDark : AppTheme.textSecondary)
                        
                        Rectangle()
                            .fill(selectedSegment == index ? AppTheme.neonGreen : Color.clear)
                            .frame(height: 3)
                            .cornerRadius(1.5)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, 24)
    }
    
    // MARK: - Content Grid
    
    private var contentGrid: some View {
        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: 12
        ) {
            switch selectedSegment {
            case 0:
                ForEach(userGames) { game in
                    GameCardMini(game: game, onTap: {})
                }
            case 1:
                ForEach(postService.userPosts) { post in
                    PostMiniCard(post: post)
                }
            default:
                // Activity placeholder
                Text("Activity coming soon")
                    .foregroundColor(AppTheme.textSecondary)
            }
        }
        .padding(.horizontal, 20)
    }
    
    // MARK: - Actions
    
    private func loadProfileData() async {
        guard let userId = authService.currentUser?.id else { return }
        
        // Load stats
        if let profileStats = try? await profileService.fetchProfileStats(userId: userId) {
            stats = profileStats
        }
        
        // Load games
        if let games = try? await gameService.fetchUserCreatedGames(userId: userId) {
            userGames = games
        }
        
        // Load posts
        await postService.fetchUserPosts(userId: userId)
    }
    
    private func shareProfile() {
        // Implement share functionality
    }
}

// MARK: - Supporting Views

struct StatItem: View {
    let value: Int
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(AppTheme.textPrimary)
            
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(AppTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }
}

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

