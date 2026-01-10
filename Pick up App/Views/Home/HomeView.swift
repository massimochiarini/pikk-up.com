//
//  HomeView.swift
//  Sports App 1
//

import SwiftUI
import Auth
import CoreLocation

struct HomeView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var feedService = FeedService()
    @StateObject private var gameService = GameService()
    @ObservedObject private var locationManager = LocationManager.shared
    
    @State private var showSettings = false
    @State private var showAddFriends = false
    @State private var selectedGame: Game?
    @State private var selectedProfile: Profile?
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background
                    .ignoresSafeArea()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        // Header
                        headerView
                            .padding(.horizontal, 20)
                            .padding(.top, 16)
                        
                        // Feed
                        if feedService.isLoading && feedService.feedItems.isEmpty {
                            loadingView
                        } else if feedService.feedItems.isEmpty {
                            emptyFeedView
                        } else {
                            feedContent
                        }
                    }
                }
                .refreshable {
                    await feedService.refresh(currentUserId: authService.currentUser?.id)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showSettings) {
                SettingsView()
                    .environmentObject(authService)
                    .environmentObject(NotificationService.shared)
            }
            .sheet(isPresented: $showAddFriends) {
                AddFriendsView()
                    .environmentObject(authService)
            }
            .navigationDestination(item: $selectedGame) { game in
                GameDetailView(game: game)
            }
        }
        .task {
            // Request location permission for proximity-based sorting
            locationManager.requestLocationPermission()
            
            // Wait briefly for location to become available before fetching
            // This gives the system time to provide cached location
            if locationManager.userLocation == nil {
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
            }
            
            await feedService.fetchFeed(currentUserId: authService.currentUser?.id)
            // TODO: Enable conversations when the table is created in Supabase
            // if let userId = authService.currentUser?.id {
            //     await messageService.fetchConversations(userId: userId)
            // }
        }
        .onReceive(NotificationCenter.default.publisher(for: .gameDeleted)) { _ in
            // Refresh feed when a game is deleted
            Task {
                print("🔄 [HomeView] Game deleted notification received, refreshing feed")
                await feedService.refresh(currentUserId: authService.currentUser?.id)
            }
        }
        .onChange(of: locationManager.userLocation) { oldLocation, newLocation in
            // Refresh feed when user location becomes available for proximity sorting
            // Only refresh if this is the first time we're getting location (was nil before)
            if oldLocation == nil && newLocation != nil {
                Task {
                    await feedService.refresh(currentUserId: authService.currentUser?.id)
                }
            }
        }
    }
    
    // MARK: - Header
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Pick Up Yoga")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                
                HStack(spacing: 4) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 14))
                        .foregroundColor(AppTheme.textSecondary)
                    Text("In Miami FL")
                        .font(.system(size: 17, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
            
            Spacer()
            
            HStack(spacing: 12) {
                // Add friends button
                Button(action: { showAddFriends = true }) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.cardBackground)
                            .frame(width: 44, height: 44)
                        
                        Image(systemName: "person.badge.plus")
                            .font(.system(size: 20))
                            .foregroundColor(AppTheme.textPrimary)
                    }
                }
                
                // Settings button
                Button(action: { showSettings = true }) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.cardBackground)
                            .frame(width: 44, height: 44)
                        
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 20))
                            .foregroundColor(AppTheme.textPrimary)
                    }
                }
            }
        }
        .padding(.bottom, 20)
    }
    
    // MARK: - Feed Content
    
    private var feedContent: some View {
        LazyVStack(spacing: 16) {
            ForEach(feedService.feedItems) { item in
                feedItemView(item)
                    .padding(.horizontal, 20)
            }
        }
        .padding(.top, 8)
    }
    
    @ViewBuilder
    private func feedItemView(_ item: FeedItem) -> some View {
        switch item.type {
        case .game(let game):
            GameCardNew(
                game: game,
                connectionContext: item.connectionContext,
                participants: [],
                onJoinTapped: {
                    selectedGame = game
                },
                onDetailsTapped: {
                    selectedGame = game
                },
                distanceText: "Nearby"
            )
            
        case .activity(let activity):
            ActivityCard(activity: activity, onTap: nil)
        }
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ForEach(0..<3, id: \.self) { _ in
                loadingCard
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }
    
    private var loadingCard: some View {
        RoundedRectangle(cornerRadius: AppTheme.cornerRadiusLarge)
            .fill(AppTheme.cardBackground)
            .frame(height: 180)
            .shimmering()
    }
    
    // MARK: - Empty Feed
    
    private var emptyFeedView: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.mind.and.body")
                .font(.system(size: 48))
                .foregroundColor(AppTheme.textTertiary)
            
            Text("No classes are scheduled")
                .font(.system(size: 17, weight: .medium))
                .foregroundColor(AppTheme.textPrimary)
            
            Text("Pull to refresh or check back soon.")
                .font(.system(size: 14))
                .foregroundColor(AppTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 80)
    }
    
    // MARK: - Actions removed (no player posts)
}

// MARK: - Shimmer Effect

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .overlay(
                GeometryReader { geometry in
                    LinearGradient(
                        colors: [
                            Color.black.opacity(0),
                            Color.black.opacity(0.1),
                            Color.black.opacity(0)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: geometry.size.width * 2)
                    .offset(x: -geometry.size.width + (geometry.size.width * 2 * phase))
                }
            )
            .mask(content)
            .onAppear {
                withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                    phase = 1
                }
            }
    }
}

extension View {
    func shimmering() -> some View {
        modifier(ShimmerModifier())
    }
}

#Preview {
    HomeView()
        .environmentObject(AuthService())
}
