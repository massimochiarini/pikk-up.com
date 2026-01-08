//
//  ContactUsView.swift
//  Sports App 1
//

import SwiftUI

struct ContactUsView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: "envelope.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(AppTheme.teal)
                        
                        Text("Get in Touch")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Text("Have questions or feedback? We'd love to hear from you!")
                            .font(.system(size: 16, weight: .regular))
                            .foregroundColor(AppTheme.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding(.top, 32)
                    
                    // Contact Information Cards
                    VStack(spacing: 16) {
                        // Email Card
                        ContactInfoCard(
                            icon: "envelope.fill",
                            title: "Email",
                            info: "massimochiarini25@gmail.com",
                            color: AppTheme.teal,
                            action: {
                                if let url = URL(string: "mailto:massimochiarini25@gmail.com") {
                                    UIApplication.shared.open(url)
                                }
                            }
                        )
                        
                        // Response Time Info
                        InfoBox(
                            icon: "clock.fill",
                            title: "Response Time",
                            description: "We typically respond within 24-48 hours during business days."
                        )
                        
                        // Support Topics
                        InfoBox(
                            icon: "questionmark.circle.fill",
                            title: "What can we help with?",
                            description: "• Account issues\n• Technical problems\n• Feature requests\n• General feedback\n• Bug reports"
                        )
                    }
                    .padding(.horizontal)
                    
                    Spacer()
                }
            }
            .background(AppTheme.background.ignoresSafeArea())
            .navigationTitle("Contact Us")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                }
            }
        }
    }
}

// MARK: - Contact Info Card

struct ContactInfoCard: View {
    let icon: String
    let title: String
    let info: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
                    .frame(width: 48, height: 48)
                    .background(color.opacity(0.1))
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                    
                    Text(info)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                }
                
                Spacer()
                
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding()
            .background(AppTheme.cardBackground)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Info Box

struct InfoBox: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(AppTheme.info)
                .frame(width: 40, height: 40)
                .background(AppTheme.info.opacity(0.1))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                
                Text(description)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(AppTheme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

#Preview {
    ContactUsView()
}

