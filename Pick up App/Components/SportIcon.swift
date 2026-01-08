//
//  SportIcon.swift
//  Sports App 1
//

import SwiftUI

struct SportIcon: View {
    let sport: Sport
    var size: CGFloat = 24
    var showBackground: Bool = false
    var foregroundColor: Color?
    
    var body: some View {
        Group {
            if showBackground {
                ZStack {
                    Circle()
                        .fill(sport.color.opacity(0.15))
                        .frame(width: size * 1.5, height: size * 1.5)
                    
                    Image(systemName: sport.icon)
                        .font(.system(size: size * 0.7, weight: .semibold))
                        .foregroundColor(foregroundColor ?? sport.color)
                }
            } else {
                Image(systemName: sport.icon)
                    .font(.system(size: size, weight: .semibold))
                    .foregroundColor(foregroundColor ?? sport.color)
            }
        }
    }
}

// Sport badge with name
struct SportBadge: View {
    let sport: Sport
    var style: BadgeStyle = .filled
    
    enum BadgeStyle {
        case filled
        case outlined
        case subtle
    }
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: sport.icon)
                .font(.system(size: 12, weight: .semibold))
            
            Text(sport.displayName)
                .font(.system(size: 13, weight: .medium))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(backgroundColor)
        .foregroundColor(foregroundColor)
        .cornerRadius(AppTheme.cornerRadiusPill)
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.cornerRadiusPill)
                .stroke(borderColor, lineWidth: style == .outlined ? 1.5 : 0)
        )
    }
    
    private var backgroundColor: Color {
        switch style {
        case .filled:
            return sport.color
        case .outlined:
            return .clear
        case .subtle:
            return sport.color.opacity(0.12)
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .filled:
            return .white
        case .outlined, .subtle:
            return sport.color
        }
    }
    
    private var borderColor: Color {
        switch style {
        case .outlined:
            return sport.color
        default:
            return .clear
        }
    }
}

// Sport selection grid for onboarding
struct SportSelectionGrid: View {
    @Binding var selectedSports: Set<Sport>
    var columns: Int = 3
    
    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 12), count: columns)
    }
    
    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: 12) {
            ForEach(Sport.allCases) { sport in
                SportSelectionItem(
                    sport: sport,
                    isSelected: selectedSports.contains(sport),
                    onTap: {
                        if selectedSports.contains(sport) {
                            selectedSports.remove(sport)
                        } else {
                            selectedSports.insert(sport)
                        }
                    }
                )
            }
        }
    }
}

struct SportSelectionItem: View {
    let sport: Sport
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(isSelected ? sport.color : sport.color.opacity(0.12))
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: sport.icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(isSelected ? .white : sport.color)
                }
                
                Text(sport.displayName)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(isSelected ? sport.color : AppTheme.textSecondary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isSelected ? sport.color.opacity(0.08) : Color.clear)
            .cornerRadius(AppTheme.cornerRadiusMedium)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                    .stroke(isSelected ? sport.color : AppTheme.border, lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    VStack(spacing: 24) {
        HStack(spacing: 16) {
            SportIcon(sport: .tennis, size: 32)
            SportIcon(sport: .pickleball, size: 32, showBackground: true)
            SportIcon(sport: .basketball, size: 32)
        }
        
        HStack(spacing: 12) {
            SportBadge(sport: .tennis, style: .filled)
            SportBadge(sport: .pickleball, style: .outlined)
            SportBadge(sport: .padel, style: .subtle)
        }
        
        SportSelectionGrid(selectedSports: .constant([.tennis, .pickleball]))
    }
    .padding()
}

