//
//  PrivacyPolicyView.swift
//  Sports App 1
//

import SwiftUI

struct PrivacyPolicyView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Privacy Policy")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Text("Last updated: December 2024")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                    
                    // Introduction
                    PolicySection(
                        title: "Introduction",
                        content: """
                        Welcome to Pickup ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
                        
                        Please read this privacy policy carefully. By using the app, you agree to the collection and use of information in accordance with this policy.
                        """
                    )
                    
                    // Information We Collect
                    PolicySection(
                        title: "Information We Collect",
                        content: """
                        We collect information that you provide directly to us, including:
                        
                        • Account Information: When you create an account, we collect your name, email address, username, and profile photo.
                        
                        • Profile Information: Information you add to your profile such as your favorite sports, skill level, and bio.
                        
                        • Location Data: With your permission, we collect your location to show nearby games and help you find players in your area. Location access is optional and can be disabled at any time in your device settings.
                        
                        • Contacts (Optional): If you choose to use our "Invite Friends" feature, you can grant us access to your device contacts to easily invite friends to play. This feature is completely optional. When you use this feature, we access your contacts locally on your device but do NOT upload or store your contacts on our servers. Contacts are only used to facilitate sending invitations via your device's messaging app.
                        
                        • Communications: Messages you send through the app to other users or groups.
                        
                        • Game Information: Details about games you create or join, including date, time, location, and sport type.
                        
                        • Device Information: We automatically collect device information such as your device type, operating system, and unique device identifiers.
                        """
                    )
                    
                    // How We Use Your Information
                    PolicySection(
                        title: "How We Use Your Information",
                        content: """
                        We use the information we collect to:
                        
                        • Provide, maintain, and improve our services
                        • Connect you with other players and games in your area
                        • Send you notifications about games, messages, and app updates
                        • Personalize your experience based on your preferences
                        • Analyze usage patterns to improve the app
                        • Detect, prevent, and address technical issues or fraudulent activity
                        • Comply with legal obligations
                        """
                    )
                    
                    // Sharing Your Information
                    PolicySection(
                        title: "Sharing Your Information",
                        content: """
                        We may share your information in the following situations:
                        
                        • With Other Users: Your profile information, including name, photo, and favorite sports, is visible to other users. Game participants can see each other's basic profile information.
                        
                        • Service Providers: We may share information with third-party vendors who provide services on our behalf, such as hosting, analytics, and push notifications.
                        
                        • Legal Requirements: We may disclose information if required by law or in response to valid legal requests.
                        
                        • Business Transfers: In connection with any merger, sale of company assets, or acquisition.
                        
                        We do not sell your personal information to third parties.
                        """
                    )
                    
                    // Data Security
                    PolicySection(
                        title: "Data Security",
                        content: """
                        We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                        
                        We use industry-standard encryption for data transmission and store your information on secure servers.
                        """
                    )
                    
                    // Your Rights
                    PolicySection(
                        title: "Your Rights",
                        content: """
                        Depending on your location, you may have certain rights regarding your personal information:
                        
                        • Access: Request a copy of the personal information we hold about you
                        • Correction: Request correction of inaccurate information
                        • Deletion: Request deletion of your personal information
                        • Portability: Request a copy of your data in a portable format
                        • Opt-out: Opt out of certain data processing activities
                        
                        To exercise these rights, please contact us through the app's Contact Us feature or email us directly.
                        """
                    )
                    
                    // Children's Privacy
                    PolicySection(
                        title: "Children's Privacy",
                        content: """
                        Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will delete it promptly.
                        """
                    )
                    
                    // Location Data
                    PolicySection(
                        title: "Location Data",
                        content: """
                        We collect and use location data to provide location-based features such as finding nearby games and players. You can enable or disable location services through your device settings at any time.
                        
                        When you disable location services, some features of the app may be limited.
                        """
                    )
                    
                    // Push Notifications
                    PolicySection(
                        title: "Push Notifications",
                        content: """
                        With your consent, we send push notifications about:
                        
                        • New messages from other players
                        • Game updates and reminders
                        • Friend requests and connections
                        • Important app announcements
                        
                        You can manage notification preferences in your device settings or within the app.
                        """
                    )
                    
                    // User Safety
                    PolicySection(
                        title: "User Safety & Blocking",
                        content: """
                        Your safety is important to us. We provide tools to help you control your experience:
                        
                        • Block Users: You can block any user to prevent them from contacting you or seeing your content. Blocked users won't be notified that they've been blocked.
                        
                        • Report Content: You can report users, messages, games, or posts that violate our Terms of Service. All reports are reviewed by our team and handled confidentially.
                        
                        • Data Associated with Blocked Users: When you block someone, we store this information to enforce the block. This information is only used to provide the blocking functionality.
                        
                        We take reports seriously and may take action including warnings, suspensions, or permanent bans for users who violate our policies.
                        """
                    )
                    
                    // Changes to This Policy
                    PolicySection(
                        title: "Changes to This Policy",
                        content: """
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                        
                        We encourage you to review this Privacy Policy periodically for any changes.
                        """
                    )
                    
                    // Contact Us
                    PolicySection(
                        title: "Contact Us",
                        content: """
                        If you have any questions about this Privacy Policy or our data practices, please contact us through the app's Contact Us feature.
                        
                        We take your privacy seriously and will respond to your inquiries promptly.
                        """
                    )
                    
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
            .background(AppTheme.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                }
            }
        }
        .navigationViewStyle(.stack)
    }
}

// MARK: - Policy Section Component

struct PolicySection: View {
    let title: String
    let content: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(AppTheme.textPrimary)
            
            Text(content)
                .font(.system(size: 15, weight: .regular))
                .foregroundColor(AppTheme.textSecondary)
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

#Preview {
    PrivacyPolicyView()
}

