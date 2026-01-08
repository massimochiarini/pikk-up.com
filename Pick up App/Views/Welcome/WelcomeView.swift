//
//  WelcomeView.swift
//  PickleballApp
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct WelcomeView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showSignUpFlow = false
    @State private var showLoginModal = false
    
    var body: some View {
        ZStack {
            // Light background
            AppTheme.background
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                Spacer()
                
                // App Icon / Branding
                VStack(spacing: 24) {
                    // App icon with glow effect
                    ZStack {
                        Circle()
                            .fill(AppTheme.neonGreen.opacity(0.15))
                            .frame(width: 140, height: 140)
                            .shadow(color: AppTheme.neonGlow, radius: 20, x: 0, y: 0)
                        
                        Circle()
                            .fill(AppTheme.neonGreen.opacity(0.3))
                            .frame(width: 110, height: 110)
                        
                        Image(systemName: "figure.pickleball")
                            .font(.system(size: 50, weight: .bold))
                            .foregroundColor(AppTheme.neonGreenDark)
                    }
                    
                    // App name
                    VStack(spacing: 8) {
                        Text("Pick Up")
                            .font(.system(size: 42, weight: .black))
                            .foregroundColor(AppTheme.navy)
                        
                        Text("Find Activities Near You")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(AppTheme.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                }
                
                Spacer()
                
                // Description
                VStack(spacing: 16) {
                    FeatureRow(icon: "mappin.circle.fill", text: "Discover games happening nearby")
                    FeatureRow(icon: "person.2.fill", text: "Connect with local players")
                    FeatureRow(icon: "calendar.badge.plus", text: "Schedule and join matches")
                }
                .padding(.horizontal, 32)
                
                Spacer()
                
                // Bottom buttons
                VStack(spacing: 16) {
                    // Sign Up Button (Primary - Neon Green)
                    Button(action: {
                        showSignUpFlow = true
                    }) {
                        Text("Sign Up")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(AppTheme.onPrimary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(AppTheme.neonGreen)
                            .cornerRadius(16)
                            .shadow(color: AppTheme.neonGlow, radius: 8, x: 0, y: 4)
                    }
                    
                    // Login Button (Secondary)
                    Button(action: {
                        showLoginModal = true
                    }) {
                        Text("Already have an account? ")
                            .foregroundColor(AppTheme.textSecondary)
                        + Text("Log in")
                            .foregroundColor(AppTheme.navy)
                            .fontWeight(.bold)
                    }
                    .font(.subheadline)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 50)
            }
        }
        .fullScreenCover(isPresented: $showSignUpFlow) {
            SignUpFlowView()
                .environmentObject(authService)
        }
        .sheet(isPresented: $showLoginModal) {
            LoginModalView()
                .environmentObject(authService)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }
}

// MARK: - Feature Row

struct FeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(AppTheme.neonGreenDark)
                .frame(width: 32)
            
            Text(text)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(AppTheme.textPrimary)
            
            Spacer()
        }
    }
}

#Preview {
    WelcomeView()
        .environmentObject(AuthService())
}
