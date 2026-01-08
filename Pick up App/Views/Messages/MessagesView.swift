//
//  MessagesView.swift
//  Sports App 1
//

import SwiftUI
import Auth

struct MessagesView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var messageService = MessageService()
    
    @State private var selectedConversation: ConversationWithProfile?
    @State private var selectedGroupChat: GroupChatWithDetails?
    @State private var searchText = ""
    @State private var chatToDelete: ChatToDelete?
    @State private var showDeleteConfirmation = false
    
    enum ChatToDelete {
        case groupChat(GroupChatWithDetails)
        case conversation(ConversationWithProfile)
        
        var title: String {
            switch self {
            case .groupChat(let chat):
                return chat.groupChat.name
            case .conversation(let conv):
                return conv.otherProfile.fullName
            }
        }
        
        var isGroupChat: Bool {
            if case .groupChat = self { return true }
            return false
        }
    }
    
    var filteredConversations: [ConversationWithProfile] {
        if searchText.isEmpty {
            return messageService.conversations
        }
        return messageService.conversations.filter { conversation in
            conversation.otherProfile.fullName.localizedCaseInsensitiveContains(searchText) ||
            (conversation.otherProfile.username?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }
    
    var filteredGroupChats: [GroupChatWithDetails] {
        if searchText.isEmpty {
            return messageService.groupChats
        }
        return messageService.groupChats.filter { groupChat in
            groupChat.groupChat.name.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    headerView
                        .padding(.horizontal, 20)
                        .padding(.top, 16)
                    
                    // Search bar
                    searchBar
                    
                    if messageService.isLoading && messageService.conversations.isEmpty && messageService.groupChats.isEmpty {
                        loadingView
                    } else if messageService.conversations.isEmpty && messageService.groupChats.isEmpty {
                        emptyView
                    } else {
                        conversationsList
                    }
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(item: $selectedConversation) { conversation in
                ConversationView(
                    conversation: conversation.conversation,
                    otherProfile: conversation.otherProfile
                )
                .environmentObject(authService)
            }
            .navigationDestination(item: $selectedGroupChat) { groupChat in
                GroupConversationView(groupChat: groupChat)
                    .environmentObject(authService)
            }
        }
        .task {
            if let userId = authService.currentUser?.id {
                await messageService.fetchConversations(userId: userId)
                await messageService.fetchGroupChats(userId: userId)
            }
        }
        .alert("Delete Chat", isPresented: $showDeleteConfirmation, presenting: chatToDelete) { chat in
            Button("Cancel", role: .cancel) {
                chatToDelete = nil
            }
            Button(chat.isGroupChat ? "Leave" : "Delete", role: .destructive) {
                Task {
                    await deleteChat(chat)
                }
            }
        } message: { chat in
            if chat.isGroupChat {
                Text("Are you sure you want to leave \"\(chat.title)\"? You won't receive new messages from this game chat.")
            } else {
                Text("Are you sure you want to delete your conversation with \(chat.title)? This action cannot be undone.")
            }
        }
    }
    
    // MARK: - Delete Chat
    
    private func deleteChat(_ chat: ChatToDelete) async {
        guard let userId = authService.currentUser?.id else { return }
        
        do {
            switch chat {
            case .groupChat(let groupChat):
                try await messageService.leaveGroupChat(groupChatId: groupChat.groupChat.id, userId: userId)
            case .conversation(let conversation):
                try await messageService.deleteConversation(conversationId: conversation.conversation.id)
            }
        } catch {
            print("Error deleting chat: \(error)")
        }
        
        chatToDelete = nil
    }
    
    // MARK: - Conversations List
    
    private var conversationsList: some View {
        List {
            // Group Chats Section
            if !filteredGroupChats.isEmpty {
                Section {
                    ForEach(filteredGroupChats) { groupChat in
                        GroupChatRow(
                            groupChat: groupChat,
                            onTap: {
                                selectedGroupChat = groupChat
                            }
                        )
                        .listRowInsets(EdgeInsets())
                        .listRowSeparator(.hidden)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                chatToDelete = .groupChat(groupChat)
                                showDeleteConfirmation = true
                            } label: {
                                Label("Leave", systemImage: "rectangle.portrait.and.arrow.right")
                            }
                        }
                    }
                } header: {
                    sectionHeader(title: "Game Chats", icon: "sportscourt.fill")
                        .textCase(nil)
                        .listRowInsets(EdgeInsets())
                }
            }
            
            // Direct Messages Section
            if !filteredConversations.isEmpty {
                Section {
                    ForEach(filteredConversations) { conversationWithProfile in
                        ConversationRow(
                            conversation: conversationWithProfile,
                            onTap: {
                                selectedConversation = conversationWithProfile
                            }
                        )
                        .listRowInsets(EdgeInsets())
                        .listRowSeparator(.hidden)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                chatToDelete = .conversation(conversationWithProfile)
                                showDeleteConfirmation = true
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                } header: {
                    if !filteredGroupChats.isEmpty {
                        sectionHeader(title: "Direct Messages", icon: "bubble.left.fill")
                            .textCase(nil)
                            .listRowInsets(EdgeInsets())
                    }
                }
            }
        }
        .listStyle(.plain)
        .scrollIndicators(.hidden)
        .refreshable {
            if let userId = authService.currentUser?.id {
                await messageService.fetchConversations(userId: userId)
                await messageService.fetchGroupChats(userId: userId)
            }
        }
    }
    
    // MARK: - Section Header
    
    private func sectionHeader(title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(AppTheme.textTertiary)
            
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.top, 20)
        .padding(.bottom, 8)
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ForEach(0..<5, id: \.self) { _ in
                HStack(spacing: 12) {
                    Circle()
                        .fill(AppTheme.divider)
                        .frame(width: 56, height: 56)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(AppTheme.divider)
                            .frame(width: 120, height: 14)
                        
                        RoundedRectangle(cornerRadius: 4)
                            .fill(AppTheme.divider)
                            .frame(width: 200, height: 12)
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
        }
        .shimmering()
    }
    
    // MARK: - Empty View
    
    private var emptyView: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(AppTheme.divider)
                    .frame(width: 100, height: 100)
                
                Image(systemName: "bubble.left.and.bubble.right")
                    .font(.system(size: 40, weight: .semibold))
                    .foregroundColor(AppTheme.textTertiary)
            }
            
            VStack(spacing: 8) {
                Text("No messages yet")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                
                Text("Start a conversation by messaging someone\nfrom their profile or post")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(AppTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            Spacer()
        }
        .padding(40)
    }
    
    // MARK: - Header
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Messages")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
            }
            
            Spacer()
        }
        .padding(.bottom, 12)
    }
    
    // MARK: - Search Bar
    
    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(AppTheme.textTertiary)
            
            TextField("Search messages", text: $searchText)
                .font(.system(size: 16))
                .foregroundColor(AppTheme.textPrimary)
            
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundColor(AppTheme.textTertiary)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(AppTheme.background)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 2)
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}

