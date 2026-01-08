//
//  PrimaryButton.swift
//  PickleballApp
//

import SwiftUI

struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    var isLoading: Bool = false
    var style: PrimaryButtonVariant = .primary
    
    enum PrimaryButtonVariant {
        case primary      // Neon green - main CTA
        case secondary    // Navy - secondary actions
        case destructive  // Red - destructive actions
        
        var backgroundColor: Color {
            switch self {
            case .primary:
                return AppTheme.neonGreen
            case .secondary:
                return AppTheme.navy
            case .destructive:
                return AppTheme.error
            }
        }
        
        var textColor: Color {
            switch self {
            case .primary:
                return AppTheme.onPrimary
            case .secondary, .destructive:
                return .white
            }
        }
        
        var shadowColor: Color {
            switch self {
            case .primary:
                return AppTheme.neonGlow
            case .secondary:
                return AppTheme.navy.opacity(0.3)
            case .destructive:
                return AppTheme.error.opacity(0.3)
            }
        }
    }
    
    var body: some View {
        Button(action: action) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: style.textColor))
                        .scaleEffect(0.8)
                } else {
                    Text(title)
                        .fontWeight(.bold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(style.backgroundColor)
            .foregroundColor(style.textColor)
            .cornerRadius(14)
            .shadow(color: style.shadowColor, radius: 8, x: 0, y: 4)
        }
        .disabled(isLoading)
    }
}

// Color extension for hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    VStack(spacing: 16) {
        PrimaryButton(title: "Sign Up", action: {})
        PrimaryButton(title: "View Details", action: {}, style: .secondary)
        PrimaryButton(title: "Leave Game", action: {}, style: .destructive)
        PrimaryButton(title: "Loading...", action: {}, isLoading: true)
    }
    .padding()
    .background(AppTheme.background)
}

