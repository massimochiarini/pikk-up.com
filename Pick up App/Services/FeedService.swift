//
//  FeedService.swift
//  Pick Up Yoga
//
//  Service for fetching yoga class feed
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
    
    // MARK: - Fetch Feed
    
    func fetchFeed(currentUserId: UUID?) async {
        isLoading = true
        errorMessage = nil
        
        do {
            var items: [FeedItem] = []
            
            // Fetch upcoming yoga classes - this is the main content
            let games = try await fetchGames(currentUserId: currentUserId)
            items.append(contentsOf: games)
            
            // Count classes happening today only
            let todayGamesCount = countGamesToday(from: games)
            
            // Add activity cards
            let activities = generateActivityItems(gamesCount: todayGamesCount)
            items.append(contentsOf: activities)
            
            // Separate items by type for proper ordering
            let activityItems = items.filter { item in
                if case .activity = item.type { return true }
                return false
            }
            
            // Classes are already sorted by time then proximity from fetchGames
            let gameItems = items.filter { item in
                if case .game = item.type { return true }
                return false
            }
            
            // Final order: activity cards first, then classes (sorted by time/proximity)
            feedItems = activityItems + gameItems
            
        } catch {
            print("❌ [FeedService] Error loading feed: \(error)")
            errorMessage = "Failed to load feed: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    // MARK: - Fetch Games
    
    private func fetchGames(currentUserId: UUID?) async throws -> [FeedItem] {
        let todayString = DateFormatter.supabaseDateFormatter.string(from: Date())
        
        print("🎮 [FeedService] Fetching games with date >= \(todayString)")
        
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
        
        // Filter out games that have already passed (start time is in the past)
        var filteredGames = allGames.filter { game in
            // Filter out games that have already started
            if game.hasPassed {
                print("🎮 [FeedService] Filtering out past game: \(game.venueName) at \(game.formattedTime)")
                return false
            }
            
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
    
    private func countGamesToday(from feedItems: [FeedItem]) -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        return feedItems.filter { item in
            guard case .game(let game) = item.type else { return false }
            let gameDay = calendar.startOfDay(for: game.gameDate)
            return gameDay == today
        }.count
    }
    
    // MARK: - Generate Activity Items
    
    private func generateActivityItems(gamesCount: Int) -> [FeedItem] {
        var activities: [FeedItem] = []
        
        // Add "nearby classes" card if there are classes
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

