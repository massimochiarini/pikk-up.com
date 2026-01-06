//
//  HelpFAQView.swift
//  Sports App 1
//

import SwiftUI

struct HelpFAQView: View {
    @Environment(\.dismiss) var dismiss
    @State private var expandedItems: Set<Int> = []
    
    let faqItems: [(question: String, answer: String)] = [
        (
            question: "How do I create a game?",
            answer: "Tap the '+' button on the Home tab to create a new game. Fill in the details like sport, location, date, time, and number of players needed. You can also add a description and set the skill level. Once created, other users can discover and join your game!"
        ),
        (
            question: "How do I join a game?",
            answer: "Browse games on the Home feed or search by location and sport. Tap on a game card to see details, then tap 'Join Game' to RSVP. The game organizer will be notified, and you'll see the game in your 'My Games' tab."
        ),
        (
            question: "What do the RSVP statuses mean?",
            answer: "• Going: You've confirmed you'll attend\n• Maybe: You're interested but not sure\n• Can't Go: You've declined\n\nYou can change your RSVP status anytime before the game starts."
        ),
        (
            question: "How do I message other players?",
            answer: "Tap the Messages tab to see your conversations. You can message individual players or join group chats for games you've joined. Game organizers can create group chats to coordinate with all participants."
        ),
        (
            question: "How do I find games near me?",
            answer: "The app uses your location to show nearby games on the Home feed. Make sure you've enabled location permissions in your device settings. You can also search for games in specific areas by using the map view."
        ),
        (
            question: "Can I edit or cancel a game I created?",
            answer: "Yes! Go to 'My Games' tab, tap on your game, then tap the menu icon. You can edit game details or cancel the game. If you cancel, all participants will be notified automatically."
        ),
        (
            question: "How do I add friends and build connections?",
            answer: "After playing with someone, you can send them a connection request from their profile. You can also find players in the 'Add Friends' section. Once connected, you'll see each other's games more easily and can message directly."
        ),
        (
            question: "What if I need to leave a game I joined?",
            answer: "Open the game details and change your RSVP status to 'Can't Go'. The organizer will be notified that you can no longer attend. Please try to give advance notice when possible!"
        ),
        (
            question: "How do notifications work?",
            answer: "You'll receive push notifications for:\n• New messages\n• Game invitations\n• RSVP updates\n• Game reminders\n• Connection requests\n\nYou can manage notification settings in your device's Settings app."
        ),
        (
            question: "How do I update my profile?",
            answer: "Go to Settings and tap on your profile card at the top. You can update your profile picture, name, username, bio, and favorite sports. Keep your profile updated so other players can get to know you!"
        ),
        (
            question: "What sports are supported?",
            answer: "Currently, the app supports various sports including Basketball, Soccer, Tennis, Volleyball, Pickleball, and more. We're constantly adding new sports based on user feedback!"
        ),
        (
            question: "Is my data private and secure?",
            answer: "Yes! We take your privacy seriously. Your personal information is encrypted and secure. Only players in the same games can see your contact details. You can review our Privacy Policy in Settings for full details."
        ),
        (
            question: "How do I delete my account?",
            answer: "Go to Settings and scroll to the bottom. Tap 'Delete Account' and confirm. Please note this action is permanent and will delete all your data, including games, messages, and connections."
        ),
        (
            question: "I found a bug or have a suggestion. How can I report it?",
            answer: "We'd love to hear from you! Go to Settings > Contact Us to send us an email. We read every message and appreciate your feedback to help improve the app."
        )
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "questionmark.circle.fill")
                            .font(.system(size: 50))
                            .foregroundColor(AppTheme.info)
                            .padding(.top, 20)
                        
                        Text("Help & FAQ")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Text("Find answers to common questions")
                            .font(.system(size: 16, weight: .regular))
                            .foregroundColor(AppTheme.textSecondary)
                            .padding(.bottom, 20)
                    }
                    .frame(maxWidth: .infinity)
                    .background(AppTheme.cardBackground)
                    
                    // FAQ Items
                    VStack(spacing: 12) {
                        ForEach(Array(faqItems.enumerated()), id: \.offset) { index, item in
                            FAQItemView(
                                question: item.question,
                                answer: item.answer,
                                isExpanded: expandedItems.contains(index),
                                onTap: {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                        if expandedItems.contains(index) {
                                            expandedItems.remove(index)
                                        } else {
                                            expandedItems.insert(index)
                                        }
                                    }
                                }
                            )
                        }
                    }
                    .padding(16)
                }
            }
            .background(AppTheme.background)
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
        .navigationViewStyle(.stack)
    }
}

// MARK: - FAQ Item View

struct FAQItemView: View {
    let question: String
    let answer: String
    let isExpanded: Bool
    let onTap: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Question Header
            Button(action: onTap) {
                HStack(spacing: 12) {
                    Text(question)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(AppTheme.textSecondary)
                }
                .padding(16)
                .background(AppTheme.cardBackground)
                .cornerRadius(12)
            }
            .buttonStyle(PlainButtonStyle())
            
            // Answer Body
            if isExpanded {
                Text(answer)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundColor(AppTheme.textSecondary)
                    .multilineTextAlignment(.leading)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(AppTheme.cardBackground.opacity(0.5))
                    .cornerRadius(12)
                    .padding(.top, 4)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
}

#Preview {
    HelpFAQView()
}

