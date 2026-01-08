//
//  BaseCard.swift
//  Sports App 1
//

import SwiftUI

struct BaseCard<Content: View>: View {
    let content: Content
    var backgroundColor: Color = AppTheme.cardBackground
    var gradient: LinearGradient? = nil
    var padding: CGFloat = AppTheme.spacingL
    var cornerRadius: CGFloat = AppTheme.cornerRadiusLarge
    var shadowRadius: CGFloat = 8
    var showBorder: Bool = false
    
    init(
        backgroundColor: Color = AppTheme.cardBackground,
        gradient: LinearGradient? = nil,
        padding: CGFloat = AppTheme.spacingL,
        cornerRadius: CGFloat = AppTheme.cornerRadiusLarge,
        shadowRadius: CGFloat = 8,
        showBorder: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.backgroundColor = backgroundColor
        self.gradient = gradient
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.shadowRadius = shadowRadius
        self.showBorder = showBorder
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(padding)
            .background(
                Group {
                    if let gradient = gradient {
                        gradient
                    } else {
                        backgroundColor
                    }
                }
            )
            .cornerRadius(cornerRadius)
            .shadow(color: AppTheme.cardShadow, radius: shadowRadius, x: 0, y: 2)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(showBorder ? AppTheme.border : Color.clear, lineWidth: 1)
            )
    }
}

// Card with connection context badge
struct CardWithContext<Content: View>: View {
    let content: Content
    let context: ConnectionContext?
    
    init(context: ConnectionContext?, @ViewBuilder content: () -> Content) {
        self.context = context
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let context = context {
                HStack(spacing: 6) {
                    Image(systemName: context.type.icon)
                        .font(.system(size: 11, weight: .bold))
                    
                    Text(context.displayText)
                        .font(.system(size: 12, weight: .semibold))
                }
                .foregroundColor(AppTheme.onPrimary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(AppTheme.neonGreen)
                .cornerRadius(AppTheme.cornerRadiusSmall)
                .shadow(color: AppTheme.neonGlow, radius: 4, x: 0, y: 2)
                .padding(.bottom, 8)
            }
            
            content
        }
    }
}

// Tappable card wrapper
struct TappableCard<Content: View>: View {
    let content: Content
    let action: () -> Void
    
    @State private var isPressed = false
    
    init(action: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.action = action
        self.content = content()
    }
    
    var body: some View {
        content
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isPressed)
            .onTapGesture {
                action()
            }
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in isPressed = true }
                    .onEnded { _ in isPressed = false }
            )
    }
}

#Preview {
    VStack(spacing: 16) {
        BaseCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Basic Card")
                    .font(.headline)
                Text("This is a basic card with default styling")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        
        BaseCard(gradient: AppTheme.playerCardGradient) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Gradient Card")
                    .font(.headline)
                    .foregroundColor(.white)
                Text("This card has a gradient background")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        
        CardWithContext(context: ConnectionContext(type: .playedTogether, userName: "Alex")) {
            BaseCard {
                Text("Card with connection context")
            }
        }
    }
    .padding()
    .background(AppTheme.background)
}

