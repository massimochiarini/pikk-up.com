//
//  PlayerLookingCard.swift
//  Sports App 1
//

import SwiftUI

struct PlayerLookingCard: View {
    let post: PostWithProfile
    var connectionContext: ConnectionContext? = nil
    var onMessageTapped: () -> Void
    var onProfileTapped: () -> Void
    var distanceText: String? = nil
    
    var body: some View {
        CardWithContext(context: connectionContext) {
            BaseCard(gradient: AppTheme.playerCardGradient, padding: 20) {
                VStack(alignment: .leading, spacing: 16) {
                    // Top row: Avatar and actions
                    HStack(alignment: .top) {
                        // Avatar and user info
                        HStack(spacing: 12) {
                            AvatarView(
                                url: post.profiles?.avatarUrl,
                                initials: post.profiles?.initials ?? "?",
                                size: 56,
                                borderColor: AppTheme.navy,
                                borderWidth: 3
                            )
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(post.profiles?.fullName ?? "Unknown")
                                    .font(.system(size: 17, weight: .bold))
                                    .foregroundColor(AppTheme.onPrimary)
                                
                                if let username = post.profiles?.username {
                                    Text("@\(username)")
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(AppTheme.onPrimary.opacity(0.8))
                                }
                            }
                        }
                        
                        Spacer()
                        
                        // Action buttons
                        HStack(spacing: 8) {
                            CircleIconButton(
                                icon: "message.fill",
                                action: onMessageTapped,
                                backgroundColor: AppTheme.navy.opacity(0.15),
                                iconColor: AppTheme.navy
                            )
                            
                            CircleIconButton(
                                icon: "person.fill",
                                action: onProfileTapped,
                                backgroundColor: AppTheme.navy.opacity(0.15),
                                iconColor: AppTheme.navy
                            )
                        }
                    }
                    
                    // Headline
                    Text(post.headline)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(AppTheme.onPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                    
                    // Meta info row
                    HStack(spacing: 16) {
                        // Sport
                        HStack(spacing: 6) {
                            Image(systemName: post.sportType.icon)
                                .font(.system(size: 14, weight: .semibold))
                            Text(post.sportType.displayName)
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(AppTheme.onPrimary.opacity(0.85))
                        
                        // Time window
                        if let timeWindow = post.timeWindow {
                            HStack(spacing: 6) {
                                Image(systemName: "clock.fill")
                                    .font(.system(size: 12, weight: .semibold))
                                Text(timeWindow)
                                    .font(.system(size: 14, weight: .semibold))
                            }
                            .foregroundColor(AppTheme.onPrimary.opacity(0.85))
                        }
                        
                        // Distance
                        if let distance = distanceText {
                            HStack(spacing: 6) {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 12, weight: .semibold))
                                Text(distance)
                                    .font(.system(size: 14, weight: .semibold))
                            }
                            .foregroundColor(AppTheme.onPrimary.opacity(0.85))
                        }
                    }
                    
                    // Bottom row: time posted
                    HStack {
                        Text(post.timeAgo)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(AppTheme.onPrimary.opacity(0.7))
                        
                        Spacer()
                        
                        // Let's TeamUp button
                        Button(action: onMessageTapped) {
                            Text("Let's TeamUp")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(AppTheme.navy)
                                .cornerRadius(AppTheme.cornerRadiusPill)
                        }
                    }
                }
            }
        }
    }
}

// Circle icon button used in player card
struct CircleIconButton: View {
    let icon: String
    let action: () -> Void
    var size: CGFloat = 36
    var backgroundColor: Color = .white.opacity(0.2)
    var iconColor: Color = .white
    
    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(backgroundColor)
                    .frame(width: size, height: size)
                
                Image(systemName: icon)
                    .font(.system(size: size * 0.4, weight: .semibold))
                    .foregroundColor(iconColor)
            }
        }
    }
}

// Compact version for smaller spaces
struct PlayerLookingCardCompact: View {
    let post: PostWithProfile
    var onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            BaseCard(gradient: AppTheme.playerCardGradient, padding: 14) {
                HStack(spacing: 12) {
                    AvatarView(
                        url: post.profiles?.avatarUrl,
                        initials: post.profiles?.initials ?? "?",
                        size: 44,
                        borderColor: .white,
                        borderWidth: 2
                    )
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(post.profiles?.firstName ?? "Someone")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text(post.headline)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white.opacity(0.9))
                            .lineLimit(1)
                    }
                    
                    Spacer()
                    
                    SportIcon(
                        sport: post.sportType,
                        size: 20,
                        foregroundColor: .white
                    )
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    let sampleProfile = Profile(
        id: UUID(),
        firstName: "Massimo",
        lastName: "Chiarini",
        username: "massimo",
        bio: "Tennis enthusiast",
        avatarUrl: nil,
        favoriteSports: ["tennis", "pickleball"],
        locationLat: nil,
        locationLng: nil,
        visibilityRadiusMiles: 25,
        onboardingCompleted: true,
        createdAt: Date()
    )
    
    let samplePost = PostWithProfile(
        id: UUID(),
        userId: UUID(),
        sport: "tennis",
        headline: "Looking for Tennis Partner for tonight!",
        timeWindow: "After 6pm",
        expiresAt: nil,
        isActive: true,
        locationLat: nil,
        locationLng: nil,
        createdAt: Date().addingTimeInterval(-3600),
        profiles: sampleProfile
    )
    
    ScrollView {
        VStack(spacing: 16) {
            PlayerLookingCard(
                post: samplePost,
                onMessageTapped: {},
                onProfileTapped: {},
                distanceText: "1.2 mi"
            )
            
            PlayerLookingCard(
                post: samplePost,
                connectionContext: ConnectionContext(type: .playedTogether, userName: "Massimo"),
                onMessageTapped: {},
                onProfileTapped: {},
                distanceText: "0.5 mi"
            )
            
            PlayerLookingCardCompact(post: samplePost, onTap: {})
        }
        .padding()
    }
    .background(AppTheme.background)
}

