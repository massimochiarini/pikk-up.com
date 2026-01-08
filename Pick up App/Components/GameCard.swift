//
//  GameCard.swift
//  PickleballApp
//

import SwiftUI

struct GameCard: View {
    let game: Game
    let onJoinTapped: () -> Void
    var isJoined: Bool = false
    
    // Pickleball images from Unsplash
    private let pickleballImages = [
        "https://images.unsplash.com/photo-1648809546822-6d0c3e646894?w=400&q=80",
        "https://images.unsplash.com/photo-1677764697935-93e1c0728139?w=400&q=80",
        "https://images.unsplash.com/photo-1676530557209-72d1ae75f4fc?w=400&q=80",
        "https://images.unsplash.com/photo-1709702880949-31b5ec6ea966?w=400&q=80"
    ]
    
    private var imageURL: String {
        // Use custom image if available, otherwise use default pickleball images
        if let customImage = game.imageUrl, !customImage.isEmpty {
            return customImage
        }
        // Use game ID hash to consistently pick the same image for each game
        let index = abs(game.id.hashValue) % pickleballImages.count
        return pickleballImages[index]
    }
    
    private var displayTitle: String {
        // Use custom title if available, otherwise use venue name
        return game.customTitle ?? game.venueName
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // Game Details - Left side
            VStack(alignment: .leading, spacing: 6) {
                // Event Title (custom title or venue name)
                Text(displayTitle)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                    .lineLimit(1)
                
                // Location
                Text(game.shortAddress)
                    .font(.system(size: 15))
                    .foregroundColor(AppTheme.textSecondary)
                    .lineLimit(1)
                
                // Date and Time
                Text("\(game.formattedDate) · \(game.formattedTime)")
                    .font(.system(size: 14))
                    .foregroundColor(AppTheme.textSecondary)
                
                // Players info with star-like indicator
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "2E7D4C"))
                    Text(game.instructorId != nil ? "\(game.rsvpCount)/\(game.maxPlayers) attending" : "\(game.rsvpCount)/\(game.maxPlayers)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    if !game.isFree {
                        Text("·")
                            .foregroundColor(AppTheme.textSecondary)
                        Text(game.costDisplay)
                            .font(.system(size: 14))
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
                .padding(.top, 2)
                
                // Join Button
                Button(action: onJoinTapped) {
                    HStack(spacing: 6) {
                        Image(systemName: isJoined ? "checkmark.circle.fill" : "plus.circle.fill")
                            .font(.system(size: 14))
                        Text(isJoined ? "Joined" : "Join")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(isJoined ? Color(hex: "2E7D4C") : Color(hex: "2E7D4C"))
                    .cornerRadius(20)
                }
                .padding(.top, 8)
            }
            
            Spacer()
            
            // Image - Right side with real pickleball photo
            AsyncImage(url: URL(string: imageURL)) { phase in
                switch phase {
                case .empty:
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(hex: "E8F5E9"))
                        .overlay(
                            ProgressView()
                                .tint(Color(hex: "2E7D4C"))
                        )
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 88, height: 88)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                case .failure:
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "E8F5E9"), Color(hex: "C8E6C9")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .overlay(
                            Image(systemName: (Sport(rawValue: game.sport) ?? .other).icon)
                                .font(.system(size: 28))
                                .foregroundColor(Color(hex: "2E7D4C").opacity(0.6))
                        )
                @unknown default:
                    EmptyView()
                }
            }
            .frame(width: 88, height: 88)
        }
        .padding(16)
        .background(AppTheme.background)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(AppTheme.textPrimary.opacity(0.06), lineWidth: 1)
        )
        .shadow(color: AppTheme.textPrimary.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}

#Preview {
    let sampleGame = try! JSONDecoder().decode(Game.self, from: """
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "created_by": "550e8400-e29b-41d4-a716-446655440001",
        "venue_name": "Flamingo Park Courts",
        "address": "1200 Meridian Ave, Miami Beach, FL",
        "game_date": "2025-12-15",
        "start_time": "09:00:00",
        "max_players": 8,
        "cost_cents": 0,
        "image_url": null,
        "created_at": "2025-12-13T10:00:00Z"
    }
    """.data(using: .utf8)!)
    
    VStack(spacing: 12) {
        GameCard(game: sampleGame, onJoinTapped: {})
        GameCard(game: sampleGame, onJoinTapped: {}, isJoined: true)
    }
    .padding(20)
    .background(AppTheme.background)
}

