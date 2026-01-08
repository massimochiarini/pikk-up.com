//
//  ContentView.swift
//  Sports App 1
//

import SwiftUI
import Auth

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        Group {
            if authService.isLoading {
                // Loading state
                LoadingView()
            } else if !authService.isAuthenticated {
                // Not logged in - show welcome with sign up/login options
                WelcomeView()
            } else if !authService.hasCompletedOnboarding {
                // Logged in but hasn't completed profile setup
                OnboardingView()
            } else {
                // Logged in and completed onboarding - show main tab view
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: authService.hasCompletedOnboarding)
    }
}

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var messageService = MessageService()
    @State private var selectedTab: AppTab = .home
    
    init() {
        // Configure tab bar appearance for unselected items
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Color(hex: "FEFEFE"))
        
        // Unselected tab items - using 1D1C1D with lower opacity
        let unselectedColor = UIColor(Color(hex: "1D1C1D")).withAlphaComponent(0.4)
        appearance.stackedLayoutAppearance.normal.iconColor = unselectedColor
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: unselectedColor]
        
        // Selected tab items - 1D1C1D
        let selectedColor = UIColor(Color(hex: "1D1C1D"))
        appearance.stackedLayoutAppearance.selected.iconColor = selectedColor
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: selectedColor]
        
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Home", systemImage: "house.fill", value: .home) {
                HomeView()
            }
            
            Tab("My Games", systemImage: "sportscourt.fill", value: .myGames) {
                MyGamesView()
            }
            
            Tab("Messages", systemImage: "bubble.left.and.bubble.right.fill", value: .messages) {
                MessagesView()
            }
            .badge(messageService.unreadCount > 0 ? messageService.unreadCount : 0)
        }
        .tint(Color(hex: "1D1C1D"))
        // TODO: Enable conversations when the table is created in Supabase
        // .task {
        //     if let userId = authService.currentUser?.id {
        //         await messageService.fetchConversations(userId: userId)
        //     }
        // }
    }
}

enum AppTab: Hashable {
    case home
    case myGames
    case messages
}

struct LoadingView: View {
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            // Background
            AppTheme.background
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                // App Icon with animation - neon green glow effect
                ZStack {
                    Circle()
                        .fill(AppTheme.neonGreen.opacity(0.15))
                        .frame(width: 140, height: 140)
                        .scaleEffect(isAnimating ? 1.1 : 1.0)
                        .shadow(color: AppTheme.neonGlow, radius: isAnimating ? 20 : 10, x: 0, y: 0)
                    
                    Circle()
                        .fill(AppTheme.neonGreen.opacity(0.3))
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "figure.run")
                        .font(.system(size: 50, weight: .bold))
                        .foregroundColor(AppTheme.neonGreenDark)
                }
                
                VStack(spacing: 8) {
                    Text("Sports App")
                        .font(.system(size: 28, weight: .black))
                        .foregroundColor(AppTheme.navy)
                    
                    Text("Finding your next game...")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
                
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: AppTheme.neonGreenDark))
                    .scaleEffect(1.2)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService())
}
