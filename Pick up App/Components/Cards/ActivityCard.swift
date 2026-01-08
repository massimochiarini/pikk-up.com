//
//  ActivityCard.swift
//  Sports App 1
//

import SwiftUI

struct ActivityCard: View {
    let activity: ActivityItem
    var onTap: (() -> Void)? = nil
    
    // Updated color palette using brand blue
    private var textDark: Color { AppTheme.textPrimary }                   // Dark gray/black for title
    private var textSubtle: Color { AppTheme.textPrimary.opacity(0.5) }    // Less opaque for subtitle
    private let iconColor = AppTheme.brandBlue                             // Blue for icon
    private let borderColor = AppTheme.brandBlue.opacity(0.2)
    
    // Brand blue with light opacity for background
    private var cardBackground: Color {
        AppTheme.brandBlue.opacity(0.08)
    }
    
    private var iconBackground: Color {
        AppTheme.brandBlue.opacity(0.15)
    }
    
    var body: some View {
        Button(action: { onTap?() }) {
            HStack(spacing: 14) {
                // Icon - darker gray
                ZStack {
                    Circle()
                        .fill(iconBackground)
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: activity.icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(iconColor)
                }
                
                // Content - darker gray text
                VStack(alignment: .leading, spacing: 4) {
                    Text(activity.title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(textDark)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    
                    if let subtitle = activity.subtitle {
                        Text(subtitle)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(textSubtle)
                    }
                }
                
                Spacer()
                
                // Arrow if tappable
                if onTap != nil {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(iconColor)
                }
            }
            .padding(16)
            .background(cardBackground)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(borderColor, lineWidth: 1)
            )
            .shadow(color: AppTheme.brandBlue.opacity(0.1), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(onTap == nil)
    }
}

// Stats activity card (e.g., "3 games nearby")
struct StatsActivityCard: View {
    let icon: String
    let count: Int
    let title: String
    let subtitle: String?
    var color: Color = AppTheme.teal
    var onTap: (() -> Void)? = nil
    
    var body: some View {
        Button(action: { onTap?() }) {
            BaseCard(
                backgroundColor: color.opacity(0.08),
                padding: 16,
                shadowRadius: 2
            ) {
                HStack(spacing: 14) {
                    // Count badge
                    ZStack {
                        Circle()
                            .fill(color)
                            .frame(width: 48, height: 48)
                        
                        Text("\(count)")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        if let subtitle = subtitle {
                            Text(subtitle)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(color)
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(color.opacity(0.5))
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(onTap == nil)
    }
}

// Welcome/promotional card
struct PromoCard: View {
    let title: String
    let subtitle: String
    let buttonText: String
    var onButtonTap: () -> Void
    
    var body: some View {
        BaseCard(backgroundColor: .black, padding: 20) {
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundColor(.white.opacity(0.85))
                    .fixedSize(horizontal: false, vertical: true)
                
                Button(action: onButtonTap) {
                    Text(buttonText)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(AppTheme.textPrimary)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(AppTheme.background)
                        .cornerRadius(AppTheme.cornerRadiusPill)
                }
                .padding(.top, 4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// Empty state card
struct EmptyStateCard: View {
    let icon: String
    let title: String
    let subtitle: String
    var buttonText: String? = nil
    var onButtonTap: (() -> Void)? = nil
    
    var body: some View {
        BaseCard(backgroundColor: AppTheme.cream, padding: 32, showBorder: true) {
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(AppTheme.neonGreen.opacity(0.15))
                        .frame(width: 80, height: 80)
                    
                    Image(systemName: icon)
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(AppTheme.neonGreenDark)
                }
                
                VStack(spacing: 8) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Text(subtitle)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                        .multilineTextAlignment(.center)
                }
                
                if let buttonText = buttonText, let onButtonTap = onButtonTap {
                    Button(action: onButtonTap) {
                        Text(buttonText)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(AppTheme.onPrimary)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(AppTheme.neonGreen)
                            .cornerRadius(AppTheme.cornerRadiusPill)
                            .shadow(color: AppTheme.neonGlow, radius: 6, x: 0, y: 3)
                    }
                    .padding(.top, 8)
                }
            }
        }
    }
}

#Preview {
    ScrollView {
        VStack(spacing: 16) {
            ActivityCard(
                activity: ActivityItem.nearbyGamesActivity(count: 5),
                onTap: {}
            )
            
            ActivityCard(
                activity: ActivityItem.playersLookingActivity(count: 3),
                onTap: {}
            )
            
            ActivityCard(
                activity: ActivityItem.joinedGameActivity(gameName: "Pickleball at Flamingo Park", gameId: UUID()),
                onTap: {}
            )
            
            StatsActivityCard(
                icon: "mappin.circle.fill",
                count: 12,
                title: "Games this week",
                subtitle: "Check them out!",
                onTap: {}
            )
            
            PromoCard(
                title: "Ready to play?",
                subtitle: "Create a post and find someone to play with right now.",
                buttonText: "Create Post"
            ) {}
            
            EmptyStateCard(
                icon: "sportscourt.fill",
                title: "No games yet",
                subtitle: "Be the first to create a game in your area!",
                buttonText: "Create Game",
                onButtonTap: {}
            )
        }
        .padding()
    }
    .background(AppTheme.background)
}