// MARK: - Conversation Row

struct ConversationRow: View {
    let conversation: ConversationWithProfile
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Avatar with unread indicator
                ZStack(alignment: .topTrailing) {
                    AvatarView(
                        url: conversation.otherProfile.avatarUrl,
                        initials: conversation.otherProfile.initials,
                        size: 56,
                        showBorder: false
                    )
                    
                    if conversation.unreadCount > 0 {
                        Circle()
                            .fill(AppTheme.coral)
                            .frame(width: 12, height: 12)
                            .overlay(
                                Circle()
                                    .stroke(Color.white, lineWidth: 2)
                            )
                    }
                }
                
                // Content
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(conversation.otherProfile.fullName)
                            .font(.system(size: 16, weight: conversation.unreadCount > 0 ? .bold : .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Spacer()
                        
                        Text(conversation.conversation.timeAgo)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                    
                    if let preview = conversation.conversation.lastMessagePreview {
                        Text(preview)
                            .font(.system(size: 14, weight: conversation.unreadCount > 0 ? .semibold : .regular))
                            .foregroundColor(conversation.unreadCount > 0 ? AppTheme.textPrimary : AppTheme.textSecondary)
                            .lineLimit(1)
                    }
                }
                
                // Chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Group Chat Row

struct GroupChatRow: View {
    let groupChat: GroupChatWithDetails
    let onTap: () -> Void
    
    private var gameHasPassed: Bool {
        groupChat.game?.hasPassed ?? false
    }
    
    private var chatEmoji: String {
        let sport = groupChat.game?.sport.lowercased() ?? ""
        
        // Yoga emojis - pick one based on game ID for consistency
        let yogaEmojis = ["🧘", "🧘‍♀️", "🧘‍♂️", "🕉️", "🌸", "🌺", "🪷", "✨", "🌿", "🕊️"]
        
        if sport == "yoga" {
            // Use game ID to consistently pick the same emoji for the same game
            if let gameId = groupChat.game?.id.uuidString {
                let hash = abs(gameId.hash)
                let index = hash % yogaEmojis.count
                return yogaEmojis[index]
            }
            return yogaEmojis[0]
        }
        
        // Default to tennis/pickleball emoji for other sports
        return "🎾"
    }
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Group icon with emoji
                ZStack {
                    Circle()
                        .fill(gameHasPassed ? AppTheme.textTertiary.opacity(0.15) : AppTheme.neonGreen.opacity(0.15))
                        .frame(width: 56, height: 56)
                    
                    Text(chatEmoji)
                        .font(.system(size: 28))
                }
                
                // Content
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(groupChat.groupChat.name)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(gameHasPassed ? AppTheme.textSecondary : AppTheme.textPrimary)
                        
                        Spacer()
                        
                        if gameHasPassed {
                            Text("Game ended")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(AppTheme.textTertiary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(AppTheme.textTertiary.opacity(0.12))
                                .cornerRadius(4)
                        } else {
                            Text(groupChat.groupChat.timeAgo)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(AppTheme.textTertiary)
                        }
                    }
                    
                    HStack(spacing: 4) {
                        Text("\(groupChat.memberCount) \(groupChat.memberCount == 1 ? "player" : "players")")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(AppTheme.textSecondary)
                        
                        if let preview = groupChat.groupChat.lastMessagePreview {
                            Text("•")
                                .font(.system(size: 14))
                                .foregroundColor(AppTheme.textTertiary)
                            
                            Text(preview)
                                .font(.system(size: 14, weight: .regular))
                                .foregroundColor(AppTheme.textSecondary)
                                .lineLimit(1)
                        }
                    }
                }
                
                // Chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    MessagesView()
        .environmentObject(AuthService())
}

