//
//  GroupConversationView.swift
//  Sports App 1
//

import SwiftUI
import Auth

struct GroupConversationView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    let groupChat: GroupChatWithDetails
    
    @StateObject private var messageService = MessageService()
    @StateObject private var safetyService = SafetyService()
    
    @State private var messageText = ""
    @State private var members: [GroupChatMemberWithProfile] = []
    @State private var membersLoaded = false
    @State private var senderProfiles: [UUID: Profile] = [:] // Cache for all message sender profiles
    @State private var showMembersList = false
    @State private var scrollProxy: ScrollViewProxy?
    @State private var replyingTo: GroupMessage?
    @State private var errorMessage: String?
    @State private var showErrorAlert = false
    @State private var showReportSheet = false
    @State private var selectedMessageForReport: GroupMessage?
    @State private var reportedMessageSenderProfile: Profile?
    
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Game info header
            gameInfoHeader
            
            // Messages
            messagesScrollView
            
            // Input bar
            inputBar
        }
        .background(AppTheme.background)
        .navigationBarBackButtonHidden(true)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                BackButton(action: { dismiss() })
            }
            
            ToolbarItem(placement: .principal) {
                VStack(spacing: 0) {
                    Text(groupChat.groupChat.name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Text("\(displayMemberCount) \(displayMemberCount == 1 ? "member" : "members")")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                CircularToolbarButton(
                    icon: "person.2",
                    action: { showMembersList = true },
                    backgroundColor: AppTheme.textPrimary.opacity(0.1),
                    foregroundColor: AppTheme.textPrimary
                )
            }
        }
        .sheet(isPresented: $showMembersList) {
            membersListSheet
        }
        .alert("Message Failed", isPresented: $showErrorAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage ?? "Unknown error occurred")
        }
        .sheet(isPresented: $showReportSheet) {
            if let message = selectedMessageForReport {
                let senderName = reportedMessageSenderProfile?.fullName ?? "Unknown"
                ReportView(
                    contentType: .message,
                    contentId: message.id,
                    contentTitle: "Message from \(senderName)"
                )
                .environmentObject(authService)
            }
        }
        .task {
            await loadMessages()
            await loadMembers()
            await loadSenderProfiles()
        }
        .onDisappear {
            Task {
                await messageService.unsubscribeFromGroupMessages()
            }
        }
    }
    
    // MARK: - Game Info Header
    
    private var gameInfoHeader: some View {
        Group {
            if let game = groupChat.game {
                HStack(spacing: 12) {
                    Image(systemName: "sportscourt.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary.opacity(0.4))
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(game.formattedDate)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Text("\(game.formattedTime) • \(game.shortAddress)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(AppTheme.textSecondary)
                    }
                    
                    Spacer()
                    
                    NavigationLink(destination: GameDetailView(game: game).environmentObject(authService)) {
                        Text("View Game")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(AppTheme.textSecondary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(AppTheme.textPrimary.opacity(0.08))
                            .cornerRadius(16)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(AppTheme.cardBackground)
                .overlay(
                    Rectangle()
                        .fill(AppTheme.divider)
                        .frame(height: 1),
                    alignment: .bottom
                )
            }
        }
    }
    
    // MARK: - Messages Scroll View
    
    private var messagesScrollView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 4) {
                    ForEach(messageService.groupMessages) { message in
                        GroupMessageBubble(
                            message: message,
                            isFromCurrentUser: message.senderId == authService.currentUser?.id,
                            senderProfile: senderProfiles[message.senderId],
                            replyToSenderProfile: message.replyToSenderId.flatMap { senderProfiles[$0] },
                            onReply: {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    replyingTo = message
                                    isInputFocused = true
                                }
                            },
                            onReport: message.senderId != authService.currentUser?.id ? {
                                selectedMessageForReport = message
                                reportedMessageSenderProfile = senderProfiles[message.senderId]
                                showReportSheet = true
                            } : nil
                        )
                        .id(message.id)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .onAppear {
                scrollProxy = proxy
                scrollToBottom()
            }
            .onChange(of: messageService.groupMessages.count) { _, _ in
                scrollToBottom()
                // Fetch profiles for any new senders
                Task {
                    await loadSenderProfiles()
                }
            }
        }
    }
    
    // MARK: - Input Bar
    
    private var inputBar: some View {
        VStack(spacing: 0) {
            // Shadow line at top
            Rectangle()
                .fill(Color.clear)
                .frame(height: 1)
                .shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: -2)
            
            // Reply preview
            if let replyMessage = replyingTo {
                replyPreview(for: replyMessage)
            }
            
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
                            .fill(canSend ? AppTheme.neonGreen : AppTheme.neonGreen.opacity(0.5))
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
        .background(AppTheme.background.ignoresSafeArea(edges: .bottom))
    }
    
    // MARK: - Reply Preview
    
    private func replyPreview(for message: GroupMessage) -> some View {
        let senderProfile = senderProfiles[message.senderId]
        let senderName = message.senderId == authService.currentUser?.id ? "yourself" : (senderProfile?.firstName ?? senderProfile?.fullName ?? "someone")
        
        return HStack(spacing: 12) {
            // Accent bar
            RoundedRectangle(cornerRadius: 2)
                .fill(AppTheme.neonGreen)
                .frame(width: 4, height: 36)
            
            VStack(alignment: .leading, spacing: 2) {
                Text("Replying to \(senderName)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppTheme.neonGreenDark)
                
                Text(message.content)
                    .font(.system(size: 13))
                    .foregroundColor(AppTheme.textSecondary)
                    .lineLimit(1)
            }
            
            Spacer()
            
            // Close button
            Button(action: {
                withAnimation(.easeInOut(duration: 0.2)) {
                    replyingTo = nil
                }
            }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 22))
                    .foregroundColor(AppTheme.textTertiary)
            }
        }
        .frame(height: 50)
        .padding(.horizontal, 16)
        .background(AppTheme.background)
        .overlay(
            Rectangle()
                .fill(AppTheme.divider)
                .frame(height: 1),
            alignment: .top
        )
    }
    
    // MARK: - Members List Sheet
    
    private var membersListSheet: some View {
        NavigationStack {
            List(members) { memberWithProfile in
                HStack(spacing: 12) {
                    AvatarView(
                        url: memberWithProfile.profile.avatarUrl,
                        initials: memberWithProfile.profile.initials,
                        size: 44,
                        showBorder: false
                    )
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(memberWithProfile.profile.fullName)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        if let username = memberWithProfile.profile.username {
                            Text("@\(username)")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                    
                    Spacer()
                    
                    // Show "Host" badge for game creator
                    if let game = groupChat.game, memberWithProfile.member.userId == game.createdBy {
                        Text("Host")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(AppTheme.brandBlue)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(AppTheme.brandBlue.opacity(0.12))
                            .cornerRadius(8)
                    }
                }
                .padding(.vertical, 4)
            }
            .listStyle(.plain)
            .navigationTitle("Members")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showMembersList = false
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
    
    // MARK: - Helpers
    
    private var displayMemberCount: Int {
        // Use loaded members count once loaded, otherwise fall back to passed-in count
        membersLoaded ? members.count : groupChat.memberCount
    }
    
    private var canSend: Bool {
        !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func scrollToBottom() {
        guard let lastMessage = messageService.groupMessages.last else { return }
        withAnimation(.easeOut(duration: 0.2)) {
            scrollProxy?.scrollTo(lastMessage.id, anchor: .bottom)
        }
    }
    
    private func loadMessages() async {
        await messageService.fetchGroupMessages(groupChatId: groupChat.groupChat.id)
        await messageService.subscribeToGroupMessages(groupChatId: groupChat.groupChat.id)
    }
    
    private func loadMembers() async {
        do {
            members = try await messageService.getGroupChatMembers(groupChatId: groupChat.groupChat.id)
            membersLoaded = true
            // Also add member profiles to senderProfiles cache
            for member in members {
                senderProfiles[member.member.userId] = member.profile
            }
        } catch {
            print("Error loading members: \(error)")
            membersLoaded = true  // Mark as loaded even on error to show actual count (0)
        }
    }
    
    private func loadSenderProfiles() async {
        // Get all unique sender IDs from messages that we don't have profiles for
        let allSenderIds = Set(messageService.groupMessages.map { $0.senderId })
        let replySenderIds = Set(messageService.groupMessages.compactMap { $0.replyToSenderId })
        let allIds = allSenderIds.union(replySenderIds)
        let missingIds = allIds.filter { senderProfiles[$0] == nil }
        
        guard !missingIds.isEmpty else { return }
        
        // Fetch missing profiles
        do {
            let profiles = try await messageService.fetchProfiles(userIds: Array(missingIds))
            for profile in profiles {
                senderProfiles[profile.id] = profile
            }
        } catch {
            print("Error loading sender profiles: \(error)")
        }
    }
    
    private func sendMessage() {
        guard canSend,
              let userId = authService.currentUser?.id else { return }
        
        let content = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        let replyMessage = replyingTo
        messageText = ""
        
        // Clear reply state with animation
        withAnimation(.easeInOut(duration: 0.2)) {
            replyingTo = nil
        }
        
        Task {
            do {
                try await messageService.sendGroupMessage(
                    groupChatId: groupChat.groupChat.id,
                    senderId: userId,
                    content: content,
                    replyTo: replyMessage
                )
                
                // Refresh messages to ensure we have the complete data including reply fields
                await messageService.fetchGroupMessages(groupChatId: groupChat.groupChat.id)
                await loadSenderProfiles()
                
            } catch {
                print("Error sending message with reply: \(error)")
                // If reply failed (possibly due to missing columns), try without reply
                if replyMessage != nil {
                    do {
                        try await messageService.sendGroupMessage(
                            groupChatId: groupChat.groupChat.id,
                            senderId: userId,
                            content: content,
                            replyTo: nil
                        )
                        print("Message sent without reply")
                    } catch {
                        print("Error sending message: \(error)")
                        await MainActor.run {
                            messageText = content
                            errorMessage = error.localizedDescription
                            showErrorAlert = true
                        }
                    }
                } else {
                    await MainActor.run {
                        messageText = content
                        errorMessage = error.localizedDescription
                        showErrorAlert = true
                    }
                }
            }
        }
    }
}

// MARK: - Group Message Bubble

struct GroupMessageBubble: View {
    let message: GroupMessage
    let isFromCurrentUser: Bool
    let senderProfile: Profile?
    var replyToSenderProfile: Profile? = nil
    var onReply: (() -> Void)? = nil
    var onReport: (() -> Void)? = nil
    
    private var replyContent: String? {
        message.replyToContent
    }
    
    private var replyName: String {
        replyToSenderProfile?.firstName ?? replyToSenderProfile?.fullName ?? "Someone"
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            if isFromCurrentUser {
                Spacer(minLength: 60)
            } else {
                // Show avatar for other users
                AvatarView(
                    url: senderProfile?.avatarUrl,
                    initials: senderProfile?.initials ?? "?",
                    size: 28,
                    showBorder: false
                )
            }
            
            VStack(alignment: isFromCurrentUser ? .trailing : .leading, spacing: 0) {
                // Show name for other users
                if !isFromCurrentUser, let profile = senderProfile {
                    Text(profile.firstName)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(AppTheme.textSecondary)
                        .padding(.bottom, 4)
                }
                
                // Reply preview with connecting line (iMessage style)
                if message.hasReply {
                    replyBubbleWithLine
                }
                
                // Main message bubble
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
                    .contextMenu {
                        Button(action: {
                            onReply?()
                        }) {
                            Label("Reply", systemImage: "arrowshape.turn.up.left")
                        }
                        
                        Button(action: {
                            UIPasteboard.general.string = message.content
                        }) {
                            Label("Copy", systemImage: "doc.on.doc")
                        }
                        
                        // Show report option only for messages from other users
                        if let reportAction = onReport {
                            Button(role: .destructive, action: reportAction) {
                                Label("Report Message", systemImage: "exclamationmark.bubble")
                            }
                        }
                    }
                
                Text(message.formattedTime)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(AppTheme.textTertiary)
                    .padding(.top, 4)
            }
            
            if !isFromCurrentUser {
                Spacer(minLength: 60)
            }
        }
        .padding(.vertical, 2)
    }
    
    // MARK: - Reply Bubble with Connecting Line (iMessage style)
    
    private var replyBubbleWithLine: some View {
        HStack(alignment: .bottom, spacing: 0) {
            if isFromCurrentUser {
                Spacer(minLength: 40)
            }
            
            // Connecting line on the left for others' messages
            if !isFromCurrentUser {
                VStack(spacing: 0) {
                    Spacer()
                    Path { path in
                        path.move(to: CGPoint(x: 12, y: 0))
                        path.addLine(to: CGPoint(x: 12, y: 20))
                        path.addQuadCurve(to: CGPoint(x: 20, y: 28), control: CGPoint(x: 12, y: 28))
                    }
                    .stroke(AppTheme.textPrimary.opacity(0.2), lineWidth: 2)
                    .frame(width: 24, height: 30)
                }
            }
            
            // Reply content bubble
            VStack(alignment: .leading, spacing: 2) {
                Text(replyName)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(isFromCurrentUser ? AppTheme.neonGreenDark : AppTheme.textSecondary)
                
                Text(replyContent ?? "Message")
                    .font(.system(size: 13))
                    .foregroundColor(AppTheme.textSecondary)
                    .lineLimit(2)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(AppTheme.textPrimary.opacity(0.06))
            .cornerRadius(12)
            
            // Connecting line on the right for current user's messages
            if isFromCurrentUser {
                VStack(spacing: 0) {
                    Spacer()
                    Path { path in
                        path.move(to: CGPoint(x: 12, y: 0))
                        path.addLine(to: CGPoint(x: 12, y: 20))
                        path.addQuadCurve(to: CGPoint(x: 4, y: 28), control: CGPoint(x: 12, y: 28))
                    }
                    .stroke(AppTheme.textPrimary.opacity(0.2), lineWidth: 2)
                    .frame(width: 24, height: 30)
                }
            }
            
            if !isFromCurrentUser {
                Spacer(minLength: 40)
            }
        }
        .padding(.bottom, 4)
    }
}

#Preview {
    let sampleGroupChat = GroupChat(
        id: UUID(),
        gameId: UUID(),
        name: "Flamingo Park Pickleball",
        lastMessageAt: Date(),
        lastMessagePreview: "See you there!",
        createdAt: Date()
    )
    
    NavigationStack {
        GroupConversationView(
            groupChat: GroupChatWithDetails(
                groupChat: sampleGroupChat,
                memberCount: 4,
                game: nil
            )
        )
    }
    .environmentObject(AuthService())
}
