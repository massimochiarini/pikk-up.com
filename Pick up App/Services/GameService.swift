//
//  GameService.swift
//  PickleballApp
//

import Foundation
import Combine
import Supabase

// Notification name for game updates
extension Notification.Name {
    static let gameDeleted = Notification.Name("gameDeleted")
    static let gameUpdated = Notification.Name("gameUpdated")
}

@MainActor
class GameService: ObservableObject {
    @Published var games: [Game] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseManager.shared.client
    
    func fetchGames(currentUserId: UUID? = nil) async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Fetch games ordered by date
            var fetchedGames: [Game] = try await supabase
                .from("games")
                .select()
                .gte("game_date", value: DateFormatter.supabaseDateFormatter.string(from: Date()))
                .order("game_date", ascending: true)
                .order("start_time", ascending: true)
                .execute()
                .value
            
            // Filter out private games unless user is the creator
            // Also filter out games that have already passed
            fetchedGames = fetchedGames.filter { game in
                !game.hasPassed && (!game.isPrivate || game.createdBy == currentUserId)
            }
            
            // Fetch RSVP counts for each game
            for i in 0..<fetchedGames.count {
                let count = try await getRSVPCount(for: fetchedGames[i].id)
                fetchedGames[i].rsvpCount = count
            }
            
