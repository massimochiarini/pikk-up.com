//
//  Theme.swift
//  Sports App 1
//
//  Brand colors for yoga app aesthetic
//  - Sophisticated grays and blacks for calm and focus
//  - Clean, minimal, zen aesthetic
//

import SwiftUI

struct AppTheme {
    // MARK: - Primary Brand Colors (Light Theme)
    static let background = Color.white                  // White background
    static let cardBackground = Color(hex: "F5F5F5")     // Light gray for cards
    static let neonGreen = Color(hex: "1F2937")          // Dark gray (was neon green)
    static let neonGreenDark = Color(hex: "111827")      // Darker gray (was darker neon)
    
    // MARK: - Text Colors (Dark on light)
    static let textPrimary = Color.black                             // Black primary text
    static let textSecondary = Color.black.opacity(0.6)              // 60% black
    static let textTertiary = Color.black.opacity(0.4)               // 40% black
    static let textOnNeon = Color.white                              // White on dark gray
    
    // MARK: - Legacy Navy (keep for compatibility but rarely used)
    static let navy = Color(hex: "0F1B2E")
    static let navyLight = Color(hex: "1A2B4A")
    
    // MARK: - Accent Colors
    static let skyBlue = Color(hex: "6B7280")            // Medium gray
    static let skyBlueLight = Color(hex: "9CA3AF")       // Light gray
    static let brandBlue = Color(hex: "374151")          // Dark gray
    
    // MARK: - Action Colors
    static let primary = neonGreen                       // Dark gray
    static let primaryDark = neonGreenDark              // Darker gray
    static let onPrimary = Color.white                   // White text on dark
    
    // MARK: - Legacy aliases
    static let teal = neonGreen
    static let tealLight = neonGreenDark
    static let coral = skyBlue
    static let coralLight = skyBlueLight
    static let cream = Color(hex: "F8F8F8")              // Light cream for subtle backgrounds
    static let mint = skyBlue
    static let backgroundDark = Color.white
    static let cardBackgroundDark = Color(hex: "F5F5F5")
    static let textOnDark = Color.black
    
    // MARK: - Borders and Dividers
    static let border = Color.black.opacity(0.15)
    static let divider = Color.black.opacity(0.08)
    
    // MARK: - Semantic Colors
    static let success = Color(hex: "00C853")        // Bright green success
    static let warning = Color(hex: "FFB300")        // Amber warning
    static let error = Color(hex: "FF3D57")          // Red error
    static let info = skyBlue                        // Info uses sky blue
    
