//
//  TermsOfServiceView.swift
//  Sports App 1
//

import SwiftUI

struct TermsOfServiceView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Terms of Service")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Text("Last updated: December 2024")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                    
                    // Agreement
                    TermsSection(
                        title: "Agreement to Terms",
                        content: """
                        By accessing or using Pickup ("the App"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the App.
                        
                        These Terms of Service apply to all users of the App, including players, game organizers, and visitors.
                        """
                    )
                    
                    // Eligibility
                    TermsSection(
                        title: "Eligibility",
                        content: """
                        You must be at least 13 years old to use the App. By using the App, you represent and warrant that:
                        
                        • You are at least 13 years of age
                        • You have the legal capacity to enter into these Terms
                        • You will comply with these Terms and all applicable laws
                        • All information you provide is accurate and truthful
                        
                        If you are under 18, you represent that you have your parent's or guardian's permission to use the App.
                        """
                    )
                    
                    // Account Registration
                    TermsSection(
                        title: "Account Registration",
                        content: """
                        To use certain features of the App, you must create an account. You agree to:
                        
                        • Provide accurate, current, and complete information
                        • Maintain and update your information as needed
                        • Keep your login credentials secure and confidential
                        • Notify us immediately of any unauthorized access
                        • Accept responsibility for all activities under your account
                        
                        We reserve the right to suspend or terminate accounts that violate these Terms.
                        """
                    )
                    
                    // Acceptable Use
                    TermsSection(
                        title: "Acceptable Use",
                        content: """
                        You agree to use the App only for lawful purposes. You may NOT:
                        
                        • Harass, abuse, or harm other users
                        • Post false, misleading, or inappropriate content
                        • Impersonate another person or entity
                        • Create fake games or events
                        • Spam other users with unsolicited messages
                        • Attempt to gain unauthorized access to the App
                        • Use the App for any commercial purposes without permission
                        • Violate any applicable laws or regulations
                        • Collect user data without consent
                        • Interfere with the proper functioning of the App
                        """
                    )
                    
                    // Games and Meetups
                    TermsSection(
                        title: "Games and Meetups",
                        content: """
                        The App facilitates connections between players for pickup games. You understand and agree that:
                        
                        • You participate in games at your own risk
                        • We do not verify the identity or background of users
                        • We are not responsible for the conduct of any user
                        • You should exercise caution when meeting strangers
                        • You are responsible for your own safety during activities
                        • We do not guarantee the availability or quality of games
                        
                        We recommend meeting in public places and informing someone of your plans.
                        """
                    )
                    
                    // User Content
                    TermsSection(
                        title: "User Content",
                        content: """
                        You retain ownership of content you post on the App. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the App.
                        
                        You are solely responsible for the content you post and represent that:
                        
                        • You own or have rights to the content
                        • The content does not violate anyone's rights
                        • The content is not illegal, harmful, or objectionable
                        
                        We may remove any content that violates these Terms at our discretion.
                        """
                    )
                    
                    // Intellectual Property
                    TermsSection(
                        title: "Intellectual Property",
                        content: """
                        The App, including its design, features, and content (excluding user content), is owned by us and protected by intellectual property laws.
                        
                        You may not copy, modify, distribute, or create derivative works based on the App without our express written permission.
                        
                        The Pickup name, logo, and related graphics are our trademarks and may not be used without permission.
                        """
                    )
                    
                    // Disclaimer of Warranties
                    TermsSection(
                        title: "Disclaimer of Warranties",
                        content: """
                        THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                        
                        We do not warrant that:
                        
                        • The App will be uninterrupted or error-free
                        • Defects will be corrected
                        • The App is free of viruses or harmful components
                        • The results of using the App will meet your expectations
                        
                        You use the App at your own risk and discretion.
                        """
                    )
                    
                    // Limitation of Liability
                    TermsSection(
                        title: "Limitation of Liability",
                        content: """
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.
                        
                        This includes, but is not limited to:
                        
                        • Personal injury during games or meetups
                        • Loss of data or profits
                        • Conduct of other users
                        • Technical failures or interruptions
                        
                        Our total liability shall not exceed the amount you paid to use the App (if any) in the past 12 months.
                        """
                    )
                    
                    // Indemnification
                    TermsSection(
                        title: "Indemnification",
                        content: """
                        You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses (including legal fees) arising from:
                        
                        • Your use of the App
                        • Your violation of these Terms
                        • Your violation of any rights of another user
                        • Your participation in any games or activities
                        
                        This obligation survives termination of these Terms.
                        """
                    )
                    
                    // Termination
                    TermsSection(
                        title: "Termination",
                        content: """
                        We may terminate or suspend your access to the App immediately, without prior notice, for any reason, including breach of these Terms.
                        
                        Upon termination:
                        
                        • Your right to use the App ceases immediately
                        • We may delete your account and associated data
                        • Provisions that should survive termination will remain in effect
                        
                        You may delete your account at any time through the App settings.
                        """
                    )
                    
                    // Changes to Terms
                    TermsSection(
                        title: "Changes to Terms",
                        content: """
                        We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms in the App.
                        
                        Your continued use of the App after changes constitutes acceptance of the new Terms.
                        
                        We encourage you to review these Terms periodically.
                        """
                    )
                    
                    // Governing Law
                    TermsSection(
                        title: "Governing Law",
                        content: """
                        These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
                        
                        Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration or in the courts of competent jurisdiction.
                        """
                    )
                    
                    // Contact
                    TermsSection(
                        title: "Contact Information",
                        content: """
                        If you have any questions about these Terms of Service, please contact us through the App's Contact Us feature.
                        
                        We value your feedback and are committed to addressing your concerns promptly.
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

// MARK: - Terms Section Component

struct TermsSection: View {
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
    TermsOfServiceView()
}

