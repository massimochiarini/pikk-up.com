//
//  EditProfileView.swift
//  Sports App 1
//

import SwiftUI
import PhotosUI
import Auth

struct EditProfileView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    @StateObject private var profileService = ProfileService()
    
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var avatarImage: UIImage?
    @State private var username: String = ""
    @State private var bio: String = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var usernameStatus: UsernameStatus = .idle
    
    enum UsernameStatus: Equatable {
        case idle, checking, available, taken, invalid(String)
    }
    
    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 32) {
                    // Avatar
                    avatarSection
                    
                    // Username
                    usernameSection
                    
                    // Bio
                    bioSection
                    
                    // Error
                    if let error = errorMessage {
                        Text(error)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(AppTheme.error)
                    }
                }
                .padding(24)
            }
            .background(AppTheme.background)
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(AppTheme.textSecondary)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: saveProfile) {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Save")
                                .fontWeight(.semibold)
                        }
                    }
                    .foregroundColor(AppTheme.teal)
                    .disabled(isLoading || usernameStatus == .checking)
                }
            }
        }
        .onAppear {
            loadCurrentProfile()
        }
        .onChange(of: selectedPhoto) { _, newValue in
            Task {
                if let data = try? await newValue?.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    avatarImage = image
                }
            }
        }
    }
    
    // MARK: - Avatar Section
    
    private var avatarSection: some View {
        PhotosPicker(selection: $selectedPhoto, matching: .images) {
            VStack(spacing: 16) {
                ZStack {
                    if let image = avatarImage {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 120, height: 120)
                            .clipShape(Circle())
                    } else {
                        AvatarView(
                            url: authService.currentProfile?.avatarUrl,
                            initials: authService.currentProfile?.initials ?? "?",
                            size: 120,
                            showBorder: false
                        )
                    }
                    
                    Circle()
                        .fill(Color.black.opacity(0.4))
                        .frame(width: 120, height: 120)
                        .overlay(
                            Image(systemName: "camera.fill")
                                .font(.system(size: 24, weight: .semibold))
                                .foregroundColor(.white)
                        )
                        .opacity(0.8)
                }
                
                Text("Change Photo")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(AppTheme.teal)
            }
        }
    }
    
    // MARK: - Username Section
    
    private var usernameSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Username")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(AppTheme.textSecondary)
            
            HStack {
                Text("@")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundColor(AppTheme.textSecondary)
                
                TextField("username", text: $username)
                    .font(.system(size: 17))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .onChange(of: username) { _, newValue in
                        checkUsername(newValue)
                    }
                
                statusIcon
            }
            .padding()
            .background(AppTheme.cardBackground)
            .cornerRadius(AppTheme.cornerRadiusMedium)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                    .stroke(borderColor, lineWidth: 1)
            )
            
            if let message = statusMessage {
                Text(message)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(statusMessageColor)
            }
        }
    }
    
    @ViewBuilder
    private var statusIcon: some View {
        switch usernameStatus {
        case .checking:
            ProgressView().scaleEffect(0.8)
        case .available:
            Image(systemName: "checkmark.circle.fill").foregroundColor(AppTheme.success)
        case .taken:
            Image(systemName: "xmark.circle.fill").foregroundColor(AppTheme.error)
        case .invalid:
            Image(systemName: "exclamationmark.circle.fill").foregroundColor(AppTheme.warning)
        case .idle:
            EmptyView()
        }
    }
    
    private var borderColor: Color {
        switch usernameStatus {
        case .available: return AppTheme.success
        case .taken, .invalid: return AppTheme.error
        default: return AppTheme.border
        }
    }
    
    private var statusMessage: String? {
        switch usernameStatus {
        case .available: return "Username is available"
        case .taken: return "Username is taken"
        case .invalid(let msg): return msg
        default: return nil
        }
    }
    
    private var statusMessageColor: Color {
        switch usernameStatus {
        case .available: return AppTheme.success
        default: return AppTheme.error
        }
    }
    
    // MARK: - Bio Section
    
    private var bioSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Bio")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                
                Spacer()
                
                Text("\(bio.count)/150")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(bio.count > 150 ? AppTheme.error : AppTheme.textTertiary)
            }
            
            TextEditor(text: $bio)
                .font(.system(size: 16))
                .frame(minHeight: 100)
                .padding(12)
                .background(AppTheme.cardBackground)
                .cornerRadius(AppTheme.cornerRadiusMedium)
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                        .stroke(AppTheme.border, lineWidth: 1)
                )
        }
    }
    
    // MARK: - Actions
    
    private func loadCurrentProfile() {
        if let profile = authService.currentProfile {
            username = profile.username ?? ""
            bio = profile.bio ?? ""
            usernameStatus = .available
        }
    }
    
    private func checkUsername(_ username: String) {
        guard !username.isEmpty else {
            usernameStatus = .idle
            return
        }
        
        let validation = profileService.validateUsername(username)
        guard validation.isValid else {
            usernameStatus = .invalid(validation.message ?? "Invalid")
            return
        }
        
        usernameStatus = .checking
        
        Task {
            do {
                let available = try await profileService.checkUsernameAvailable(
                    username: username,
                    excludingUserId: authService.currentUser?.id
                )
                usernameStatus = available ? .available : .taken
            } catch {
                usernameStatus = .idle
            }
        }
    }
    
    private func saveProfile() {
        guard let userId = authService.currentUser?.id else { return }
        
        // Don't save if username is invalid
        if !username.isEmpty && usernameStatus != .available {
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Upload new avatar if selected
                if let image = avatarImage {
                    _ = try await profileService.uploadAvatar(userId: userId, image: image)
                }
                
                // Update profile
                let update = ProfileUpdate(
                    username: username.isEmpty ? nil : username.lowercased(),
                    bio: bio.isEmpty ? nil : bio,
                    favoriteSports: nil
                )
                
                try await profileService.updateProfile(userId: userId, updates: update)
                
                // Refresh auth service profile
                await authService.checkSession()
                
                dismiss()
                
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isLoading = false
        }
    }
}

#Preview {
    EditProfileView()
        .environmentObject(AuthService())
}

