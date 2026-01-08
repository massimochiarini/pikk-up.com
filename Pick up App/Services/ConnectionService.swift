//
//  ConnectionService.swift
//  Sports App 1
//

import Foundation
import Combine
import Supabase

@MainActor
class ConnectionService: ObservableObject {
    @Published var connections: [ConnectionWithProfile] = []
    @Published var isLoading = false
    
    private let supabase = SupabaseManager.shared.client
    
    // MARK: - Fetch Connections
    
    func fetchConnections(userId: UUID) async {
        isLoading = true
        
        do {
            let fetchedConnections: [Connection] = try await supabase
                .from("connections")
                .select()
                .eq("user_id", value: userId.uuidString)
                .order("created_at", ascending: false)
                .execute()
                .value
            
            // Fetch profiles for connected users
            var connectionsWithProfiles: [ConnectionWithProfile] = []
            
            for connection in fetchedConnections {
                if let profile: Profile = try? await supabase
                    .from("profiles")
                    .select()
                    .eq("id", value: connection.connectedUserId.uuidString)
                    .single()
                    .execute()
                    .value {
                    
                    connectionsWithProfiles.append(
                        ConnectionWithProfile(connection: connection, profile: profile)
                    )
                }
            }
            
            connections = connectionsWithProfiles
        } catch {
            print("Error fetching connections: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Record Connection
    
    func recordConnection(userId: UUID, connectedUserId: UUID, type: ConnectionType) async throws {
        // Don't create self-connections
        guard userId != connectedUserId else { return }
        
        let newConnection = NewConnection(
            userId: userId,
            connectedUserId: connectedUserId,
            connectionType: type.rawValue
        )
        
        // Use upsert to avoid duplicates
        try await supabase
            .from("connections")
            .upsert(newConnection, onConflict: "user_id,connected_user_id,connection_type")
            .execute()
    }
    
    // Record bidirectional connection (both users get the connection)
    func recordMutualConnection(user1: UUID, user2: UUID, type: ConnectionType) async throws {
        try await recordConnection(userId: user1, connectedUserId: user2, type: type)
        try await recordConnection(userId: user2, connectedUserId: user1, type: type)
    }
    
    // MARK: - Get Connection Type
    
    func getConnectionType(userId: UUID, otherUserId: UUID) async -> ConnectionType? {
        do {
            let connections: [Connection] = try await supabase
                .from("connections")
                .select()
                .eq("user_id", value: userId.uuidString)
                .eq("connected_user_id", value: otherUserId.uuidString)
                .execute()
                .value
            
            // Return strongest connection type
            // Priority: friend > played_together > messaged
            if connections.contains(where: { $0.connectionType == ConnectionType.friend.rawValue }) {
                return .friend
            }
            if connections.contains(where: { $0.connectionType == ConnectionType.playedTogether.rawValue }) {
                return .playedTogether
            }
            if connections.contains(where: { $0.connectionType == ConnectionType.messaged.rawValue }) {
                return .messaged
            }
            
            return nil
        } catch {
            print("Error checking connection: \(error)")
            return nil
        }
    }
    
    // Check if users have any connection
    func hasConnection(userId: UUID, otherUserId: UUID) async -> Bool {
        return await getConnectionType(userId: userId, otherUserId: otherUserId) != nil
    }
    
    // MARK: - Record Game Connection
    
    func recordGameConnection(gameId: UUID, participants: [UUID]) async {
        // Create played_together connections between all participants
        for i in 0..<participants.count {
            for j in (i+1)..<participants.count {
                try? await recordMutualConnection(
                    user1: participants[i],
                    user2: participants[j],
                    type: .playedTogether
                )
            }
        }
    }
    
    // MARK: - Get Connection Context
    
    func getConnectionContext(userId: UUID, otherUserId: UUID, otherUserName: String?) async -> ConnectionContext? {
        if let type = await getConnectionType(userId: userId, otherUserId: otherUserId) {
            return ConnectionContext(type: type, userName: otherUserName)
        }
        return nil
    }
    
    // MARK: - Delete Connection
    
    func removeConnection(userId: UUID, connectedUserId: UUID, type: ConnectionType) async throws {
        try await supabase
            .from("connections")
            .delete()
            .eq("user_id", value: userId.uuidString)
            .eq("connected_user_id", value: connectedUserId.uuidString)
            .eq("connection_type", value: type.rawValue)
            .execute()
    }
    
    // MARK: - Fetch Connected User IDs
    
    func fetchConnectedUserIds(userId: UUID) async -> Set<UUID> {
        do {
            let connections: [Connection] = try await supabase
                .from("connections")
                .select()
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            
            return Set(connections.map { $0.connectedUserId })
        } catch {
            print("Error fetching connected user IDs: \(error)")
            return []
        }
    }
}

