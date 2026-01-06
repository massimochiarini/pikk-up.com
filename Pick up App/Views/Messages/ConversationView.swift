//
//  ConversationView.swift
//  Sports App 1
//

import SwiftUI
import Auth

struct ConversationView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    let conversation: Conversation
    let otherProfile: Profile
    
    @StateObject private var messageService = MessageService()
    @StateObject private var safetyService = SafetyService()
    
    @State private var messageText = ""
    @State private var contextLabel: String?
    @State private var scrollProxy: ScrollViewProxy?
    @State private var showReportSheet = false
    @State private var selectedMessageForReport: Message?
    @State private var replyingToMessage: Message?
    
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Context header (if from a post/game)
            if let context = contextLabel {
                contextHeader(context)
            }
            
            // Messages
            messagesScrollView
            
            // Input bar
            inputBar
        }
        .background(AppTheme.background)
        .navigationBarBackButtonHidden(true)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                BackButton(action: { dismiss() })
            }
            
            ToolbarItem(placement: .principal) {
                HStack(spacing: 10) {
                    AvatarView(
                        url: otherProfile.avatarUrl,
                        initials: otherProfile.initials,
                        size: 32,
                        showBorder: false
                    )
                    
                    VStack(alignment: .leading, spacing: 0) {
                        Text(otherProfile.fullName)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        if let username = otherProfile.username {
                            Text("@\(username)")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(destination: OtherProfileView(profile: otherProfile).environmentObject(authService)) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.background)
                            .shadow(color: AppTheme.textPrimary.opacity(0.08), radius: 4, x: 0, y: 2)
                        
                        Image(systemName: "person.circle")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                    }
                    .frame(width: 40, height: 40)
                    .contentShape(Circle())
                }
                .buttonStyle(.plain)
            }
        }
        .task {
            await loadMessages()
            await loadContextLabel()
        }
        .onDisappear {
            Task {
                await messageService.unsubscribeFromMessages()
            }
        }
    }
    
    // MARK: - Context Header
    
    private func contextHeader(_ text: String) -> some View {
        HStack {
            Image(systemName: "link")
                .font(.system(size: 12, weight: .semibold))
            
            Text(text)
                .font(.system(size: 13, weight: .medium))
        }
        .foregroundColor(AppTheme.teal)
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity)
        .background(AppTheme.teal.opacity(0.08))
    }
    
    // MARK: - Messages Scroll View
    
    private var messagesScrollView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 4) {
                    ForEach(messageService.messages) { message in
                        MessageBubble(
                            message: message,
                            isFromCurrentUser: message.senderId == authService.currentUser?.id,
                            isRepliedTo: replyingToMessage?.id == message.id
                        )
                        .id(message.id)
                        .contextMenu {
                            // Reply option for all messages
                            Button(action: {
                                replyingToMessage = message
                                isInputFocused = true
                            }) {
                                Label("Reply", systemImage: "arrowshape.turn.up.left")
                            }
                            
                            // Report option only for messages from the other user
                            if message.senderId != authService.currentUser?.id {
                                Button(role: .destructive, action: {
                                    selectedMessageForReport = message
                                    showReportSheet = true
                                }) {
                                    Label("Report Message", systemImage: "exclamationmark.bubble")
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .onAppear {
                scrollProxy = proxy
                scrollToBottom()
            }
            .onChange(of: messageService.messages.count) { _, _ in
                scrollToBottom()
            }
        }
        .sheet(isPresented: $showReportSheet) {
            if let message = selectedMessageForReport {
                ReportView(
                    contentType: .message,
                    contentId: message.id,
                    contentTitle: "Message from \(otherProfile.firstName)"
                )
                .environmentObject(authService)
            }
        }
    }
    
    // MARK: - Input Bar
    
    private var inputBar: some View {
        VStack(spacing: 0) {
            // Reply preview bar (if replying to a message)
            if let replyMessage = replyingToMessage {
                HStack(spacing: 12) {
                    Rectangle()
                        .fill(AppTheme.brandBlue)
                        .frame(width: 3)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Replying to \(replyMessage.senderId == authService.currentUser?.id ? "yourself" : otherProfile.firstName)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(AppTheme.brandBlue)
                        
                        Text(replyMessage.content)
                            .font(.system(size: 14))
                            .foregroundColor(AppTheme.textSecondary)
                            .lineLimit(2)
                    }
                    
                    Spacer()
                    
                    Button(action: { replyingToMessage = nil }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(AppTheme.brandBlue.opacity(0.08))
            }
            
            // Input field
            HStack(spacing: 12) {
                // Text field
                HStack {
                    TextField("Message...", text: $messageText, axis: .vertical)
                        .font(.system(size: 16))
                        .lineLimit(1...5)
                        .focused($isInputFocused)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                }
                .background(AppTheme.cardBackground)
                .cornerRadius(24)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(AppTheme.border, lineWidth: 1)
                )
                
                // Send button
                Button(action: sendMessage) {
                    ZStack {
                        Circle()
                            .fill(canSend ? AppTheme.neonGreen : AppTheme.neonGreen.opacity(0.4))
                            .frame(width: 44, height: 44)
                        
                        Image(systemName: "paperplane.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                            .offset(x: -1, y: 1)
                    }
                }
                .disabled(!canSend)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(
            AppTheme.cardBackground
                .shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: -2)
        )
    }
    
    // MARK: - Helpers
    
    private var canSend: Bool {
        !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func scrollToBottom() {
        guard let lastMessage = messageService.messages.last else { return }
        withAnimation(.easeOut(duration: 0.2)) {
            scrollProxy?.scrollTo(lastMessage.id, anchor: .bottom)
        }
    }
    
    private func loadMessages() async {
        await messageService.fetchMessages(conversationId: conversation.id)
        await messageService.subscribeToMessages(conversationId: conversation.id)
        
        // Mark as read
        if let userId = authService.currentUser?.id {
            await messageService.markMessagesAsRead(conversationId: conversation.id, userId: userId)
        }
    }
    
    private func loadContextLabel() async {
        contextLabel = await messageService.getContextLabel(for: conversation)
    }
    
    private func sendMessage() {
        guard canSend,
              let userId = authService.currentUser?.id else { return }
        
        let content = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        messageText = ""
        
        // Clear reply state after sending
        replyingToMessage = nil
        
        Task {
            try? await messageService.sendMessage(
                conversationId: conversation.id,
                senderId: userId,
                content: content
            )
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: Message
    let isFromCurrentUser: Bool
    var isRepliedTo: Bool = false
    
    var body: some View {
        HStack {
            if isFromCurrentUser {
                Spacer(minLength: 60)
            }
            
            VStack(alignment: isFromCurrentUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.system(size: 16))
                    .foregroundColor(isFromCurrentUser ? .black : AppTheme.textPrimary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        isFromCurrentUser ? AppTheme.neonGreen : Color(hex: "E8E8ED")
                    )
                    .cornerRadius(18)
                    .cornerRadius(isFromCurrentUser ? 18 : 4, corners: [.topLeft])
                    .cornerRadius(isFromCurrentUser ? 4 : 18, corners: [.topRight])
                    .overlay(
                        // Highlight border when being replied to
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(AppTheme.brandBlue, lineWidth: isRepliedTo ? 2 : 0)
                    )
                
                Text(message.formattedTime)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(AppTheme.textTertiary)
            }
            
            if !isFromCurrentUser {
                Spacer(minLength: 60)
            }
        }
        .padding(.vertical, 2)
        .background(isRepliedTo ? AppTheme.brandBlue.opacity(0.05) : Color.clear)
        .animation(.easeInOut(duration: 0.2), value: isRepliedTo)
    }
}

// Corner radius extension for specific corners
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

#Preview {
    let sampleConversation = Conversation(
        id: UUID(),
        participant1: UUID(),
        participant2: UUID(),
        contextType: "post",
        contextId: UUID(),
        lastMessageAt: Date(),
        lastMessagePreview: "Sounds good!",
        createdAt: Date()
    )
    
    let sampleProfile = Profile(
        id: UUID(),
        firstName: "Alex",
        lastName: "Johnson",
        username: "alexj",
        bio: nil,
        avatarUrl: nil,
        favoriteSports: nil,
        locationLat: nil,
        locationLng: nil,
        visibilityRadiusMiles: nil,
        onboardingCompleted: true,
        createdAt: Date()
    )
    
    NavigationStack {
        ConversationView(
            conversation: sampleConversation,
            otherProfile: sampleProfile
        )
    }
    .environmentObject(AuthService())
}

