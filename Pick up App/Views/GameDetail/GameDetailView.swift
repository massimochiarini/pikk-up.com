//
//  GameDetailView.swift
//  Sports App 1
//

import SwiftUI
import MapKit
import Auth

struct GameDetailView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var gameService = GameService()
    @StateObject private var messageService = MessageService()
    @Environment(\.dismiss) var dismiss
    
    let game: Game
    
    @State private var rsvps: [RSVPWithProfile] = []
    @State private var isLoading = true
    @State private var hasRSVPed = false
    @State private var isProcessing = false
    @State private var showEditSheet = false
    @State private var shouldDismissAfterDelete = false
    @State private var venueCoordinate: CLLocationCoordinate2D?
    @State private var lookAroundScene: MKLookAroundScene?
    @State private var venueSnapshots: [UIImage] = []
    @State private var isLoadingPhotos = true
    @State private var groupChat: GroupChat?
    @State private var chatMembers: [GroupChatMemberWithProfile] = []
    @State private var showMapsActionSheet = false
    
    var isCreator: Bool {
        authService.currentUser?.id == game.createdBy
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Hero Image Section
                heroImageSection
                
                // Content
                VStack(alignment: .leading, spacing: 24) {
                    // Title Section
                    titleSection
                    
                    // Web-managed session info
                    if isCreator && game.isWebManaged {
                        webManagedInfoBanner
                    }
                    
                    Divider()
                        .padding(.vertical, 8)
                    
                    // About Section (if there's a description)
                    if let description = game.description, !description.isEmpty {
                        aboutSection(description: description)
                        
                        Divider()
                            .padding(.vertical, 8)
                    }
                    
                    // Players Section
                    playersSection
                    
                    Divider()
                        .padding(.vertical, 8)
                    
                    // Chat Section
                    chatSection
                    
                    Divider()
                        .padding(.vertical, 8)
                    
                    // Map Section
                    mapSection
                    
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
        }
        .background(AppTheme.background)
        .navigationBarBackButtonHidden(true)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                BackButton(action: { dismiss() })
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                CircularToolbarButton(
                    icon: "square.and.arrow.up",
                    action: { shareGame() },
                    backgroundColor: AppTheme.background,
                    foregroundColor: AppTheme.textPrimary
                )
            }
        }
        .sheet(isPresented: $showEditSheet) {
            CreateGameView(existingGame: game, onGameDeleted: {
                shouldDismissAfterDelete = true
            })
            .environmentObject(gameService)
        }
        .confirmationDialog("Open in Maps", isPresented: $showMapsActionSheet, titleVisibility: .visible) {
            Button("Apple Maps") {
                openInAppleMaps()
            }
            
            Button("Google Maps") {
                openInGoogleMaps()
            }
            
            Button("Cancel", role: .cancel) { }
        }
        .onChange(of: showEditSheet) { _, isShowing in
            if !isShowing && shouldDismissAfterDelete {
                dismiss()
            }
        }
        .task {
            await loadGameDetails()
            await geocodeAddress()
            await loadGroupChat()
        }
    }
    
    // MARK: - Hero Photo Section
    private var heroImageSection: some View {
        ZStack {
            if let scene = lookAroundScene {
                // Interactive Look Around view (street-level photos)
                LookAroundPreview(initialScene: scene)
                    .frame(height: 260)
            } else if !venueSnapshots.isEmpty {
                // Swipeable satellite/hybrid snapshots
                TabView {
                    ForEach(venueSnapshots.indices, id: \.self) { index in
                        Image(uiImage: venueSnapshots[index])
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(height: 260)
                            .clipped()
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .automatic))
                .frame(height: 260)
            } else {
                // Loading or error placeholder
                Rectangle()
                    .fill(AppTheme.textPrimary.opacity(0.06))
                    .frame(height: 260)
                    .overlay(
                        Group {
                            if isLoadingPhotos {
                                VStack(spacing: 8) {
                                    ProgressView()
                                    Text("Loading venue photos...")
                                        .font(.caption)
                                        .foregroundColor(AppTheme.textSecondary)
                                }
                            } else {
                                VStack(spacing: 8) {
                                    Image(systemName: "photo.on.rectangle")
                                        .font(.system(size: 32))
                                        .foregroundColor(AppTheme.textPrimary.opacity(0.3))
                                    Text("Photos unavailable")
                                        .font(.caption)
                                        .foregroundColor(AppTheme.textSecondary)
                                }
                            }
                        }
                    )
            }
        }
        .onTapGesture {
            openInMaps()
        }
    }
    
    // MARK: - Title Section
    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Title with skill level and cost in top right
            HStack(alignment: .top) {
                Text(game.customTitle ?? game.venueName)
                    .font(.title)
                    .fontWeight(.bold)
                
                Spacer()
                
                HStack(spacing: 8) {
                    // Skill Level Badge
                    if let skillLevel = game.skillLevel {
                        HStack(spacing: 4) {
                            Image(systemName: skillLevel.icon)
                                .font(.system(size: 12, weight: .bold))
                            Text(skillLevel.displayName)
                                .font(.system(size: 13, weight: .bold))
                        }
                        .foregroundColor(skillLevel.color)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(skillLevel.color.opacity(0.12))
                        .cornerRadius(8)
                    }
                    
                    // Cost Badge
                    Text(game.costDisplay)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.green)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.green.opacity(0.12))
                        .cornerRadius(8)
                }
            }
            
            // Address line
            HStack(spacing: 8) {
                Text(game.address)
                    .foregroundColor(AppTheme.textSecondary)
                    .font(.subheadline)
                    .lineLimit(1)
                
                if game.isPrivate {
                    Text("•")
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 10))
                        Text("Private")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(.orange)
                }
            }
            
            // Date and Time
            Text("\(game.formattedDate) at \(game.formattedTime)")
                .font(.subheadline)
                .foregroundColor(AppTheme.textSecondary)
            
            // Spots available
            if rsvps.count < game.maxPlayers {
                let spotsRemaining = game.maxPlayers - rsvps.count
                Text("\(spotsRemaining) spots remaining")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .padding(.top, 4)
            }
            
            // Action buttons row
            HStack(spacing: 10) {
                // Join/Leave/Manage button (now first)
                if isCreator && !game.isWebManaged {
                    // Mobile-created games can be edited
                    Button(action: { showEditSheet = true }) {
                        HStack(spacing: 4) {
                            Image(systemName: "gearshape.fill")
                            Text("Manage")
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AppTheme.textPrimary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(AppTheme.primary)
                        .cornerRadius(20)
                    }
                } else if isCreator && game.isWebManaged {
                    // Web-managed sessions show info instead
                    HStack(spacing: 6) {
                        Image(systemName: "globe")
                            .font(.system(size: 12))
                        Text("Managed on web")
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundColor(AppTheme.textTertiary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(AppTheme.divider)
                    .cornerRadius(20)
                } else {
                    Button(action: toggleRSVP) {
                        HStack(spacing: 4) {
                            if isProcessing {
                                ProgressView()
                                    .scaleEffect(0.7)
                                    .tint(hasRSVPed ? .white : .black)
                            } else {
                                Image(systemName: hasRSVPed ? "xmark" : "plus")
                                Text(hasRSVPed ? "Leave" : "Join")
                            }
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(hasRSVPed ? .white : AppTheme.textPrimary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(hasRSVPed ? Color.red : AppTheme.primary)
                        .cornerRadius(20)
                    }
                    .disabled(isProcessing)
                }
                
                // Get Directions button (now second, with outline style)
                Button(action: { openInMaps() }) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                        Text("Get Directions")
                    }
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(AppTheme.textPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(AppTheme.background)
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(AppTheme.textPrimary.opacity(0.2), lineWidth: 1)
                    )
                }
                
                Spacer()
            }
            .padding(.top, 4)
        }
    }
    
    // MARK: - About Section
    // MARK: - Web-Managed Info Banner
    
    private var webManagedInfoBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "info.circle.fill")
                .font(.system(size: 16))
                .foregroundColor(AppTheme.neonGreen)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Studio Session")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                
                Text("This session was created on the web app. To edit details, use the web dashboard. You can still chat with participants here.")
                    .font(.system(size: 13))
                    .foregroundColor(AppTheme.textSecondary)
                    .lineSpacing(2)
            }
        }
        .padding(12)
        .background(AppTheme.neonGreen.opacity(0.08))
        .cornerRadius(12)
        .padding(.top, 8)
    }
    
    // MARK: - About Section
    
    private func aboutSection(description: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("About")
                .font(.headline)
                .fontWeight(.bold)
            
            Text(description)
                .font(.subheadline)
                .foregroundColor(AppTheme.textSecondary)
                .lineSpacing(4)
        }
    }
    
    // MARK: - Players Section
    private var playersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(game.instructorId != nil ? "Attending (\(rsvps.count))" : "Players (\(rsvps.count))")
                    .font(.headline)
                    .fontWeight(.bold)
                
                Spacer()
                
                if rsvps.count > 3 {
                    Button(action: {}) {
                        Text("See all")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(AppTheme.primary)
                    }
                }
            }
            
            if isLoading {
                HStack(spacing: 8) {
                    ProgressView()
                    Text("Loading players...")
                        .foregroundColor(AppTheme.textSecondary)
                        .font(.subheadline)
                }
                .padding(.vertical, 8)
            } else if rsvps.isEmpty {
                HStack(spacing: 12) {
                    Image(systemName: "person.badge.plus")
                        .font(.title2)
                        .foregroundColor(AppTheme.primary.opacity(0.7))
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("No players yet")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Text("Be the first to join!")
                            .font(.caption)
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
                .padding(.vertical, 8)
            } else {
                VStack(spacing: 8) {
                    ForEach(rsvps.prefix(5)) { rsvp in
                        GamePlayerRow(profile: rsvp.profiles, isCreator: rsvp.userId == game.createdBy)
                    }
                }
            }
        }
    }
    
    // MARK: - Chat Section
    private var chatSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Game Chat")
                    .font(.headline)
                    .fontWeight(.bold)
                
                Spacer()
                
                if groupChat != nil {
                    NavigationLink(destination: gameChatDestination) {
                        HStack(spacing: 4) {
                            Image(systemName: "bubble.left.fill")
                            Text("Open Chat")
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AppTheme.textPrimary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(AppTheme.background)
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(AppTheme.textPrimary.opacity(0.2), lineWidth: 1)
                        )
                    }
                }
            }
            
            // Chat preview
            if groupChat != nil {
                VStack(spacing: 0) {
                    if messageService.groupMessages.isEmpty {
                        // Empty state
                        VStack(spacing: 12) {
                            Image(systemName: "bubble.left.and.bubble.right")
                                .font(.system(size: 32))
                                .foregroundColor(AppTheme.textPrimary.opacity(0.3))
                            
                            Text("No messages yet")
                                .font(.subheadline)
                                .foregroundColor(AppTheme.textSecondary)
                            
                            Text("Be the first to say hello!")
                                .font(.caption)
                                .foregroundColor(AppTheme.textTertiary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                    } else {
                        // Show last few messages
                        ForEach(messageService.groupMessages.suffix(3)) { message in
                            GameChatPreviewRow(
                                message: message,
                                isFromCurrentUser: message.senderId == authService.currentUser?.id,
                                senderProfile: chatMembers.first(where: { $0.member.userId == message.senderId })?.profile
                            )
                        }
                    }
                }
                .padding(12)
                .background(AppTheme.textPrimary.opacity(0.04))
                .cornerRadius(12)
            } else {
                // No chat yet
                VStack(spacing: 12) {
                    Image(systemName: "bubble.left.and.bubble.right")
                        .font(.system(size: 32))
                        .foregroundColor(AppTheme.textPrimary.opacity(0.3))
                    
                    Text("Chat will be available when players join")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 32)
                .background(AppTheme.textPrimary.opacity(0.04))
                .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Map Section
    private var mapSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Location")
                .font(.headline)
                .fontWeight(.bold)
            
            // Map with pin
            if let coordinate = venueCoordinate {
                Map(coordinateRegion: .constant(MKCoordinateRegion(
                    center: coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                )), annotationItems: [MapPin(coordinate: coordinate)]) { pin in
                    MapAnnotation(coordinate: pin.coordinate) {
                        VStack(spacing: 0) {
                            Image(systemName: "mappin.circle.fill")
                                .font(.system(size: 36))
                                .foregroundColor(.red)
                            
                            Image(systemName: "arrowtriangle.down.fill")
                                .font(.system(size: 12))
                                .foregroundColor(.red)
                                .offset(y: -4)
                        }
                    }
                }
                .frame(height: 180)
                .cornerRadius(12)
                .onTapGesture {
                    openInMaps()
                }
            } else {
                // Loading placeholder
                Rectangle()
                    .fill(AppTheme.textPrimary.opacity(0.06))
                    .frame(height: 180)
                    .cornerRadius(12)
                    .overlay(
                        ProgressView()
                    )
            }
            
            // Address
            HStack(spacing: 8) {
                Image(systemName: "mappin.and.ellipse")
                    .foregroundColor(AppTheme.textSecondary)
                
                Text(game.address)
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
            }
        }
    }
    
    @ViewBuilder
    private var gameChatDestination: some View {
        if let groupChat = groupChat {
            GroupConversationView(
                groupChat: GroupChatWithDetails(
                    groupChat: groupChat,
                    memberCount: chatMembers.count,
                    game: game
                )
            )
            .environmentObject(authService)
        }
    }
    
    
    // MARK: - Helper Functions
    private func loadGameDetails() async {
        isLoading = true
        
        do {
            rsvps = try await gameService.getRSVPs(for: game.id)
            
            if let userId = authService.currentUser?.id {
                hasRSVPed = try await gameService.hasUserRSVPed(gameId: game.id, userId: userId)
            }
        } catch {
            print("Error loading game details: \(error)")
        }
        
        isLoading = false
    }
    
    private func toggleRSVP() {
        guard let userId = authService.currentUser?.id else { return }
        
        isProcessing = true
        
        Task {
            do {
                if hasRSVPed {
                    try await gameService.cancelRSVP(gameId: game.id, userId: userId)
                    hasRSVPed = false
                } else {
                    try await gameService.rsvpToGame(gameId: game.id, userId: userId)
                    hasRSVPed = true
                }
                
                rsvps = try await gameService.getRSVPs(for: game.id)
            } catch {
                print("Error toggling RSVP: \(error)")
            }
            
            isProcessing = false
        }
    }
    
    private func geocodeAddress() async {
        // First check if game has saved coordinates
        if let latitude = game.latitude, let longitude = game.longitude {
            print("✅ [GameDetailView] Using saved coordinates: \(latitude), \(longitude)")
            let coord = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            await loadVenuePhotos(for: coord)
            await MainActor.run {
                venueCoordinate = coord
            }
            return
        }
        
        // Fallback to geocoding the address
        print("📍 [GameDetailView] No saved coordinates, geocoding address: \(game.address)")
        let geocoder = CLGeocoder()
        
        do {
            let placemarks = try await geocoder.geocodeAddressString(game.address)
            if let location = placemarks.first?.location {
                let coord = location.coordinate
                await MainActor.run {
                    venueCoordinate = coord
                }
                await loadVenuePhotos(for: coord)
            }
        } catch {
            print("❌ Error geocoding address: \(error)")
            await MainActor.run {
                self.isLoadingPhotos = false
            }
        }
    }
    
    private func loadVenuePhotos(for coord: CLLocationCoordinate2D) async {
        // Try to get Look Around scene first (street-level imagery)
        let lookAroundRequest = MKLookAroundSceneRequest(coordinate: coord)
        if let scene = try? await lookAroundRequest.scene {
            await MainActor.run {
                self.lookAroundScene = scene
                self.isLoadingPhotos = false
            }
            return
        }
        
        // Fallback: Generate multiple satellite snapshots at different zoom levels
        var snapshots: [UIImage] = []
        let zoomLevels: [Double] = [0.002, 0.005, 0.01] // Close, medium, wide
        
        for zoom in zoomLevels {
            let options = MKMapSnapshotter.Options()
            options.region = MKCoordinateRegion(
                center: coord,
                span: MKCoordinateSpan(latitudeDelta: zoom, longitudeDelta: zoom)
            )
            options.size = CGSize(width: 800, height: 520)
            options.mapType = .hybrid
            options.showsBuildings = true
            options.pointOfInterestFilter = .includingAll
            
            let snapshotter = MKMapSnapshotter(options: options)
            if let snapshot = try? await snapshotter.start() {
                snapshots.append(snapshot.image)
            }
        }
        
        await MainActor.run {
            self.venueSnapshots = snapshots
            self.isLoadingPhotos = false
        }
    }
    
    private func loadGroupChat() async {
        do {
            // Try to get existing group chat for this game
            groupChat = try await messageService.getGroupChatForGame(gameId: game.id)
            
            if let groupChat = groupChat {
                // Fetch messages for preview
                await messageService.fetchGroupMessages(groupChatId: groupChat.id)
                
                // Fetch members for displaying names
                chatMembers = try await messageService.getGroupChatMembers(groupChatId: groupChat.id)
            }
        } catch {
            print("Error loading group chat: \(error)")
        }
    }
    
    private func openInMaps() {
        showMapsActionSheet = true
    }
    
    private func openInAppleMaps() {
        guard let coordinate = venueCoordinate else { return }

        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = game.customTitle ?? game.venueName
        mapItem.openInMaps(launchOptions: [
            MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving
        ])
    }
    
    private func openInGoogleMaps() {
        guard let coordinate = venueCoordinate else { return }
        
        // Try to open in Google Maps app first
        let googleMapsURL = URL(string: "comgooglemaps://?daddr=\(coordinate.latitude),\(coordinate.longitude)&directionsmode=driving")
        
        if let url = googleMapsURL, UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else {
            // Fall back to Google Maps web
            let webURL = URL(string: "https://www.google.com/maps/dir/?api=1&destination=\(coordinate.latitude),\(coordinate.longitude)")
            if let url = webURL {
                UIApplication.shared.open(url)
            }
        }
    }
    
    private func shareGame() {
        let shareText = "Join me for \((Sport(rawValue: game.sport) ?? .other).displayName) at \(game.customTitle ?? game.venueName) on \(game.formattedDate) at \(game.formattedTime)!"
        
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first,
              let rootVC = window.rootViewController else { return }
        
        let activityVC = UIActivityViewController(activityItems: [shareText], applicationActivities: nil)
        
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = rootVC.view
            popover.sourceRect = CGRect(x: UIScreen.main.bounds.width / 2, y: 0, width: 0, height: 0)
        }
        
        rootVC.present(activityVC, animated: true)
    }
}

