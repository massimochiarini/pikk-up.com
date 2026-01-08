//
//  CreatePostSheet.swift
//  Sports App 1
//

import SwiftUI
import Auth

enum CreateMode: String, CaseIterable {
    case lookingToPlay = "looking"
    case createGame = "game"
    
    var title: String {
        switch self {
        case .lookingToPlay: return "I want to play"
        case .createGame: return "Create a game"
        }
    }
    
    var subtitle: String {
        switch self {
        case .lookingToPlay: return "Find someone to play with 1-on-1"
        case .createGame: return "Organize a match and invite others"
        }
    }
    
    var icon: String {
        switch self {
        case .lookingToPlay: return "person.wave.2.fill"
        case .createGame: return "calendar.badge.plus"
        }
    }
}

struct CreatePostSheet: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    @StateObject private var postService = PostService()
    
    @State private var selectedMode: CreateMode?
    @State private var selectedSport: Sport = .tennis
    @State private var headline = ""
    @State private var timeWindow = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    private let timeWindowSuggestions = [
        "Right now",
        "This morning",
        "This afternoon",
        "This evening",
        "After 5pm",
        "After 6pm",
        "After 7pm",
        "Tomorrow",
        "This weekend"
    ]
    
    private let headlineSuggestions = [
        "Anyone down for",
        "Looking for a partner for",
        "Who wants to play",
        "Need one more for"
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background
                    .ignoresSafeArea()
                
                if selectedMode == nil {
                    modeSelectionView
                } else if selectedMode == .lookingToPlay {
                    lookingToPlayForm
                } else {
                    // Redirect to existing CreateGameView
                    CreateGameView()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: handleBack) {
                        Image(systemName: selectedMode == nil ? "xmark" : "chevron.left")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                    }
                }
                
                if selectedMode != nil {
                    ToolbarItem(placement: .principal) {
                        Text(selectedMode?.title ?? "")
                            .font(.system(size: 17, weight: .semibold))
                    }
                }
            }
        }
    }
    
    // MARK: - Mode Selection
    
    private var modeSelectionView: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 8) {
                Text("What do you want to do?")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)
                
                Text("Choose how you want to connect")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(AppTheme.textSecondary)
            }
            .padding(.top, 40)
            
            // Options
            VStack(spacing: 16) {
                ForEach(CreateMode.allCases, id: \.rawValue) { mode in
                    ModeOptionCard(
                        mode: mode,
                        isSelected: selectedMode == mode,
                        onTap: {
                            withAnimation(.spring(response: 0.3)) {
                                selectedMode = mode
                            }
                        }
                    )
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 20)
            
            Spacer()
        }
    }
    
    // MARK: - Looking to Play Form
    
    private var lookingToPlayForm: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                // Sport selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("Sport")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppTheme.textSecondary)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(Sport.popular) { sport in
                                SportSelectButton(
                                    sport: sport,
                                    isSelected: selectedSport == sport,
                                    onTap: { selectedSport = sport }
                                )
                            }
                        }
                    }
                }
                
                // Headline
                VStack(alignment: .leading, spacing: 12) {
                    Text("What are you looking for?")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppTheme.textSecondary)
                    
                    TextField("e.g., Anyone down for tennis tonight?", text: $headline)
                        .font(.system(size: 16))
                        .padding()
                        .background(AppTheme.cardBackground)
                        .cornerRadius(AppTheme.cornerRadiusMedium)
                        .overlay(
                            RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                                .stroke(AppTheme.border, lineWidth: 1)
                        )
                    
                    // Quick suggestions
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(headlineSuggestions, id: \.self) { suggestion in
                                Button(action: {
                                    headline = "\(suggestion) \(selectedSport.displayName.lowercased())?"
                                }) {
                                    Text(suggestion)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(AppTheme.teal)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(AppTheme.teal.opacity(0.1))
                                        .cornerRadius(AppTheme.cornerRadiusPill)
                                }
                            }
                        }
                    }
                }
                
                // Time window
                VStack(alignment: .leading, spacing: 12) {
                    Text("When?")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppTheme.textSecondary)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(timeWindowSuggestions, id: \.self) { time in
                                TimeChip(
                                    text: time,
                                    isSelected: timeWindow == time,
                                    onTap: { timeWindow = time }
                                )
                            }
                        }
                    }
                }
                
                // Preview
                if !headline.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Preview")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(AppTheme.textSecondary)
                        
                        postPreview
                    }
                }
                
                // Error message
                if let error = errorMessage {
                    Text(error)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AppTheme.error)
                }
                
                // Post button
                Button(action: createPost) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Post")
                                .font(.system(size: 17, weight: .semibold))
                        }
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(canPost ? AppTheme.teal : AppTheme.teal.opacity(0.5))
                    .cornerRadius(AppTheme.cornerRadiusLarge)
                }
                .disabled(!canPost || isLoading)
                .padding(.top, 8)
            }
            .padding(24)
        }
    }
    
    // MARK: - Preview Card
    
    private var postPreview: some View {
        BaseCard(gradient: AppTheme.playerCardGradient, padding: 16) {
            HStack(spacing: 12) {
                AvatarView(
                    url: authService.currentProfile?.avatarUrl,
                    initials: authService.currentProfile?.initials ?? "?",
                    size: 44,
                    borderColor: .white,
                    borderWidth: 2
                )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(authService.currentProfile?.firstName ?? "You")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text(headline)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                        .lineLimit(2)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    SportIcon(sport: selectedSport, size: 16, foregroundColor: .white)
                    
                    if !timeWindow.isEmpty {
                        Text(timeWindow)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
            }
        }
    }
    
    // MARK: - Helpers
    
    private var canPost: Bool {
        !headline.trimmingCharacters(in: .whitespaces).isEmpty
    }
    
    private func handleBack() {
        if selectedMode == nil {
            dismiss()
        } else {
            withAnimation {
                selectedMode = nil
            }
        }
    }
    
    private func createPost() {
        guard let userId = authService.currentUser?.id else { return }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let newPost = NewPost(
                    userId: userId,
                    sport: selectedSport.rawValue,
                    headline: headline,
                    timeWindow: timeWindow.isEmpty ? nil : timeWindow,
                    expiresAt: Calendar.current.date(byAdding: .hour, value: 24, to: Date()),
                    locationLat: nil,
                    locationLng: nil
                )
                
                _ = try await postService.createPost(newPost)
                dismiss()
                
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isLoading = false
        }
    }
}

