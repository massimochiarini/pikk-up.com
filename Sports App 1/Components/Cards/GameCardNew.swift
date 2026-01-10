//
//  Sports App 1
//
//  Redesigned game card for the new feed
//

import SwiftUI
import MapKit

struct GameCardNew: View {
    let game: Game
    var connectionContext: ConnectionContext? = nil
    var participants: [(url: String?, initials: String)] = []
    var onJoinTapped: () -> Void
    var onDetailsTapped: () -> Void
    var isJoined: Bool = false
    var distanceText: String? = nil
    
    private var sport: Sport {
        Sport(rawValue: game.sport) ?? .other
    }
    
    // Gray color palette - using AppTheme textPrimary with opacity
    private var textDark: Color { AppTheme.textPrimary }
    private var textMedium: Color { AppTheme.textPrimary.opacity(0.85) }  // ✅ Darker for better readability
    private var textLight: Color { AppTheme.textPrimary.opacity(0.65) }   // ✅ Darker for better readability
    private var borderColor: Color { AppTheme.textPrimary.opacity(0.15) }
    private var badgeBg: Color { AppTheme.textPrimary.opacity(0.06) }
    
    // Green colors for cost badge
    private let costGreen = Color(hex: "22C55E")           // Green text
    private let costGreenBg = Color(hex: "22C55E").opacity(0.12) // Light green background
    
