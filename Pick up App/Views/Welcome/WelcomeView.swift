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
            // Black background like web app
            AppTheme.background
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                Spacer()
                
                // App Icon / Branding
                VStack(spacing: 24) {
                    // App icon with neon glow effect
                    ZStack {
                        Circle()
                            .fill(AppTheme.neonGreen.opacity(0.1))
                            .frame(width: 140, height: 140)
                            .blur(radius: 30)
                        
                        Circle()
                            .fill(AppTheme.cardBackground)
                            .frame(width: 110, height: 110)
                        
                        Image(systemName: "figure.yoga")
                            .font(.system(size: 50, weight: .bold))
                            .foregroundColor(AppTheme.neonGreen)
                    }
                    
                    // App name
                    VStack(spacing: 8) {
                        Text("Pick Up")
                            .font(.system(size: 42, weight: .black))
                            .foregroundColor(.black)
                        
                        Text("Find Activities Near You")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(.black)
                            .multilineTextAlignment(.center)
                    }
                }
                
                Spacer()
                
                // Description
                VStack(spacing: 16) {
                    FeatureRow(icon: "mappin.circle.fill", text: "Find sessions and classes nearby")
                    FeatureRow(icon: "person.2.fill", text: "Connect with your community")
                    FeatureRow(icon: "calendar.badge.plus", text: "Book and join sessions")
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
                            .shadow(color: AppTheme.neonGlow, radius: 12, x: 0, y: 4)
                    }
                    
                    // Login Button (Secondary)
                    Button(action: {
                        showLoginModal = true
                    }) {
                        Text("Already have an account? ")
                            .foregroundColor(.black.opacity(0.6))
                        + Text("Log in")
                            .foregroundColor(.black)
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
                .foregroundColor(AppTheme.neonGreen)
                .frame(width: 32)
            
            Text(text)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.black)
            
            Spacer()
        }
    }
}

#Preview {
    WelcomeView()
        .environmentObject(AuthService())
}
