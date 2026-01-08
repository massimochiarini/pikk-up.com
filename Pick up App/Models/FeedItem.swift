//
//  FeedItem.swift
//  Sports App 1
//

import Foundation

enum FeedItemType: Sendable {
    case playerPost(PostWithProfile)
    case game(Game)
    case activity(ActivityItem)
}

struct FeedItem: Identifiable, Sendable, Hashable {
    let id: String
    let type: FeedItemType
    let timestamp: Date
    let connectionContext: ConnectionContext?
    
    var sortDate: Date { timestamp }
    
    init(post: PostWithProfile, connectionContext: ConnectionContext? = nil) {
        self.id = "post-\(post.id.uuidString)"
        self.type = .playerPost(post)
        self.timestamp = post.createdAt
        self.connectionContext = connectionContext
    }
    
    init(game: Game, connectionContext: ConnectionContext? = nil) {
        self.id = "game-\(game.id.uuidString)"
        self.type = .game(game)
        self.timestamp = game.createdAt
        self.connectionContext = connectionContext
    }
    
    init(activity: ActivityItem) {
        self.id = "activity-\(activity.id)"
        self.type = .activity(activity)
        self.timestamp = activity.timestamp
        self.connectionContext = nil
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: FeedItem, rhs: FeedItem) -> Bool {
        lhs.id == rhs.id
    }
}

// Connection context for relationship-aware cards
struct ConnectionContext: Sendable, Hashable {
    let type: ConnectionType
    let userName: String?
    
    var displayText: String {
        switch type {
        case .playedTogether:
            if let name = userName {
                return "You've played with \(name) before"
            }
            return "Played together before"
        case .friend:
            if let name = userName {
                return "\(name) is your friend"
            }
            return "Friend"
        case .messaged:
            if let name = userName {
                return "You've messaged \(name)"
            }
            return "Messaged before"
        }
    }
}

// Activity/notification items
struct ActivityItem: Identifiable, Sendable, Hashable {
    let id: String
    let activityType: ActivityType
    let title: String
    let subtitle: String?
    let timestamp: Date
    let relatedId: UUID?
    
    enum ActivityType: Sendable, Hashable {
        case joinedGame
        case nearbyGames(count: Int)
        case playersLooking(count: Int)
        case newConnection
        case gameReminder
    }
    
    var icon: String {
        switch activityType {
        case .joinedGame: return "checkmark.circle.fill"
        case .nearbyGames: return "mappin.circle.fill"
        case .playersLooking: return "person.2.wave.2.fill"
        case .newConnection: return "person.badge.plus"
        case .gameReminder: return "bell.fill"
        }
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: ActivityItem, rhs: ActivityItem) -> Bool {
        lhs.id == rhs.id
    }
}

// Helper to generate activity items
extension ActivityItem {
    static func nearbyGamesActivity(count: Int) -> ActivityItem {
        let gameWord = count == 1 ? "game" : "games"
        let checkWord = count == 1 ? "Check it out!" : "Check them out!"
        return ActivityItem(
            id: "nearby-games-\(Date().timeIntervalSince1970)",
            activityType: .nearbyGames(count: count),
            title: "\(count) \(gameWord) happening nearby today",
            subtitle: checkWord,
            timestamp: Date(),
            relatedId: nil
        )
    }
    
    static func playersLookingActivity(count: Int) -> ActivityItem {
        let playerWord = count == 1 ? "player" : "players"
        return ActivityItem(
            id: "players-looking-\(Date().timeIntervalSince1970)",
            activityType: .playersLooking(count: count),
            title: "\(count) \(playerWord) looking to play right now",
            subtitle: "Who's in?",
            timestamp: Date(),
            relatedId: nil
        )
    }
    
    static func joinedGameActivity(gameName: String, gameId: UUID) -> ActivityItem {
        ActivityItem(
            id: "joined-\(gameId.uuidString)",
            activityType: .joinedGame,
            title: "You joined \(gameName)",
            subtitle: "Get ready to play!",
            timestamp: Date(),
            relatedId: gameId
        )
    }
}