            games = fetchedGames
        } catch {
            errorMessage = "Failed to load games: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func createGame(_ newGame: NewGame) async throws -> Game {
        // 1. Create the game record
        let game: Game = try await supabase
            .from("games")
            .insert(newGame)
            .select()
            .single()
            .execute()
            .value
        
        // 2. Auto-add host as the first participant
        try await addParticipant(gameId: game.id, userId: newGame.createdBy)
        
        // 3. Create a group chat for the game
        try await createGroupChatForGame(game: game, creatorId: newGame.createdBy)
        
        // 4. Refresh games list (pass creator's userId to preserve private game visibility)
        await fetchGames(currentUserId: newGame.createdBy)
        
        return game
    }
    
    /// Creates a group chat for a game and adds the creator as the first member
    private func createGroupChatForGame(game: Game, creatorId: UUID) async throws {
        // Create group chat with game venue name as the chat name
        let groupChat: GroupChat = try await supabase
            .from("group_chats")
            .insert([
                "game_id": game.id.uuidString,
                "name": game.venueName
            ])
            .select()
            .single()
            .execute()
            .value
        
        // Add creator as first member
        try await addMemberToGroupChat(groupChatId: groupChat.id, userId: creatorId)
    }
    
    /// Adds a user to a game's group chat
    private func addMemberToGroupChat(groupChatId: UUID, userId: UUID) async throws {
        try await supabase
            .from("group_chat_members")
            .insert([
                "group_chat_id": groupChatId.uuidString,
                "user_id": userId.uuidString
            ])
            .execute()
    }
    
    /// Gets the group chat for a game
    private func getGroupChatForGame(gameId: UUID) async throws -> GroupChat? {
        let groupChat: GroupChat? = try? await supabase
            .from("group_chats")
            .select()
            .eq("game_id", value: gameId.uuidString)
            .single()
            .execute()
            .value
        
        return groupChat
    }
    
    /// Removes a user from a game's group chat
    private func removeMemberFromGroupChat(groupChatId: UUID, userId: UUID) async throws {
        try await supabase
            .from("group_chat_members")
            .delete()
            .eq("group_chat_id", value: groupChatId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
    }
    
    /// Adds a participant to a game without triggering a full refresh
    private func addParticipant(gameId: UUID, userId: UUID) async throws {
        try await supabase
            .from("rsvps")
            .insert(["game_id": gameId.uuidString, "user_id": userId.uuidString])
            .execute()
    }
    
    func getRSVPCount(for gameId: UUID) async throws -> Int {
        let rsvps: [RSVP] = try await supabase
            .from("rsvps")
            .select()
            .eq("game_id", value: gameId.uuidString)
            .execute()
            .value
        
        return rsvps.count
    }
    
    func getRSVPs(for gameId: UUID) async throws -> [RSVPWithProfile] {
        let rsvps: [RSVPWithProfile] = try await supabase
            .from("rsvps")
            .select("*, profiles(*)")
            .eq("game_id", value: gameId.uuidString)
            .execute()
            .value
        
        return rsvps
    }
    
    func hasUserRSVPed(gameId: UUID, userId: UUID) async throws -> Bool {
        let rsvps: [RSVP] = try await supabase
            .from("rsvps")
            .select()
            .eq("game_id", value: gameId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        return !rsvps.isEmpty
    }
    
    func rsvpToGame(gameId: UUID, userId: UUID) async throws {
        try await supabase
            .from("rsvps")
            .insert(["game_id": gameId.uuidString, "user_id": userId.uuidString])
            .execute()
        
        // Add user to the game's group chat
        if let groupChat = try? await getGroupChatForGame(gameId: gameId) {
            try? await addMemberToGroupChat(groupChatId: groupChat.id, userId: userId)
        }
        
        await fetchGames(currentUserId: userId)
    }
    
    func cancelRSVP(gameId: UUID, userId: UUID) async throws {
        try await supabase
            .from("rsvps")
            .delete()
            .eq("game_id", value: gameId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
        
        // Remove user from the game's group chat
        if let groupChat = try? await getGroupChatForGame(gameId: gameId) {
            try? await removeMemberFromGroupChat(groupChatId: groupChat.id, userId: userId)
        }
        
        await fetchGames(currentUserId: userId)
    }
    
    // MARK: - Game Management (Creator Only)
    
    func updateGame(gameId: UUID, updates: GameUpdate, userId: UUID) async throws {
        print("📝 [GameService] Updating game \(gameId)")
        print("   Updates: \(updates)")
        
        try await supabase
            .from("games")
            .update(updates)
            .eq("id", value: gameId.uuidString)
            .execute()
        
        print("✅ [GameService] Game updated successfully")
        await fetchGames(currentUserId: userId)
    }
    
    func deleteGame(gameId: UUID, userId: UUID) async throws {
        // Delete the game - RSVPs, group_chats, and group_chat_members will be automatically 
        // deleted via CASCADE in the database
        try await supabase
            .from("games")
            .delete()
            .eq("id", value: gameId.uuidString)
            .execute()
        
        print("✅ [GameService] Game deleted successfully: \(gameId)")
        
        await fetchGames(currentUserId: userId)
        
        // Notify other views to refresh
        NotificationCenter.default.post(name: .gameDeleted, object: nil)
    }
    
    func fetchUserCreatedGames(userId: UUID) async throws -> [Game] {
        var fetchedGames: [Game] = try await supabase
            .from("games")
            .select()
            .eq("created_by", value: userId.uuidString)
            .gte("game_date", value: DateFormatter.supabaseDateFormatter.string(from: Date()))
            .order("game_date", ascending: true)
            .order("start_time", ascending: true)
            .execute()
            .value
        
        // Filter out games that have already passed
        fetchedGames = fetchedGames.filter { !$0.hasPassed }
        
        // Fetch RSVP counts for each game
        for i in 0..<fetchedGames.count {
            let count = try await getRSVPCount(for: fetchedGames[i].id)
            fetchedGames[i].rsvpCount = count
        }
        
        return fetchedGames
    }
    
    // MARK: - My Games (Active & History)
    
    /// Fetches all active games the user is participating in (hosting or attending)
    /// Active games are games with game_date >= today
    func fetchActiveGames(userId: UUID) async throws -> [Game] {
        let todayString = DateFormatter.supabaseDateFormatter.string(from: Date())
        
        // Get game IDs where user has RSVP'd
        let userRSVPs: [RSVP] = try await supabase
            .from("rsvps")
            .select()
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        let rsvpGameIds = userRSVPs.map { $0.gameId }
        
        // Fetch all games user is participating in (either created or RSVP'd)
        var fetchedGames: [Game] = try await supabase
            .from("games")
            .select()
            .gte("game_date", value: todayString)
            .order("game_date", ascending: true)
            .order("start_time", ascending: true)
            .execute()
            .value
        
        // Filter to only games user created or RSVP'd to
        // Also filter out games that have already passed
        fetchedGames = fetchedGames.filter { game in
            !game.hasPassed && (game.createdBy == userId || rsvpGameIds.contains(game.id))
        }
        
        // Fetch RSVP counts for each game
        for i in 0..<fetchedGames.count {
            let count = try await getRSVPCount(for: fetchedGames[i].id)
            fetchedGames[i].rsvpCount = count
        }
        
        return fetchedGames
    }
    
    /// Fetches game history - past games the user hosted or attended
    /// History games are games with game_date < today
    func fetchGameHistory(userId: UUID) async throws -> [Game] {
        let todayString = DateFormatter.supabaseDateFormatter.string(from: Date())
        
        // Get game IDs where user has RSVP'd
        let userRSVPs: [RSVP] = try await supabase
            .from("rsvps")
            .select()
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        let rsvpGameIds = userRSVPs.map { $0.gameId }
        
        // Fetch all past games
        var fetchedGames: [Game] = try await supabase
            .from("games")
            .select()
            .lt("game_date", value: todayString)
            .order("game_date", ascending: false)
            .order("start_time", ascending: false)
            .execute()
            .value
        
        // Filter to only games user created or RSVP'd to
        fetchedGames = fetchedGames.filter { game in
            game.createdBy == userId || rsvpGameIds.contains(game.id)
        }
        
        // Fetch RSVP counts for each game
        for i in 0..<fetchedGames.count {
            let count = try await getRSVPCount(for: fetchedGames[i].id)
            fetchedGames[i].rsvpCount = count
        }
        
        return fetchedGames
    }
}

extension DateFormatter {
    nonisolated(unsafe) static let supabaseDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    nonisolated(unsafe) static let supabaseTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter
    }()
}

