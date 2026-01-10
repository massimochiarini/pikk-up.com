//
//  CustomTabBar.swift
//  Sports App 1
//

import SwiftUI

enum TabItem: Int, CaseIterable {
    case home = 0
    case myGames = 1
    case messages = 2
    
    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .myGames: return "calendar.badge.clock"
        case .messages: return "bubble.left.and.bubble.right.fill"
        }
    }
    
    var iconOutline: String {
        switch self {
        case .home: return "house"
        case .myGames: return "calendar.badge.clock"
        case .messages: return "bubble.left.and.bubble.right"
        }
    }
    
    var title: String {
        switch self {
        case .home: return "Home"
        case .myGames: return "My Classes"
        case .messages: return "Messages"
        }
    }
}

struct CustomTabBar: View {
    @Binding var selectedTab: TabItem
    var unreadMessagesCount: Int = 0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(TabItem.allCases, id: \.rawValue) { tab in
                TabBarButton(
                    tab: tab,
                    isSelected: selectedTab == tab,
                    unreadCount: tab == .messages ? unreadMessagesCount : 0,
                    action: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedTab = tab
                        }
                    }
                )
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(
            Capsule()
                .fill(AppTheme.background)
                .shadow(color: AppTheme.textPrimary.opacity(0.1), radius: 16, x: 0, y: 4)
        )
        .padding(.horizontal, 40)
        .padding(.bottom, 8)
    }
}

struct TabBarButton: View {
    let tab: TabItem
    let isSelected: Bool
    var unreadCount: Int = 0
    let action: () -> Void
    
    // Selected = solid black, Unselected = light gray (30% opacity for more contrast)
    private var iconColor: Color {
        isSelected ? AppTheme.textPrimary : AppTheme.textPrimary.opacity(0.3)
    }
    
    private var textColor: Color {
        isSelected ? AppTheme.textPrimary : AppTheme.textPrimary.opacity(0.3)
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: isSelected ? tab.icon : tab.iconOutline)
                        .font(.system(size: 22, weight: isSelected ? .semibold : .regular))
                        .foregroundColor(iconColor)
                    
                    // Unread badge
                    if unreadCount > 0 {
                        Text(unreadCount > 99 ? "99+" : "\(unreadCount)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .clipShape(Capsule())
                            .offset(x: 12, y: -6)
                    }
                }
                
                Text(tab.title)
                    .font(.system(size: 10, weight: isSelected ? .semibold : .medium))
                    .foregroundColor(textColor)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(
                Group {
                    if isSelected {
                        Capsule()
                            .fill(Color.white)
                            .shadow(color: AppTheme.textPrimary.opacity(0.08), radius: 8, x: 0, y: 2)
                    }
                }
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Container view that applies the tab bar
struct TabBarContainer<Content: View>: View {
    @Binding var selectedTab: TabItem
    var unreadMessagesCount: Int = 0
    @ViewBuilder var content: Content
    
    var body: some View {
        ZStack(alignment: .bottom) {
            content
            
            CustomTabBar(
                selectedTab: $selectedTab,
                unreadMessagesCount: unreadMessagesCount
            )
        }
    }
}

#Preview {
    struct PreviewWrapper: View {
        @State private var selectedTab: TabItem = .home
        
        var body: some View {
            ZStack {
                AppTheme.background
                    .ignoresSafeArea()
                
                VStack {
                    Spacer()
                    
                    Text("Selected: \(selectedTab.title)")
                        .font(.title)
                    
                    Spacer()
                }
                .safeAreaInset(edge: .bottom) {
                    CustomTabBar(selectedTab: $selectedTab, unreadMessagesCount: 3)
                }
            }
        }
    }
    
    return PreviewWrapper()
}

