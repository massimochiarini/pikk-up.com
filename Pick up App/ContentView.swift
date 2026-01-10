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
        .preferredColorScheme(.light)
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: authService.hasCompletedOnboarding)
    }
}

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @State private var selectedTab: AppTab = .home
    
    init() {
        // Configure tab bar appearance for light mode
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.white
        
        // Icons/text black; dim unselected slightly
        let unselectedColor = UIColor.black.withAlphaComponent(0.5)
        let selectedColor = UIColor.black
        appearance.stackedLayoutAppearance.normal.iconColor = unselectedColor
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: unselectedColor]
        appearance.stackedLayoutAppearance.selected.iconColor = selectedColor
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: selectedColor]
        
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
        UITabBar.appearance().unselectedItemTintColor = unselectedColor
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Home", systemImage: "house.fill", value: .home) {
                HomeView()
            }
            
            Tab("My Classes", systemImage: "calendar.badge.clock", value: .myGames) {
                MyGamesView()
            }
        }
        .tint(.black)
    }
}

enum AppTab: Hashable {
    case home
    case myGames
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
                    
                    Image(systemName: "figure.mind.and.body")
                        .font(.system(size: 50, weight: .bold))
                        .foregroundColor(AppTheme.neonGreenDark)
                }
                
                VStack(spacing: 8) {
                    Text("Pick Up Yoga")
                        .font(.system(size: 28, weight: .black))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Text("Finding your next class...")
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