    // MARK: - Card Gradients
    // Primary card - subtle gray gradient (main cards, CTAs)
    static let playerCardGradient = LinearGradient(
        colors: [Color(hex: "374151"), Color(hex: "1F2937")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Game card - dark gray gradient (primary action cards)
    static let gameCardGradient = LinearGradient(
        colors: [Color(hex: "1F2937"), Color(hex: "111827")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Secondary card - light gray gradient (secondary/info cards)
    static let navyCardGradient = LinearGradient(
        colors: [Color(hex: "F3F4F6"), Color(hex: "E5E7EB")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Premium/featured card - gray to lighter gray
    static let premiumCardGradient = LinearGradient(
        colors: [Color(hex: "6B7280"), Color(hex: "9CA3AF")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Activity card gradient
    static let activityCardGradient = LinearGradient(
        colors: [cream, Color.white],
        startPoint: .top,
        endPoint: .bottom
    )
    
    // Subtle gray gradient
    static let mintGradient = LinearGradient(
        colors: [Color(hex: "E5E7EB"), Color(hex: "F3F4F6")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Dark gray accent gradient (for CTAs and highlights)
    static let neonGradient = LinearGradient(
        colors: [Color(hex: "1F2937"), Color(hex: "111827")],
        startPoint: .leading,
        endPoint: .trailing
    )
    
    // MARK: - Shadows
    static let cardShadow = Color.black.opacity(0.1)
    static let buttonShadow = Color.black.opacity(0.15)
    static let tabBarShadow = Color.black.opacity(0.1)
    static let neonGlow = Color.black.opacity(0.2)       // Subtle shadow for buttons
    
    // MARK: - Corner Radii
    static let cornerRadiusSmall: CGFloat = 8
    static let cornerRadiusMedium: CGFloat = 12
    static let cornerRadiusLarge: CGFloat = 16
    static let cornerRadiusXL: CGFloat = 24
    static let cornerRadiusPill: CGFloat = 50
    
    // MARK: - Spacing
    static let spacingXS: CGFloat = 4
    static let spacingS: CGFloat = 8
    static let spacingM: CGFloat = 12
    static let spacingL: CGFloat = 16
    static let spacingXL: CGFloat = 24
    static let spacingXXL: CGFloat = 32
    
    // MARK: - Typography (Bold, confident, modern tech style)
    struct Typography {
        static let largeTitle = Font.system(size: 34, weight: .black, design: .default)
        static let title1 = Font.system(size: 28, weight: .bold, design: .default)
        static let title2 = Font.system(size: 22, weight: .bold, design: .default)
        static let title3 = Font.system(size: 20, weight: .semibold, design: .default)
        static let headline = Font.system(size: 17, weight: .bold, design: .default)
        static let body = Font.system(size: 17, weight: .regular, design: .default)
        static let callout = Font.system(size: 16, weight: .medium, design: .default)
        static let subheadline = Font.system(size: 15, weight: .medium, design: .default)
        static let footnote = Font.system(size: 13, weight: .medium, design: .default)
        static let caption1 = Font.system(size: 12, weight: .medium, design: .default)
        static let caption2 = Font.system(size: 11, weight: .medium, design: .default)
    }
}

// MARK: - View Extensions
extension View {
    func cardStyle(background: some ShapeStyle = AppTheme.cardBackground) -> some View {
        self
            .background(background)
            .cornerRadius(AppTheme.cornerRadiusLarge)
            .shadow(color: AppTheme.cardShadow, radius: 12, x: 0, y: 4)
    }
    
    func darkCardStyle() -> some View {
        self
            .background(AppTheme.cardBackground)
            .cornerRadius(AppTheme.cornerRadiusLarge)
            .shadow(color: AppTheme.cardShadow, radius: 12, x: 0, y: 6)
    }
    
    func pillStyle() -> some View {
        self
            .padding(.horizontal, AppTheme.spacingM)
            .padding(.vertical, AppTheme.spacingS)
            .background(AppTheme.neonGreen)
            .foregroundColor(.white)
            .cornerRadius(AppTheme.cornerRadiusPill)
            .shadow(color: AppTheme.neonGlow, radius: 4, x: 0, y: 2)
    }
    
    func navyPillStyle() -> some View {
        self
            .padding(.horizontal, AppTheme.spacingM)
            .padding(.vertical, AppTheme.spacingS)
            .background(AppTheme.cardBackground)
            .foregroundColor(.black)
            .cornerRadius(AppTheme.cornerRadiusPill)
    }
    
    func outlinePillStyle() -> some View {
        self
            .padding(.horizontal, AppTheme.spacingM)
            .padding(.vertical, AppTheme.spacingS)
            .background(Color.clear)
            .foregroundColor(.black)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusPill)
                    .stroke(Color.black.opacity(0.3), lineWidth: 2)
            )
    }
    
    func neonGlowEffect() -> some View {
        self
            .shadow(color: AppTheme.neonGlow, radius: 8, x: 0, y: 4)
            .shadow(color: AppTheme.neonGlow, radius: 16, x: 0, y: 8)
    }
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    var isEnabled: Bool = true
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTheme.Typography.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(isEnabled ? AppTheme.neonGreen : AppTheme.neonGreen.opacity(0.5))
            .cornerRadius(AppTheme.cornerRadiusLarge)
            .shadow(color: isEnabled ? AppTheme.neonGlow : .clear, radius: 8, x: 0, y: 4)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTheme.Typography.headline)
            .foregroundColor(.black)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusLarge)
                    .stroke(Color.black.opacity(0.3), lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct NavyButtonStyle: ButtonStyle {
    var isEnabled: Bool = true
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTheme.Typography.headline)
            .foregroundColor(.black)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(isEnabled ? AppTheme.cardBackground : AppTheme.cardBackground.opacity(0.5))
            .cornerRadius(AppTheme.cornerRadiusLarge)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

// Legacy alias
struct CoralButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTheme.Typography.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(AppTheme.neonGreen)
            .cornerRadius(AppTheme.cornerRadiusLarge)
            .shadow(color: AppTheme.neonGlow, radius: 8, x: 0, y: 4)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Reusable Back Button
struct BackButton: View {
    let action: () -> Void
    var size: CGFloat = 40
    
    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(AppTheme.cardBackground)
                    .shadow(color: AppTheme.cardShadow, radius: 4, x: 0, y: 2)
                
                Image(systemName: "chevron.left")
                    .font(.system(size: size * 0.4, weight: .semibold))
                    .foregroundColor(.black)
            }
            .frame(width: size, height: size)
            .contentShape(Circle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Reusable Circular Toolbar Button
struct CircularToolbarButton: View {
    let icon: String
    let action: () -> Void
    var size: CGFloat = 40
    var iconSize: CGFloat? = nil
    var backgroundColor: Color = AppTheme.cardBackground
    var foregroundColor: Color = .black
    
    var body: some View {
        Button(action: action) {
            Circle()
                .fill(backgroundColor)
                .frame(width: size, height: size)
                .overlay(
                    Image(systemName: icon)
                        .font(.system(size: iconSize ?? size * 0.4, weight: .semibold))
                        .foregroundColor(foregroundColor)
                )
        }
        .buttonStyle(.plain)
    }
}