// MARK: - Supporting Views

struct GamePlayerRow: View {
    let profile: Profile?
    var isCreator: Bool = false
    
    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            AvatarView(
                url: profile?.avatarUrl,
                initials: profile?.initials ?? "?",
                size: 44,
                showBorder: false
            )
            
            HStack(spacing: 6) {
                Text(profile?.fullName ?? "Unknown Player")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if isCreator {
                    Text("Host")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.brandBlue)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(AppTheme.brandBlue.opacity(0.12))
                        .cornerRadius(4)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 6)
    }
}

// Map Pin model for annotations
struct MapPin: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
}

// MARK: - Chat Preview Row
struct GameChatPreviewRow: View {
    let message: GroupMessage
    let isFromCurrentUser: Bool
    let senderProfile: Profile?
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            // Avatar
            AvatarView(
                url: senderProfile?.avatarUrl,
                initials: senderProfile?.initials ?? "?",
                size: 28,
                showBorder: false
            )
            
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(isFromCurrentUser ? "You" : (senderProfile?.firstName ?? "Unknown"))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Text(message.formattedTime)
                        .font(.system(size: 11))
                        .foregroundColor(AppTheme.textSecondary)
                }
                
                Text(message.content)
                    .font(.system(size: 14))
                    .foregroundColor(AppTheme.textPrimary.opacity(0.8))
                    .lineLimit(2)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(AppTheme.background)
            .cornerRadius(16)
            .shadow(color: AppTheme.textPrimary.opacity(0.06), radius: 4, x: 0, y: 2)
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        GameDetailView(
            game: try! JSONDecoder().decode(Game.self, from: """
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "created_by": "550e8400-e29b-41d4-a716-446655440001",
                "sport": "pickleball",
                "venue_name": "Mile High Run Club",
                "address": "1251 Lexington Avenue, New York, NY 10028",
                "game_date": "2025-12-17",
                "start_time": "09:00:00",
                "max_players": 8,
                "cost_cents": 1000,
                "description": "Join us for a fun morning session! All skill levels welcome. We'll have equipment available for beginners.",
                "image_url": null,
                "is_private": false,
                "created_at": "2025-12-13T10:00:00Z"
            }
            """.data(using: .utf8)!)
        )
        .environmentObject(AuthService())
    }
}
