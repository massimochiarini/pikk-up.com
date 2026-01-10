//
//  FeedItem.swift
//  Pick Up Yoga
//
//  Feed item types for yoga class feed
//

import Foundation

enum FeedItemType: Sendable {
    case game(Game) // Yoga class
    case activity(ActivityItem)
}

struct FeedItem: Identifiable, Sendable, Hashable {
    let id: String
    let type: FeedItemType
    let timestamp: Date
    let connectionContext: ConnectionContext?
    
    var sortDate: Date { timestamp }
    
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
                return "You've attended \(name)'s class before"
            }
            return "Attended before"
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
        case joinedGame // Joined a class
        case nearbyGames(count: Int) // Nearby classes
        case newConnection
        case gameReminder // Class reminder
    }
    
    var icon: String {
        switch activityType {
        case .joinedGame: return "checkmark.circle.fill"
        case .nearbyGames: return "mappin.circle.fill"
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
        let classWord = count == 1 ? "class" : "classes"
        let checkWord = count == 1 ? "Check it out!" : "Check them out!"
        return ActivityItem(
            id: "nearby-games-\(Date().timeIntervalSince1970)",
            activityType: .nearbyGames(count: count),
            title: "\(count) \(classWord) happening nearby today",
            subtitle: checkWord,
            timestamp: Date(),
            relatedId: nil
        )
    }
    
    static func joinedGameActivity(gameName: String, gameId: UUID) -> ActivityItem {
        ActivityItem(
            id: "joined-\(gameId.uuidString)",
            activityType: .joinedGame,
            title: "You joined \(gameName)",
            subtitle: "See you in class!",
            timestamp: Date(),
            relatedId: gameId
        )
    }
}

