//
//  MyGamesView.swift
//  Sports App 1
//

import SwiftUI
import Auth

struct MyGamesView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var gameService = GameService()
    @State private var hostedGames: [Game] = []
    @State private var rsvpedGames: [Game] = []
    @State private var historyGames: [Game] = []
    @State private var isLoading = true
    @State private var selectedGame: Game?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("My Classes")
                                .font(.system(size: 28, weight: .semibold))
                                .foregroundColor(AppTheme.textPrimary)
                            
                            Text("Your upcoming and past classes")
                                .font(.system(size: 17, weight: .medium))
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 24)
                    
                    if isLoading {
                        // Loading skeleton
                        VStack(spacing: 12) {
                            ForEach(0..<3, id: \.self) { _ in
                                GameCardSkeleton()
                            }
                        }
                        .padding(.horizontal, 20)
                    } else if hostedGames.isEmpty && rsvpedGames.isEmpty && historyGames.isEmpty {
                        // Empty state
                        EmptyMyGamesView()
                            .padding(.horizontal, 20)
                            .padding(.top, 20)
                    } else {
                        // Hosted Games Section
                        if !hostedGames.isEmpty {
                            HostedGamesSection(
                                games: hostedGames,
                                onGameTapped: { game in selectedGame = game }
                            )
                        }
                        
                        // RSVP'd Games Section
                        if !rsvpedGames.isEmpty {
                            RSVPedGamesSection(
                                games: rsvpedGames,
                                onGameTapped: { game in selectedGame = game }
                            )
                        }
                        
                        // History Section
                        if !historyGames.isEmpty {
                            HistoryGamesSection(
                                games: historyGames,
                                onGameTapped: { game in selectedGame = game }
                            )
                        }
                    }
                    
                    Spacer(minLength: 100)
                }
            }
            .background(AppTheme.background)
            .refreshable {
                await loadGames()
            }
            .navigationBarHidden(true)
            .navigationDestination(item: $selectedGame) { game in
                GameDetailView(game: game)
            }
        }
        .task {
            await loadGames()
        }
    }
    
    private func loadGames() async {
        guard let userId = authService.currentUser?.id else {
            isLoading = false
            return
        }
        
        isLoading = true
        
        do {
            async let activeTask = gameService.fetchActiveGames(userId: userId)
            async let historyTask = gameService.fetchGameHistory(userId: userId)
            
            let (active, history) = try await (activeTask, historyTask)
            
            // Split active games into hosted and RSVP'd
            hostedGames = active.filter { $0.createdBy == userId }
            rsvpedGames = active.filter { $0.createdBy != userId }
            historyGames = history
        } catch {
            print("Error loading games: \(error)")
        }
        
        isLoading = false
    }
}

// MARK: - Hosted Games Section
struct HostedGamesSection: View {
    let games: [Game]
    let onGameTapped: (Game) -> Void
    
    private var textDark: Color { AppTheme.textPrimary }
    private var textMedium: Color { AppTheme.textSecondary }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Section Header
            HStack(spacing: 8) {
                Text("Hosting")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(textDark)
                
                Spacer()
                
                Text("\(games.count)")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(textMedium)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(AppTheme.textPrimary.opacity(0.06))
                    .cornerRadius(12)
            }
            .padding(.horizontal, 20)
            
            // Hosted Games Cards
            LazyVStack(spacing: 12) {
                ForEach(games) { game in
                    ActiveGameCard(game: game)
                        .onTapGesture {
                            onGameTapped(game)
                        }
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
}

// MARK: - RSVP'd Games Section
struct RSVPedGamesSection: View {
    let games: [Game]
    let onGameTapped: (Game) -> Void
    
    private var textDark: Color { AppTheme.textPrimary }
    private var textMedium: Color { AppTheme.textSecondary }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Section Header
            HStack(spacing: 8) {
                Text("Attending")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(textDark)
                
                Spacer()
                
                Text("\(games.count)")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(textMedium)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(AppTheme.textPrimary.opacity(0.06))
                    .cornerRadius(12)
            }
            .padding(.horizontal, 20)
            
            // RSVP'd Games Cards
            LazyVStack(spacing: 12) {
                ForEach(games) { game in
                    ActiveGameCard(game: game)
                        .onTapGesture {
                            onGameTapped(game)
                        }
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.bottom, 24)
    }
}

// MARK: - History Games Section
struct HistoryGamesSection: View {
    let games: [Game]
    let onGameTapped: (Game) -> Void
    
    private var textDark: Color { AppTheme.textPrimary }
    private var textMedium: Color { AppTheme.textSecondary }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Section Header
            HStack(spacing: 8) {
                Text("History")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(textDark)
                
                Spacer()
                
                Text("\(games.count) games")
                    .font(.system(size: 14))
                    .foregroundColor(textMedium)
            }
            .padding(.horizontal, 20)
            
            // History Games Cards
            LazyVStack(spacing: 12) {
                ForEach(games) { game in
                    HistoryGameCard(game: game)
                        .onTapGesture {
                            onGameTapped(game)
                        }
                }
            }
            .padding(.horizontal, 20)
        }
    }
}

// MARK: - Active Game Card (Matching GameCardNew style)
struct ActiveGameCard: View {
    let game: Game
    @EnvironmentObject var authService: AuthService
    
    private var isHosting: Bool {
        game.createdBy == authService.currentUser?.id
    }
    
    // Gray color palette - using AppTheme textPrimary with opacity
    private var textLight: Color { AppTheme.textPrimary.opacity(0.45) }     // Light for date/time
    private var textMedium: Color { AppTheme.textPrimary.opacity(0.65) }    // Medium for players
    private var borderColor: Color { AppTheme.textPrimary.opacity(0.15) }   // Very light border
    
