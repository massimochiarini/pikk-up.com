//
//  Theme.swift
//  Sports App 1
//
//  Brand colors inspired by modern sports tech aesthetic
//  - Neon green for energy and action
//  - Deep navy for confidence and trust
//  - Clean, vibrant, playful yet professional
//

import SwiftUI

struct AppTheme {
    // MARK: - Primary Brand Colors
    static let neonGreen = Color(hex: "D3FD00")      // Primary accent - vibrant neon yellow-green
    static let neonGreenDark = Color(hex: "B8E000")  // Darker neon for pressed states
    static let navy = Color(hex: "0F1B2E")           // Primary dark - deep navy
    static let navyLight = Color(hex: "1A2B4A")      // Lighter navy for cards
    static let skyBlue = Color(hex: "4A9EBF")        // Secondary accent - light blue
    static let skyBlueLight = Color(hex: "7BB8D0")   // Lighter sky blue
    static let brandBlue = Color(hex: "0013F7")      // Brand blue for highlights
    
    // MARK: - Primary Action Color (Neon Green is the main brand color)
    static let primary = neonGreen                    // Main action color - vibrant & sporty
    static let primaryDark = neonGreenDark           // Pressed/hover state
    static let onPrimary = Color(hex: "1D1C1D")      // Text color on primary (dark for contrast)
    
    // MARK: - Legacy aliases (for backwards compatibility)
    static let teal = neonGreen                       // Map old teal to neonGreen (primary)
    static let tealLight = neonGreenDark             // Map old tealLight to neonGreenDark
    static let coral = skyBlue                        // Map old coral to skyBlue
    static let coralLight = skyBlueLight             // Map old coralLight to skyBlueLight
    static let cream = Color(hex: "F8F9FA")          // Updated cream - cleaner
    static let mint = skyBlue                        // Map old mint to skyBlue
    
    // MARK: - Neutral Colors
    static let background = Color(hex: "FEFEFE")     // Clean white background
    static let backgroundDark = Color(hex: "0A0F1A") // Dark mode background
    static let cardBackground = Color(hex: "FEFEFE")
    static let cardBackgroundDark = Color(hex: "141E30") // Dark card background
    static let textPrimary = Color(hex: "1D1C1D")    // Almost black for primary text
    static let textSecondary = Color(hex: "1D1C1D").opacity(0.6)  // 60% opacity for secondary text
    static let textTertiary = Color(hex: "1D1C1D").opacity(0.4)   // 40% opacity for tertiary text
    static let textOnDark = Color.white
    static let textOnNeon = Color(hex: "1D1C1D")     // Dark text on neon backgrounds
    static let border = Color(hex: "1D1C1D").opacity(0.12)
    static let divider = Color(hex: "1D1C1D").opacity(0.08)
    
    // MARK: - Semantic Colors
    static let success = Color(hex: "00C853")        // Bright green success
    static let warning = Color(hex: "FFB300")        // Amber warning
    static let error = Color(hex: "FF3D57")          // Red error
    static let info = skyBlue                        // Info uses sky blue
    
    // MARK: - Card Gradients
    // Primary card - vibrant neon gradient (main cards, CTAs)
    static let playerCardGradient = LinearGradient(
        colors: [neonGreen, Color(hex: "B8E000")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Game card - neon green gradient (primary action cards)
    static let gameCardGradient = LinearGradient(
        colors: [neonGreen, Color(hex: "C4F000")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Secondary card - deep navy gradient (secondary/info cards)
    static let navyCardGradient = LinearGradient(
        colors: [navy, navyLight],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Premium/featured card - navy to sky blue
    static let premiumCardGradient = LinearGradient(
        colors: [navy, skyBlue],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Activity card gradient
    static let activityCardGradient = LinearGradient(
        colors: [cream, Color.white],
        startPoint: .top,
        endPoint: .bottom
    )
    
    // Sky blue subtle gradient
    static let mintGradient = LinearGradient(
        colors: [skyBlue.opacity(0.3), skyBlue.opacity(0.1)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    // Neon accent gradient (for CTAs and highlights)
    static let neonGradient = LinearGradient(
        colors: [neonGreen, Color(hex: "B8E000")],
        startPoint: .leading,
        endPoint: .trailing
    )
    
    // MARK: - Shadows
    static let cardShadow = Color(hex: "1D1C1D").opacity(0.08)
    static let buttonShadow = Color(hex: "1D1C1D").opacity(0.15)
    static let tabBarShadow = Color(hex: "1D1C1D").opacity(0.12)
    static let neonGlow = neonGreen.opacity(0.4)     // Glow effect for neon elements
    
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
            .shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: 4)
    }
    
    func darkCardStyle() -> some View {
        self
            .background(AppTheme.navy)
            .cornerRadius(AppTheme.cornerRadiusLarge)
            .shadow(color: AppTheme.cardShadow, radius: 12, x: 0, y: 6)
    }
    
    func pillStyle() -> some View {
        self
            .padding(.horizontal, AppTheme.spacingM)
            .padding(.vertical, AppTheme.spacingS)
            .background(AppTheme.neonGreen)
            .foregroundColor(AppTheme.onPrimary)
            .cornerRadius(AppTheme.cornerRadiusPill)
            .shadow(color: AppTheme.neonGlow, radius: 4, x: 0, y: 2)
    }
    
    func navyPillStyle() -> some View {
        self
            .padding(.horizontal, AppTheme.spacingM)
            .padding(.vertical, AppTheme.spacingS)
            .background(AppTheme.navy)
            .foregroundColor(.white)
            .cornerRadius(AppTheme.cornerRadiusPill)
    }
    
    func outlinePillStyle() -> some View {
        self
            .padding(.horizontal, AppTheme.spacingM)
            .padding(.vertical, AppTheme.spacingS)
            .background(Color.clear)
            .foregroundColor(AppTheme.neonGreen)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusPill)
                    .stroke(AppTheme.neonGreen, lineWidth: 2)
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
            .foregroundColor(AppTheme.onPrimary)
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
            .foregroundColor(AppTheme.navy)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusLarge)
                    .stroke(AppTheme.navy, lineWidth: 2)
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
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(isEnabled ? AppTheme.navy : AppTheme.navy.opacity(0.5))
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
            .foregroundColor(AppTheme.onPrimary)
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
                    .fill(AppTheme.background)
                    .shadow(color: AppTheme.textPrimary.opacity(0.08), radius: 4, x: 0, y: 2)
                
                Image(systemName: "chevron.left")
                    .font(.system(size: size * 0.4, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
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
    var backgroundColor: Color = AppTheme.textPrimary
    var foregroundColor: Color = AppTheme.background
    
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

