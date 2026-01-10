//
//  OtherProfileView.swift
//  Sports App 1
//

import SwiftUI
import Auth

struct OtherProfileView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    let profile: Profile
    
    @StateObject private var connectionService = ConnectionService()
    @StateObject private var gameService = GameService()
    @StateObject private var safetyService = SafetyService()
    
    @State private var connectionType: ConnectionType?
    @State private var userGames: [Game] = []
    @State private var myGames: [Game] = []  // Games I created or joined for inviting
    @State private var selectedSegment = 0
    @State private var isLoadingAction = false
    @State private var showInviteSheet = false
    @State private var showInviteSentAlert = false
    @State private var invitedGameName = ""
    @State private var showReportView = false
    @State private var showBlockConfirmation = false
    @State private var isUserBlocked = false
    
    private let segments = ["Games", "Posts"]
    
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                // Profile header
                profileHeader
                
                // Connection badge
                if let connection = connectionType {
                    connectionBadge(connection)
                        .padding(.top, 12)
                }
                
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
            ToolbarItem(placement: .navigationBarLeading) {
                BackButton(action: { dismiss() })
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(role: .destructive, action: { showReportView = true }) {
                        Label("Report User", systemImage: "exclamationmark.shield")
                    }
                    
                    Button(role: .destructive, action: { showBlockConfirmation = true }) {
                        Label(isUserBlocked ? "Unblock User" : "Block User", 
                              systemImage: isUserBlocked ? "person.badge.minus" : "hand.raised")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 20))
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .sheet(isPresented: $showReportView) {
            ReportView(
                contentType: .user,
                contentId: profile.id,
                contentTitle: profile.fullName
            )
            .environmentObject(authService)
        }
        .alert(isUserBlocked ? "Unblock User?" : "Block User?", isPresented: $showBlockConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button(isUserBlocked ? "Unblock" : "Block", role: .destructive) {
                handleBlockAction()
            }
        } message: {
            Text(isUserBlocked ? 
                 "You'll be able to see content from \(profile.firstName) again." :
                 "You won't see content from \(profile.firstName) and they won't be able to message you.")
        }
        .sheet(isPresented: $showInviteSheet) {
            Text("Invite feature removed - messaging has been disabled")
                .padding()
        }
        .alert("Notice", isPresented: $showInviteSentAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("Messaging feature has been removed from the app.")
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
                url: profile.avatarUrl,
                initials: profile.initials,
                size: 100,
                borderColor: AppTheme.teal,
                borderWidth: 3,
                showBorder: true
            )
            
            // Name and username
            VStack(spacing: 4) {
                Text(profile.fullName)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                
                if let username = profile.username {
                    Text("@\(username)")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
            
            // Bio
            if let bio = profile.bio, !bio.isEmpty {
                Text(bio)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundColor(AppTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
        }
        .padding(.top, 20)
    }
    
    // MARK: - Connection Badge
    
    private func connectionBadge(_ type: ConnectionType) -> some View {
        HStack(spacing: 6) {
            Image(systemName: type.icon)
                .font(.system(size: 12, weight: .semibold))
            
            Text(type.displayText)
                .font(.system(size: 13, weight: .medium))
        }
        .foregroundColor(AppTheme.teal)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(AppTheme.teal.opacity(0.1))
        .cornerRadius(AppTheme.cornerRadiusPill)
    }
    
    // MARK: - Action Buttons
    
    private var actionButtons: some View {
        HStack(spacing: 12) {
            // Invite to game button (messaging removed)
            Button(action: { 
                // Messaging has been removed
            }) {
                HStack {
                    Image(systemName: "person.badge.plus")
                    Text("Invite")
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(AppTheme.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(AppTheme.divider)
                .cornerRadius(AppTheme.cornerRadiusMedium)
            }
            .disabled(true)
            .opacity(0.5)
        }
    }
    
    // MARK: - Segment Control
    
    private var segmentControl: some View {
        HStack(spacing: 0) {
            ForEach(0..<segments.count, id: \.self) { index in
                Button(action: { selectedSegment = index }) {
                    VStack(spacing: 8) {
                        Text(segments[index])
                            .font(.system(size: 14, weight: selectedSegment == index ? .semibold : .medium))
                            .foregroundColor(selectedSegment == index ? AppTheme.teal : AppTheme.textSecondary)
                        
                        Rectangle()
                            .fill(selectedSegment == index ? AppTheme.teal : Color.clear)
                            .frame(height: 2)
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
                
                if userGames.isEmpty {
                    emptyGridPlaceholder(message: "No games yet")
                }
                
            case 1:
                ForEach(postService.userPosts) { post in
                    PostMiniCard(post: post)
                }
                
                if postService.userPosts.isEmpty {
                    emptyGridPlaceholder(message: "No posts yet")
                }
                
            default:
                EmptyView()
            }
        }
        .padding(.horizontal, 20)
    }
    
    private func emptyGridPlaceholder(message: String) -> some View {
        Text(message)
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(AppTheme.textSecondary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 40)
    }
    
    // MARK: - Actions
    
    private func loadProfileData() async {
        // Check connection
        if let currentUserId = authService.currentUser?.id {
            // Load blocked users
            try? await safetyService.fetchBlockedUsers(userId: currentUserId)
            isUserBlocked = safetyService.isUserBlocked(profile.id)
            
            connectionType = await connectionService.getConnectionType(
                userId: currentUserId,
                otherUserId: profile.id
            )
            
            // Load my games (created or joined) for inviting - fetchActiveGames includes both
            if let activeGames = try? await gameService.fetchActiveGames(userId: currentUserId) {
                myGames = activeGames
            }
        }
        
        // Load this user's games
        if let games = try? await gameService.fetchUserCreatedGames(userId: profile.id) {
            userGames = games
        }
        
        // Load posts
        await postService.fetchUserPosts(userId: profile.id)
    }
    
    // REMOVED: Message feature disabled
    /*
    private func startConversation() {
        guard let currentUserId = authService.currentUser?.id else { return }
        
        isLoadingAction = true
        
        Task {
            do {
                let conversation = try await messageService.startConversation(
                    with: profile.id,
                    currentUserId: currentUserId,
                    contextType: .profile,
                    contextId: nil
                )
                
                await MainActor.run {
                    conversationToNavigate = conversation
                    navigateToConversation = true
                    isLoadingAction = false
                }
            } catch {
                print("Error starting conversation: \(error)")
                await MainActor.run {
                    isLoadingAction = false
                }
            }
        }
    }
    */
    
    private func handleBlockAction() {
        guard let currentUserId = authService.currentUser?.id else { return }
        
        Task {
            do {
                if isUserBlocked {
                    try await safetyService.unblockUser(userId: currentUserId, blockedUserId: profile.id)
                } else {
                    try await safetyService.blockUser(userId: currentUserId, blockedUserId: profile.id)
                }
                isUserBlocked.toggle()
            } catch {
                print("Error blocking/unblocking user: \(error)")
            }
        }
    }
}

// MARK: - Invite to Game Sheet

// REMOVED: Message feature disabled - InviteToGameSheet uses messaging
/*
struct InviteToGameSheet: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthService
    
    let inviteeProfile: Profile
    let games: [Game]
    let messageService: MessageService
    let onInviteSent: (String) -> Void
    
    @State private var selectedGame: Game?
    @State private var isSending = false
    @State private var showSuccess = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if games.isEmpty {
                    // Empty state
                    VStack(spacing: 16) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.system(size: 48))
                            .foregroundColor(AppTheme.textTertiary)
                        
                        Text("No Upcoming Games")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Text("Create a game first, then you can invite \(inviteeProfile.firstName) to join!")
                            .font(.system(size: 15))
                            .foregroundColor(AppTheme.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    // Game list
                    List {
                        Section {
                            ForEach(games) { game in
                                GameInviteRow(
                                    game: game,
                                    isSelected: selectedGame?.id == game.id,
                                    onSelect: { selectedGame = game }
                                )
                            }
                        } header: {
                            Text("Select a game to invite \(inviteeProfile.firstName)")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                    .listStyle(.insetGrouped)
                    
                    // Send invite button
                    if selectedGame != nil {
                        VStack {
                            Button(action: sendInvite) {
                                HStack {
                                    if isSending {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                            .scaleEffect(0.8)
                                        Text("Sending...")
                                    } else {
                                        Image(systemName: "paperplane.fill")
                                        Text("Send Invite")
                                    }
                                }
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(AppTheme.onPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 56)
                                .background(AppTheme.neonGreen)
                                .cornerRadius(16)
                            }
                            .disabled(isSending)
                            .padding(.horizontal, 24)
                            .padding(.bottom, 24)
                        }
                        .background(AppTheme.background)
                    }
                }
            }
            .background(AppTheme.background)
            .navigationTitle("Invite to Game")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
        }
    }
    
    private func sendInvite() {
        guard let game = selectedGame,
              let currentUserId = authService.currentUser?.id else { return }
        
        isSending = true
        
        Task {
            do {
                // Start or get conversation with the user
                let conversation = try await messageService.startConversation(
                    with: inviteeProfile.id,
                    currentUserId: currentUserId,
                    contextType: .game,
                    contextId: game.id
                )
                
                // Send invite message as structured payload for in-chat actions
                let payload = GameInvitePayload(
                    gameId: game.id,
                    gameName: game.venueName,
                    address: game.address,
                    formattedDate: game.formattedDate,
                    formattedTime: game.formattedTime,
                    inviterId: currentUserId
                )
                
                if let content = payload.jsonString {
                    try await messageService.sendMessage(
                        conversationId: conversation.id,
                        senderId: currentUserId,
                        content: content
                    )
                } else {
                    // Fallback to plain text if encoding fails
                    let fallback = "🏓 Invite to \(game.venueName) on \(game.formattedDate) at \(game.formattedTime) - \(game.address)"
                    try await messageService.sendMessage(
                        conversationId: conversation.id,
                        senderId: currentUserId,
                        content: fallback
                    )
                }
                
                let gameName = game.venueName
                
                await MainActor.run {
                    isSending = false
                    dismiss()
                    onInviteSent(gameName)
                }
            } catch {
                print("Error sending invite: \(error)")
                await MainActor.run {
                    isSending = false
                }
            }
        }
    }
}

// MARK: - Game Invite Row

struct GameInviteRow: View {
    let game: Game
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Game icon
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(AppTheme.neonGreen.opacity(0.15))
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: "sportscourt.fill")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(AppTheme.neonGreenDark)
                }
                
                // Game details
                VStack(alignment: .leading, spacing: 4) {
                    Text(game.venueName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Text("\(game.formattedDate) • \(game.formattedTime)")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
                
                Spacer()
                
                // Selection indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22))
                    .foregroundColor(isSelected ? AppTheme.neonGreen : AppTheme.textTertiary)
            }
            .padding(.vertical, 8)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}
*/

#Preview {
    let sampleProfile = Profile(
        id: UUID(),
        firstName: "Alex",
        lastName: "Johnson",
        username: "alexj",
        bio: "Tennis enthusiast 🎾 Always looking for a rally partner!",
        avatarUrl: nil,
        favoriteSports: ["tennis", "pickleball"],
        locationLat: nil,
        locationLng: nil,
        visibilityRadiusMiles: 25,
        onboardingCompleted: true,
        createdAt: Date()
    )
    
    NavigationStack {
        OtherProfileView(profile: sampleProfile)
    }
    .environmentObject(AuthService())
}