    // Green colors for cost badge
    private let costGreen = Color(hex: "22C55E")
    private let costGreenBg = Color(hex: "22C55E").opacity(0.12)
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 14) {
                // Top row: Title on left, skill level + cost on right
                HStack(alignment: .top) {
                    // Game title - bigger and darker
                    Text(game.customTitle ?? game.venueName)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Spacer()
                    
                    HStack(spacing: 8) {
                        // Skill Level Badge
                        if let skillLevel = game.skillLevel {
                            HStack(spacing: 4) {
                                Image(systemName: skillLevel.icon)
                                    .font(.system(size: 10, weight: .bold))
                                Text(skillLevel.displayName)
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .foregroundColor(skillLevel.color)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(skillLevel.color.opacity(0.12))
                            .cornerRadius(8)
                        }
                        
                        // Cost badge - green with light green background
                        Text(game.costDisplay)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(costGreen)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(costGreenBg)
                            .cornerRadius(8)
                    }
                }
                
                // Info rows
                VStack(alignment: .leading, spacing: 8) {
                    // Date & Time
                    HStack(spacing: 6) {
                        Image(systemName: "calendar")
                            .font(.system(size: 12))
                        Text("\(game.formattedDate) · \(game.formattedTime)")
                            .font(.system(size: 14, weight: .medium))
                    }
                    .foregroundColor(textLight)
                    
                    // Location
                    HStack(spacing: 6) {
                        Image(systemName: "mappin")
                            .font(.system(size: 12))
                        Text(game.shortAddress)
                            .font(.system(size: 14, weight: .medium))
                            .lineLimit(1)
                    }
                    .foregroundColor(textLight)
                }
                
                // Bottom row: Player count (or attending for studio sessions)
                HStack(spacing: 6) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 13))
                    Text(game.instructorId != nil ? "\(game.rsvpCount)/\(game.maxPlayers) attending" : "\(game.rsvpCount)/\(game.maxPlayers) players")
                        .font(.system(size: 14, weight: .medium))
                }
                .foregroundColor(textMedium)
            }
            .padding(16)
        }
        .background(AppTheme.background)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(borderColor, lineWidth: 1)
        )
    }
}

// MARK: - History Game Card (Compact Style)
struct HistoryGameCard: View {
    let game: Game
    @EnvironmentObject var authService: AuthService
    
    private var isHosted: Bool {
        game.createdBy == authService.currentUser?.id
    }
    
    // Gray color palette - using AppTheme textPrimary with opacity
    private var textDark: Color { AppTheme.textPrimary }
    private var textMedium: Color { AppTheme.textPrimary.opacity(0.6) }
    private var textLight: Color { AppTheme.textPrimary.opacity(0.45) }
    private var borderColor: Color { AppTheme.textPrimary.opacity(0.15) }
    private var badgeBg: Color { AppTheme.textPrimary.opacity(0.06) }
    
    private var sport: Sport {
        Sport(rawValue: game.sport) ?? .other
    }
    
    var body: some View {
        HStack(spacing: 14) {
            // Sport Icon
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(badgeBg)
                    .frame(width: 44, height: 44)
                
                Image(systemName: sport.icon)
                    .font(.system(size: 18))
                    .foregroundColor(textLight)
            }
            
            // Game Details
            VStack(alignment: .leading, spacing: 4) {
                Text(game.customTitle ?? game.venueName)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(textDark)
                    .lineLimit(1)
                
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.system(size: 10))
                        Text(game.formattedDate)
                    }
                    
                    HStack(spacing: 4) {
                        Image(systemName: "person.2")
                            .font(.system(size: 10))
                        if game.instructorId != nil {
                            Text("\(game.rsvpCount) \(game.rsvpCount == 1 ? "attending" : "attending")")
                        } else {
                            Text("\(game.rsvpCount) \(game.rsvpCount == 1 ? "player" : "players")")
                        }
                    }
                }
                .font(.system(size: 12))
                .foregroundColor(textMedium)
            }
            
            Spacer()
            
            // Chevron
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(textLight)
        }
        .padding(14)
        .background(AppTheme.background)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(borderColor, lineWidth: 1)
        )
    }
}

// MARK: - Empty State View
struct EmptyMyGamesView: View {
    var body: some View {
        VStack(spacing: 24) {
            // Icon
            ZStack {
                Circle()
                    .fill(AppTheme.divider)
                    .frame(width: 100, height: 100)
                
                Image(systemName: "figure.mind.and.body")
                    .font(.system(size: 44))
                    .foregroundColor(AppTheme.textTertiary)
            }
            
            VStack(spacing: 8) {
                Text("No classes yet")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                
                Text("Join a session to see it here. Check the feed for available classes.")
                    .font(.system(size: 15))
                    .foregroundColor(AppTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

// MARK: - Loading Skeleton
struct GameCardSkeleton: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(AppTheme.border)
                    .frame(width: 50, height: 50)
                
                VStack(alignment: .leading, spacing: 6) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.border)
                        .frame(width: 150, height: 14)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.border)
                        .frame(width: 100, height: 12)
                }
                
                Spacer()
            }
            
            RoundedRectangle(cornerRadius: 4)
                .fill(AppTheme.border)
                .frame(height: 12)
            
            RoundedRectangle(cornerRadius: 4)
                .fill(AppTheme.border)
                .frame(width: 80, height: 12)
        }
        .padding(16)
        .background(AppTheme.background)
        .cornerRadius(12)
        .shadow(color: AppTheme.cardShadow, radius: 4, x: 0, y: 2)
        .opacity(isAnimating ? 0.6 : 1.0)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}

#Preview {
    MyGamesView()
        .environmentObject(AuthService())
}
