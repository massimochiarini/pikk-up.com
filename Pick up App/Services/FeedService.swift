//
//  FeedService.swift
//  Sports App 1
//

import Foundation
import Combine
import Supabase
import CoreLocation

@MainActor
class FeedService: ObservableObject {
    @Published var feedItems: [FeedItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseManager.shared.client
    private let locationManager = LocationManager.shared
    
    // Sport preference for filtering
    var sportPreference: String?
    
    // MARK: - Fetch Feed
    
    func fetchFeed(currentUserId: UUID?) async {
        isLoading = true
        errorMessage = nil
        
        do {
            var items: [FeedItem] = []
            
            // Fetch active posts (if posts table exists)
            let posts = try await fetchPosts(currentUserId: currentUserId)
            items.append(contentsOf: posts)
            
            // Fetch upcoming games - this is the main content
            let games = try await fetchGames(currentUserId: currentUserId)
            items.append(contentsOf: games)
            
            // Add activity cards
            let activities = generateActivityItems(
                postsCount: posts.count,
                gamesCount: games.count
            )
            items.append(contentsOf: activities)
            
            // Separate items by type for proper ordering
            let activityItems = items.filter { item in
                if case .activity = item.type { return true }
                return false
            }
            
            // Games are already sorted by time then proximity from fetchGames
            let gameItems = items.filter { item in
                if case .game = item.type { return true }
                return false
            }
            
            // Posts sorted by timestamp (newest first)
            var postItems = items.filter { item in
                if case .playerPost = item.type { return true }
                return false
            }
            postItems.sort { $0.timestamp > $1.timestamp }
            
            // Final order: activity cards first, then games (sorted by time/proximity), then posts
            feedItems = activityItems + gameItems + postItems
            
        } catch {
            print("❌ [FeedService] Error loading feed: \(error)")
            errorMessage = "Failed to load feed: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    // MARK: - Fetch Posts
    
    private func fetchPosts(currentUserId: UUID?) async throws -> [FeedItem] {
        // Try to fetch posts, but don't fail if the table doesn't exist or is empty
        do {
            let posts: [PostWithProfile] = try await supabase
                .from("posts")
                .select("*, profiles(*)")
                .eq("is_active", value: true)
                .order("created_at", ascending: false)
                .limit(20)
                .execute()
                .value
            
            // Filter expired posts and convert to feed items
            return posts
                .filter { post in
                    if let expiresAt = post.expiresAt {
                        return expiresAt > Date()
                    }
                    return true
                }
                .compactMap { post -> FeedItem? in
                    // Don't show user's own posts in feed
                    if let userId = currentUserId, post.userId == userId {
                        return nil
                    }
                    return FeedItem(post: post, connectionContext: nil)
                }
        } catch {
            print("⚠️ [FeedService] Could not fetch posts: \(error.localizedDescription)")
            return []
        }
    }
    
    // MARK: - Fetch Games
    
    private func fetchGames(currentUserId: UUID?) async throws -> [FeedItem] {
        let todayString = DateFormatter.supabaseDateFormatter.string(from: Date())
        
        print("🎮 [FeedService] Fetching games with date >= \(todayString)")
        print("🎮 [FeedService] Sport preference: \(sportPreference ?? "none")")
        
        // Fetch ALL upcoming games from the database
        var allGames: [Game] = try await supabase
            .from("games")
            .select()
            .gte("game_date", value: todayString)
            .order("game_date", ascending: true)
            .order("start_time", ascending: true)
            .limit(50)
            .execute()
            .value
        
        print("🎮 [FeedService] Raw games fetched from database: \(allGames.count)")
        
        // Filter out private games that don't belong to the current user
        // Also filter out games that have already passed (start time is in the past)
        // Also filter by sport preference if set
        var filteredGames = allGames.filter { game in
            // Filter out games that have already started
            if game.hasPassed {
                print("🎮 [FeedService] Filtering out past game: \(game.venueName) at \(game.formattedTime)")
                return false
            }
            
            // Show if game is not private, or if user is the creator
            let shouldShow = !game.isPrivate || game.createdBy == currentUserId
            if !shouldShow {
                print("🎮 [FeedService] Filtering out private game: \(game.id)")
                return false
            }
            
            // Filter by sport preference
            if let preference = sportPreference {
                // Special case: "none" means show no games
                if preference == "none" {
                    print("🎮 [FeedService] Filtering out all games (preference is 'none')")
                    return false
                }
                
                // "both" means show all games
                if preference == "both" {
                    return true
                }
                
                // Otherwise filter by specific sport
                let gameSport = game.sport.lowercased()
                let shouldShowSport = gameSport == preference.lowercased()
                if !shouldShowSport {
                    print("🎮 [FeedService] Filtering out \(gameSport) game due to preference: \(preference)")
                }
                return shouldShowSport
            }
            
            // No preference set, show all games
            return true
        }
        
        print("🎮 [FeedService] Games after filtering: \(filteredGames.count)")
        
        // Log user location status
        if let userLoc = locationManager.userLocation {
            print("📍 [FeedService] User location: \(userLoc.coordinate.latitude), \(userLoc.coordinate.longitude)")
        } else {
            print("📍 [FeedService] User location not available - distance sorting will be skipped")
        }
        
        // Fetch RSVP counts and calculate distance from user
        for i in 0..<filteredGames.count {
            let count = try await getRSVPCount(for: filteredGames[i].id)
            filteredGames[i].rsvpCount = count
            
            // Get coordinates from database or geocode if missing
            var coordinate: CLLocationCoordinate2D?
            
            if let lat = filteredGames[i].latitude, let lng = filteredGames[i].longitude {
                // Use coordinates from database
                coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
                print("🎮 [FeedService] Using stored coordinates for '\(filteredGames[i].venueName)'")
            } else {
                // Geocode the address for backward compatibility with old games
                coordinate = await locationManager.geocodeAddress(filteredGames[i].address)
                if coordinate != nil {
                    print("🎮 [FeedService] Geocoded address for '\(filteredGames[i].venueName)'")
                } else {
                    print("⚠️ [FeedService] Failed to geocode address for '\(filteredGames[i].venueName)': \(filteredGames[i].address)")
                }
            }
            
            // Calculate distance from user if coordinates are available
            if let coordinate = coordinate {
                if let distance = locationManager.distanceFromUser(to: coordinate) {
                    filteredGames[i].distanceFromUser = distance
                    print("🎮 [FeedService] Game '\(filteredGames[i].venueName)' at \(filteredGames[i].startTime) - \(String(format: "%.1f", distance)) miles away")
                } else {
                    print("🎮 [FeedService] Game '\(filteredGames[i].venueName)' at \(filteredGames[i].startTime) - no user location for distance")
                }
            }
        }
        
        // Sort games by date/time first, then by distance for games at the same time
        filteredGames = sortGamesByTimeAndProximity(filteredGames)
        
        // Log final sorted order
        print("🎮 [FeedService] Games sorted order:")
        for (index, game) in filteredGames.enumerated() {
            let distanceStr = game.distanceFromUser.map { String(format: "%.1f mi", $0) } ?? "no distance"
            print("   \(index + 1). \(game.venueName) - \(game.formattedDate) \(game.formattedTime) - \(distanceStr)")
        }
        
        // Convert to feed items
        let feedItems = filteredGames.map { game in
            FeedItem(game: game, connectionContext: nil)
        }
        
        print("🎮 [FeedService] Returning \(feedItems.count) game feed items")
        
        return feedItems
    }
    
    // MARK: - Sort Games by Time and Proximity
    
    /// Sorts games by date/time first, then by proximity for games scheduled at the same time
    private func sortGamesByTimeAndProximity(_ games: [Game]) -> [Game] {
        return games.sorted { game1, game2 in
            // First, compare by date
            let dateComparison = game1.gameDate.compare(game2.gameDate)
            if dateComparison != .orderedSame {
                return dateComparison == .orderedAscending
            }
            
            // Same date, compare by start time
            if game1.startTime != game2.startTime {
                return game1.startTime < game2.startTime
            }
            
            // Same date and time - sort by distance (closest first)
            // Games without distance info go to the end
            switch (game1.distanceFromUser, game2.distanceFromUser) {
            case let (d1?, d2?):
                return d1 < d2
            case (nil, _?):
                return false // game1 has no distance, put it after game2
            case (_?, nil):
                return true  // game2 has no distance, put it after game1
            case (nil, nil):
                return false // Both have no distance, maintain original order
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func getRSVPCount(for gameId: UUID) async throws -> Int {
        let rsvps: [RSVP] = try await supabase
            .from("rsvps")
            .select()
            .eq("game_id", value: gameId.uuidString)
            .execute()
            .value
        
        return rsvps.count
    }
    
    // MARK: - Generate Activity Items
    
    private func generateActivityItems(postsCount: Int, gamesCount: Int) -> [FeedItem] {
        var activities: [FeedItem] = []
        
        // Add "players looking" card if there are posts
        if postsCount > 0 {
            let activity = ActivityItem.playersLookingActivity(count: postsCount)
            activities.append(FeedItem(activity: activity))
        }
        
        // Add "nearby games" card if there are games
        if gamesCount > 0 {
            let activity = ActivityItem.nearbyGamesActivity(count: gamesCount)
            activities.append(FeedItem(activity: activity))
        }
        
        return activities
    }
    
    // MARK: - Refresh
    
    func refresh(currentUserId: UUID?) async {
        await fetchFeed(currentUserId: currentUserId)
    }
    
    // MARK: - Filter by Type
    
    func filterByPosts() -> [FeedItem] {
        return feedItems.filter { item in
            if case .playerPost = item.type {
                return true
            }
            return false
        }
    }
    
    func filterByGames() -> [FeedItem] {
        return feedItems.filter { item in
            if case .game = item.type {
                return true
            }
            return false
        }
    }
    
    func filterByConnections() -> [FeedItem] {
        return feedItems.filter { $0.connectionContext != nil }
    }
}

