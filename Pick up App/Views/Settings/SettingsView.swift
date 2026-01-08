//
//  SettingsView.swift
//  Sports App 1
//

import SwiftUI
import Auth
import StoreKit

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var notificationService: NotificationService
    @Environment(\.dismiss) var dismiss
    
    @State private var showLogoutConfirmation = false
    @State private var showDeleteAccountConfirmation = false
    @State private var showNotificationAlert = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    
    @State private var showEditProfile = false
    @State private var showPrivacyPolicy = false
    @State private var showTermsOfService = false
    @State private var showHelpFAQ = false
    @State private var showContactUs = false
    
    // Sport preferences
    @State private var isPickleballSelected = true
    @State private var isYogaSelected = false
    
    var body: some View {
        NavigationView {
            List {
                // Profile Section - tappable to edit profile
                Section {
                    if let profile = authService.currentProfile {
                        Button(action: { showEditProfile = true }) {
                            HStack(spacing: 14) {
                                AvatarView(
                                    url: profile.avatarUrl,
                                    initials: profile.initials,
                                    size: 60,
                                    showBorder: false
                                )
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(profile.fullName)
                                        .font(.system(size: 18, weight: .semibold))
                                        .foregroundColor(AppTheme.textPrimary)
                                    
                                    if let username = profile.username {
                                        Text("@\(username)")
                                            .font(.system(size: 14, weight: .medium))
                                            .foregroundColor(AppTheme.textSecondary)
                                    }
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(AppTheme.textTertiary)
                            }
                            .padding(.vertical, 8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                
                // Preferences Section
                Section("Preferences") {
                    SettingsRow(icon: "mappin.circle.fill", title: "Location", subtitle: "Miami, FL", color: AppTheme.teal)
                    
                    // Notifications row with real status
                    Button(action: handleNotificationsTap) {
                        HStack(spacing: 12) {
                            Image(systemName: "bell.fill")
                                .font(.system(size: 18))
                                .foregroundColor(AppTheme.coral)
                                .frame(width: 28)
                            
                            Text("Notifications")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(AppTheme.textPrimary)
                            
                            Spacer()
                            
                            Text(notificationService.isNotificationsEnabled ? "Enabled" : "Disabled")
                                .font(.system(size: 14, weight: .regular))
                                .foregroundColor(notificationService.isNotificationsEnabled ? AppTheme.success : AppTheme.textTertiary)
                            
                            Image(systemName: "chevron.right")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(AppTheme.textTertiary)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                // Sports Section
                Section {
                    SportFilterRow(
                        sport: "Pickleball",
                        subtitle: "Games created on mobile",
                        icon: "sportscourt",
                        isSelected: isPickleballSelected,
                        onToggle: { togglePickleball() }
                    )
                    
                    SportFilterRow(
                        sport: "Yoga",
                        subtitle: "Sessions created on web",
                        icon: "figure.mind.and.body",
                        isSelected: isYogaSelected,
                        onToggle: { toggleYoga() }
                    )
                } header: {
                    Text("Sports")
                } footer: {
                    Text("Choose which types of activities to show in your feed. Changes take effect immediately.")
                        .font(.system(size: 13))
                        .foregroundColor(AppTheme.textTertiary)
                }
                
                // Support Section
                Section("Support") {
                    Button(action: { showHelpFAQ = true }) {
                        SettingsRow(icon: "questionmark.circle.fill", title: "Help & FAQ", color: AppTheme.info)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: { showContactUs = true }) {
                        SettingsRow(icon: "envelope.fill", title: "Contact Us", color: AppTheme.teal)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: openAppStoreRating) {
                        SettingsRow(icon: "star.fill", title: "Rate the App", color: AppTheme.warning)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                // Account Section
                Section("Account") {
                    Button(action: { showPrivacyPolicy = true }) {
                        SettingsRow(icon: "shield.fill", title: "Privacy Policy", color: AppTheme.textSecondary)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: { showTermsOfService = true }) {
                        SettingsRow(icon: "doc.text.fill", title: "Terms of Service", color: AppTheme.textSecondary)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: { showLogoutConfirmation = true }) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .font(.system(size: 18))
                                .foregroundColor(AppTheme.error)
                                .frame(width: 28)
                            
                            Text("Sign Out")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(AppTheme.error)
                        }
                    }
                    
                    Button(action: { showDeleteAccountConfirmation = true }) {
                        HStack {
                            Image(systemName: "trash.fill")
                                .font(.system(size: 18))
                                .foregroundColor(AppTheme.error)
                                .frame(width: 28)
                            
                            Text("Delete Account")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(AppTheme.error)
                        }
                    }
                }
                
                // App Info
                Section {
                    HStack {
                        Spacer()
                        VStack(spacing: 4) {
                            Text("Pickleball Games")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(AppTheme.textSecondary)
                            Text("Version 1.0.0")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(AppTheme.textTertiary)
                        }
                        Spacer()
                    }
                    .listRowBackground(Color.clear)
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                }
            }
            .alert("Sign Out?", isPresented: $showLogoutConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Sign Out", role: .destructive) {
                    Task {
                        try? await authService.signOut()
                        dismiss()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .alert("Delete Account?", isPresented: $showDeleteAccountConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    Task {
                        do {
                            try await authService.deleteAccount()
                            dismiss()
                        } catch {
                            errorMessage = error.localizedDescription
                            showErrorAlert = true
                        }
                    }
                }
            } message: {
                Text("This action cannot be undone. All your data including profile, games, messages, and connections will be permanently deleted.")
            }
            .alert("Error", isPresented: $showErrorAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .alert("Enable Notifications", isPresented: $showNotificationAlert) {
                Button("Open Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("To receive message notifications, please enable them in Settings.")
            }
            .task {
                await notificationService.checkNotificationStatus()
                loadSportPreferences()
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
                    .environmentObject(authService)
            }
            .sheet(isPresented: $showPrivacyPolicy) {
                PrivacyPolicyView()
            }
            .sheet(isPresented: $showTermsOfService) {
                TermsOfServiceView()
            }
            .sheet(isPresented: $showHelpFAQ) {
                HelpFAQView()
            }
            .sheet(isPresented: $showContactUs) {
                ContactUsView()
            }
        }
        .navigationViewStyle(.stack) // Fix for iPad - ensures proper navigation behavior
    }
    
    // MARK: - Notification Handling
    
    private func handleNotificationsTap() {
        if notificationService.isNotificationsEnabled {
            // Already enabled, open settings to manage
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }
        } else {
            // Request permission
            Task {
                let granted = await notificationService.requestPermission()
                if !granted {
                    showNotificationAlert = true
                }
            }
        }
    }
    
    // MARK: - Support Actions
    
    private func openAppStoreRating() {
        // Use StoreKit's native in-app review prompt for iOS 14+
        // This provides a better user experience and follows Apple's guidelines
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
            SKStoreReviewController.requestReview(in: windowScene)
        }
        
        // Note: If you want to direct users to the App Store instead (after app is published),
        // replace YOUR_APP_ID with your actual App Store ID and use:
        // if let appStoreUrl = URL(string: "https://apps.apple.com/app/id YOUR_APP_ID?action=write-review") {
        //     UIApplication.shared.open(appStoreUrl)
        // }
    }
    
    // MARK: - Sport Preference Actions
    
    private func togglePickleball() {
        isPickleballSelected.toggle()
        updateSportPreference()
    }
    
    private func toggleYoga() {
        isYogaSelected.toggle()
        updateSportPreference()
    }
    
    private func updateSportPreference() {
        guard let userId = authService.currentUser?.id else { return }
        
        let preference: String
        if isPickleballSelected && isYogaSelected {
            preference = "both"
        } else if isPickleballSelected {
            preference = "pickleball"
        } else if isYogaSelected {
            preference = "yoga"
        } else {
            // Neither selected - user wants to see no games (or we could default to "both")
            // For now, allow this state
            preference = "none"
        }
        
        Task { @MainActor in
            do {
                let profileService = ProfileService()
                let update = ProfileUpdate(sportPreference: preference)
                try await profileService.updateProfile(userId: userId, updates: update)
                
                // Refresh the current profile
                await authService.refreshProfile()
                
                print("✅ Sport preference updated to: \(preference)")
            } catch {
                print("❌ Error updating sport preference: \(error)")
                errorMessage = "Failed to update sport preference"
                showErrorAlert = true
            }
        }
    }
    
    private func loadSportPreferences() {
        guard let profile = authService.currentProfile else { return }
        
        switch profile.sportPreference {
        case "pickleball":
            isPickleballSelected = true
            isYogaSelected = false
        case "yoga":
            isPickleballSelected = false
            isYogaSelected = true
        case "both":
            isPickleballSelected = true
            isYogaSelected = true
        case "none":
            isPickleballSelected = false
            isYogaSelected = false
        default:
            // Default to "both" for new users
            isPickleballSelected = true
            isYogaSelected = true
        }
    }
}

// MARK: - Settings Row

struct SettingsRow: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var color: Color = AppTheme.teal
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(color)
                .frame(width: 28)
            
            Text(title)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(AppTheme.textPrimary)
            
            Spacer()
            
            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(AppTheme.textTertiary)
            }
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(AppTheme.textTertiary)
        }
    }
}

// MARK: - Sport Filter Row

struct SportFilterRow: View {
    let sport: String
    let subtitle: String?
    let icon: String
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(isSelected ? AppTheme.neonGreen : AppTheme.textTertiary)
                    .frame(width: 28)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(sport)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                }
                
                Spacer()
                
                ZStack {
                    Circle()
                        .stroke(isSelected ? AppTheme.neonGreen : AppTheme.textTertiary, lineWidth: 2)
                        .frame(width: 24, height: 24)
                    
                    if isSelected {
                        Circle()
                            .fill(AppTheme.neonGreen)
                            .frame(width: 14, height: 14)
                    }
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthService.shared)
        .environmentObject(NotificationService.shared)
}