    var body: some View {
        Button(action: onDetailsTapped) {
            VStack(alignment: .leading, spacing: 0) {
                // Map snapshot at the top
                MapSnapshotView(
                    address: game.address,
                    height: 120,
                    cornerRadius: 12
                )
                
                VStack(alignment: .leading, spacing: 14) {
                    // Top row: Title on left, badges on right
                    HStack(alignment: .top) {
                        // Game title - bigger and darker
                        Text(game.venueName)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(textDark)
                        
                        Spacer()
                        
                        // Badges row
                        HStack(spacing: 6) {
                            // Skill level badge (if set)
                            if let skillLevel = game.skillLevel {
                                SkillLevelBadge(level: skillLevel)
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
                    
                    // Bottom row: Player count only (removed Join button)
                    HStack(spacing: 6) {
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 13))
                        Text("\(game.rsvpCount)/\(game.maxPlayers) players")
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
        .buttonStyle(PlainButtonStyle())
    }
}

// Skill Level Badge Component
struct SkillLevelBadge: View {
    let level: SkillLevel
    var compact: Bool = false
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: level.icon)
                .font(.system(size: compact ? 10 : 11, weight: .bold))
            
            if !compact {
                Text(level.shortName)
                    .font(.system(size: 11, weight: .bold))
            }
        }
        .foregroundColor(level.color)
        .padding(.horizontal, compact ? 6 : 8)
        .padding(.vertical, 5)
        .background(level.color.opacity(0.12))
        .cornerRadius(8)
    }
}

// Compact game card for lists
struct GameCardCompact: View {
    let game: Game
    var onTap: () -> Void
    var isJoined: Bool = false
    
    private var sport: Sport {
        Sport(rawValue: game.sport) ?? .other
    }
    
    var body: some View {
        Button(action: onTap) {
            BaseCard(backgroundColor: AppTheme.cardBackground, padding: 14, showBorder: true) {
                HStack(spacing: 14) {
                    // Left: Sport icon (dynamic)
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(sport.color.opacity(0.1))
                            .frame(width: 56, height: 56)
                        
                        Image(systemName: sport.icon)
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundColor(sport.color)
                    }
                    
                    // Middle: Game info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(game.venueName)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                            .lineLimit(1)
                        
                        Text("\(game.formattedDate) · \(game.formattedTime)")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(AppTheme.textSecondary)
                        
                        HStack(spacing: 8) {
                            HStack(spacing: 4) {
                                Image(systemName: "person.2.fill")
                                    .font(.system(size: 11))
                                Text("\(game.rsvpCount)/\(game.maxPlayers)")
                                    .font(.system(size: 12, weight: .medium))
                            }
                            .foregroundColor(AppTheme.teal)
                            
                            if let skillLevel = game.skillLevel {
                                SkillLevelBadge(level: skillLevel, compact: true)
                            }
                            
                            Text(game.costDisplay)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(game.isFree ? AppTheme.success : AppTheme.textSecondary)
                        }
                    }
                    
                    Spacer()
                    
                    // Right: Status/Join indicator
                    if isJoined {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(AppTheme.success)
                    } else {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Mini game card for profile grids
struct GameCardMini: View {
    let game: Game
    var onTap: () -> Void
    
    private var sport: Sport {
        Sport(rawValue: game.sport) ?? .other
    }
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                // Icon background (dynamic sport icon)
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(AppTheme.gameCardGradient)
                        .frame(height: 80)
                    
                    Image(systemName: sport.icon)
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundColor(.white.opacity(0.9))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(game.venueName)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                        .lineLimit(1)
                    
                    Text(game.formattedDate)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    let sampleGame = Game(
        id: UUID(),
        createdBy: UUID(),
        venueName: "Flamingo Park Courts",
        address: "1200 Meridian Ave, Miami Beach, FL",
        gameDate: Date(),
        startTime: "09:00:00",
        maxPlayers: 8,
        costCents: 0,
        imageUrl: nil,
        isPrivate: false,
        createdAt: Date()
    )
    
    ScrollView {
        VStack(spacing: 16) {
            GameCardNew(
                game: sampleGame,
                participants: [(nil, "JD"), (nil, "AB"), (nil, "CD")],
                onJoinTapped: {},
                onDetailsTapped: {},
                distanceText: "2.1 mi"
            )
            
            GameCardNew(
                game: sampleGame,
                connectionContext: ConnectionContext(type: .friend, userName: "Alex"),
                participants: [],
                onJoinTapped: {},
                onDetailsTapped: {},
                isJoined: true,
                distanceText: "0.8 mi"
            )
            
            GameCardCompact(game: sampleGame, onTap: {})
            
            GameCardCompact(game: sampleGame, onTap: {}, isJoined: true)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                GameCardMini(game: sampleGame, onTap: {})
                GameCardMini(game: sampleGame, onTap: {})
            }
        }
        .padding()
    }
    .background(AppTheme.background)
}

// Extension for Game to work with new card without breaking existing code
extension Game {
    init(
        id: UUID,
        createdBy: UUID,
        sport: String = "pickleball",
        venueName: String,
        address: String,
        gameDate: Date,
        startTime: String,
        maxPlayers: Int,
        costCents: Int,
        description: String? = nil,
        imageUrl: String?,
        isPrivate: Bool,
        skillLevel: SkillLevel? = nil,
        createdAt: Date
    ) {
        self.init(from: MockDecoder(
            id: id,
            createdBy: createdBy,
            sport: sport,
            venueName: venueName,
            address: address,
            gameDate: gameDate,
            startTime: startTime,
            maxPlayers: maxPlayers,
            costCents: costCents,
            description: description,
            imageUrl: imageUrl,
            isPrivate: isPrivate,
            skillLevel: skillLevel,
            createdAt: createdAt
        ))
    }
    
    private init(from mock: MockDecoder) {
        self.id = mock.id
        self.createdBy = mock.createdBy
        self.sport = mock.sport
        self.venueName = mock.venueName
        self.address = mock.address
        self.gameDate = mock.gameDate
        self.startTime = mock.startTime
        self.maxPlayers = mock.maxPlayers
        self.costCents = mock.costCents
        self.description = mock.description
        self.imageUrl = mock.imageUrl
        self.isPrivate = mock.isPrivate
        self.skillLevel = mock.skillLevel
        self.createdAt = mock.createdAt
        self.rsvpCount = 3
    }
    
    private struct MockDecoder {
        let id: UUID
        let createdBy: UUID
        let sport: String
        let venueName: String
        let address: String
        let gameDate: Date
        let startTime: String
        let maxPlayers: Int
        let costCents: Int
        let description: String?
        let imageUrl: String?
        let isPrivate: Bool
        let skillLevel: SkillLevel?
        let createdAt: Date
    }
}