// MARK: - Supporting Views

struct ModeOptionCard: View {
    let mode: CreateMode
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(mode == .lookingToPlay ? AppTheme.coral.opacity(0.15) : AppTheme.teal.opacity(0.15))
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: mode.icon)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(mode == .lookingToPlay ? AppTheme.coral : AppTheme.teal)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(mode.title)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Text(mode.subtitle)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding(16)
            .background(AppTheme.cardBackground)
            .cornerRadius(AppTheme.cornerRadiusLarge)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusLarge)
                    .stroke(isSelected ? AppTheme.teal : AppTheme.border, lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct SportSelectButton: View {
    let sport: Sport
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 8) {
                Image(systemName: sport.icon)
                    .font(.system(size: 16, weight: .semibold))
                
                Text(sport.displayName)
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundColor(isSelected ? .white : sport.color)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(isSelected ? sport.color : sport.color.opacity(0.12))
            .cornerRadius(AppTheme.cornerRadiusPill)
        }
    }
}

struct TimeChip: View {
    let text: String
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(isSelected ? .white : AppTheme.textSecondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(isSelected ? AppTheme.teal : AppTheme.divider)
                .cornerRadius(AppTheme.cornerRadiusPill)
        }
    }
}

#Preview {
    CreatePostSheet()
        .environmentObject(AuthService())
}

