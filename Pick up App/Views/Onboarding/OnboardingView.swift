//
//  OnboardingView.swift
//  Sports App 1
//

import SwiftUI
import PhotosUI
import Auth

enum OnboardingStep: Int, CaseIterable {
    case photo = 0
    case username = 1
    case bio = 2
    
    var title: String {
        switch self {
        case .photo: return "Add a photo"
        case .username: return "Pick a username"
        case .bio: return "Tell us about you"
        }
    }
    
    var subtitle: String {
        switch self {
        case .photo: return "Help others recognize you on the court"
        case .username: return "This is how people will find you"
        case .bio: return "Share a bit about yourself (optional)"
        }
    }
}

struct OnboardingView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var profileService = ProfileService()
    
    @State private var currentStep: OnboardingStep = .photo
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var avatarImage: UIImage?
    @State private var username = ""
    @State private var bio = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var usernameStatus: UsernameStatus = .idle
    @State private var showSignOutConfirmation = false
    
    enum UsernameStatus: Equatable {
        case idle
        case checking
        case available
        case taken
        case invalid(String)
    }
    
    private var progress: CGFloat {
        CGFloat(currentStep.rawValue + 1) / CGFloat(OnboardingStep.allCases.count)
    }
    
    private var canProceed: Bool {
        switch currentStep {
        case .photo:
            return true // Photo is optional
        case .username:
            return usernameStatus == .available
        case .bio:
            return true // Bio is optional
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Top bar with back button
            HStack {
                Button(action: {
                    if currentStep == .photo {
                        // On first step, show sign out confirmation
                        showSignOutConfirmation = true
                    } else {
                        goBack()
                    }
                }) {
                    Image(systemName: currentStep == .photo ? "xmark" : "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                        .frame(width: 44, height: 44)
                        .background(AppTheme.textPrimary.opacity(0.08))
                        .cornerRadius(12)
                }
                
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 8)
                
                // Progress bar
                ProgressBar(progress: progress)
                    .padding(.horizontal, 24)
                    .padding(.top, 12)
                
                // Content
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 32) {
                        // Header
                        VStack(spacing: 8) {
                            Text(currentStep.title)
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(AppTheme.textPrimary)
                            
                            Text(currentStep.subtitle)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(AppTheme.textSecondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.top, 40)
                        
                        // Step content
                        stepContent
                            .padding(.horizontal, 24)
                        
                        Spacer(minLength: 100)
                    }
                }
                
                // Bottom buttons
                bottomButtons
        }
        .background(AppTheme.background)
        .onChange(of: selectedPhoto) { _, newValue in
            Task {
                if let data = try? await newValue?.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    avatarImage = image
                }
            }
        }
        .alert("Go back to login?", isPresented: $showSignOutConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Sign Out", role: .destructive) {
                Task {
                    try? await authService.signOut()
                }
            }
        } message: {
            Text("You'll need to sign up again to continue.")
        }
    }
    
    // MARK: - Step Content
    
    @ViewBuilder
    private var stepContent: some View {
        switch currentStep {
        case .photo:
            photoStepContent
        case .username:
            usernameStepContent
        case .bio:
            bioStepContent
        }
    }
    
    private var photoStepContent: some View {
        VStack(spacing: 24) {
            // Avatar preview
            PhotosPicker(selection: $selectedPhoto, matching: .images) {
                ZStack {
                    if let image = avatarImage {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 160, height: 160)
                            .clipShape(Circle())
                    } else {
                        Circle()
                            .fill(AppTheme.divider)
                            .frame(width: 160, height: 160)
                            .overlay(
                                Image(systemName: "camera.fill")
                                    .font(.system(size: 40, weight: .semibold))
                                    .foregroundColor(AppTheme.textTertiary)
                            )
                    }
                    
                    // Edit badge
                    Circle()
                        .fill(AppTheme.neonGreen)
                        .frame(width: 44, height: 44)
                        .overlay(
                            Image(systemName: avatarImage == nil ? "plus" : "pencil")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(AppTheme.textPrimary)
                        )
                        .offset(x: 55, y: 55)
                }
            }
            
            Text(avatarImage == nil ? "Tap to add photo" : "Tap to change")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(AppTheme.textSecondary)
        }
        .padding(.vertical, 40)
    }
    
    private var usernameStepContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Username input
            HStack {
                Text("@")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                
                TextField("username", text: $username)
                    .font(.system(size: 20, weight: .medium))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .onChange(of: username) { _, newValue in
                        checkUsername(newValue)
                    }
                
                // Status indicator
                Group {
                    switch usernameStatus {
                    case .checking:
                        ProgressView()
                            .scaleEffect(0.8)
                    case .available:
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(AppTheme.success)
                    case .taken:
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(AppTheme.error)
                    case .invalid:
                        Image(systemName: "exclamationmark.circle.fill")
                            .foregroundColor(AppTheme.warning)
                    case .idle:
                        EmptyView()
                    }
                }
                .font(.system(size: 20))
            }
            .padding()
            .background(AppTheme.cardBackground)
            .cornerRadius(AppTheme.cornerRadiusMedium)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                    .stroke(borderColor, lineWidth: 2)
            )
            
            // Status message
            if let message = statusMessage {
                Text(message)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(statusMessageColor)
            }
            
            // Suggestions
            VStack(alignment: .leading, spacing: 8) {
                Text("Suggestions")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                
                HStack(spacing: 8) {
                    ForEach(usernameSuggestions, id: \.self) { suggestion in
                        Button(action: { username = suggestion }) {
                            Text("@\(suggestion)")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(AppTheme.textPrimary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(AppTheme.divider)
                                .cornerRadius(AppTheme.cornerRadiusPill)
                        }
                    }
                }
            }
            .padding(.top, 8)
        }
        .padding(.vertical, 20)
    }
    
    private var bioStepContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextEditor(text: $bio)
                .font(.system(size: 16))
                .frame(minHeight: 120)
                .padding(12)
                .background(AppTheme.cardBackground)
                .cornerRadius(AppTheme.cornerRadiusMedium)
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                        .stroke(AppTheme.border, lineWidth: 1)
                )
            
            Text("\(bio.count)/150")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(bio.count > 150 ? AppTheme.error : AppTheme.textTertiary)
                .frame(maxWidth: .infinity, alignment: .trailing)
            
            // Quick bio options
            VStack(alignment: .leading, spacing: 8) {
                Text("Quick adds")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                
                FlowLayout(spacing: 8) {
                    ForEach(bioSuggestions, id: \.self) { suggestion in
                        Button(action: {
                            if bio.isEmpty {
                                bio = suggestion
                            } else {
                                bio += " \(suggestion)"
                            }
                        }) {
                            Text(suggestion)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(AppTheme.textSecondary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(AppTheme.divider)
                                .cornerRadius(AppTheme.cornerRadiusPill)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 20)
    }
    
    // MARK: - Bottom Buttons
    
    private var bottomButtons: some View {
        VStack(spacing: 12) {
            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(AppTheme.error)
            }
            
            // Continue/Finish button
            Button(action: handleNext) {
                HStack {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .black))
                    } else {
                        Text(currentStep == .bio ? "Let's go!" : "Continue")
                            .font(.system(size: 17, weight: .semibold))
                    }
                }
                .foregroundColor(AppTheme.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(canProceed ? AppTheme.neonGreen : AppTheme.neonGreen.opacity(0.5))
                .cornerRadius(AppTheme.cornerRadiusLarge)
            }
            .disabled(!canProceed || isLoading)
            
            // Skip button (for optional steps)
            if currentStep == .photo || currentStep == .bio {
                Button(action: handleNext) {
                    Text("Skip for now")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                }
                .padding(.top, 4)
            }
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 40)
    }
    
    // MARK: - Helper Properties
    
    private var borderColor: Color {
        switch usernameStatus {
        case .available: return AppTheme.success
        case .taken, .invalid: return AppTheme.error
        default: return AppTheme.border
        }
    }
    
    private var statusMessage: String? {
        switch usernameStatus {
        case .available: return "Username is available!"
        case .taken: return "Username is already taken"
        case .invalid(let message): return message
        default: return nil
        }
    }
    
    private var statusMessageColor: Color {
        switch usernameStatus {
        case .available: return AppTheme.success
        case .taken, .invalid: return AppTheme.error
        default: return AppTheme.textSecondary
        }
    }
    
    private var usernameSuggestions: [String] {
        guard let profile = authService.currentProfile else { return [] }
        let base = profile.firstName.lowercased()
        return [
            base,
            "\(base)_\(Int.random(in: 1...99))",
            "\(base)plays"
        ]
    }
    
    private let bioSuggestions = [
        "🎾 Tennis lover",
        "🏸 Pickleball addict",
        "Always down to play",
        "Beginner friendly",
        "Competitive player",
        "Weekend warrior"
    ]
    
    // MARK: - Actions
    
    private func goBack() {
        withAnimation {
            if let previousStep = OnboardingStep(rawValue: currentStep.rawValue - 1) {
                currentStep = previousStep
            }
        }
    }
    
    private func handleNext() {
        withAnimation {
            if currentStep == .bio {
                completeOnboarding()
            } else if let nextStep = OnboardingStep(rawValue: currentStep.rawValue + 1) {
                currentStep = nextStep
            }
        }
    }
    
    private func checkUsername(_ username: String) {
        // Validate locally first
        let validation = profileService.validateUsername(username)
        guard validation.isValid else {
            usernameStatus = .invalid(validation.message ?? "Invalid username")
            return
        }
        
        guard !username.isEmpty else {
            usernameStatus = .idle
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
    
    private func completeOnboarding() {
        guard let userId = authService.currentUser?.id else { return }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Upload avatar if selected
                if let image = avatarImage {
                    _ = try await profileService.uploadAvatar(userId: userId, image: image)
                }
                
                // Update profile (default to pickleball as favorite sport)
                let update = ProfileUpdate(
                    username: username.isEmpty ? nil : username.lowercased(),
                    bio: bio.isEmpty ? nil : bio,
                    favoriteSports: ["pickleball"],
                    onboardingCompleted: true
                )
                
                // Get first/last name from profile or user metadata
                let firstName = authService.userFirstName
                let lastName = authService.userLastName
                
                try await profileService.updateProfile(
                    userId: userId,
                    updates: update,
                    firstName: firstName,
                    lastName: lastName
                )
                
                // Mark onboarding complete
                authService.completeOnboarding()
                
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isLoading = false
        }
    }
}

// MARK: - Supporting Views

struct ProgressBar: View {
    let progress: CGFloat
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(AppTheme.textPrimary.opacity(0.1))
                    .frame(height: 8)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(AppTheme.neonGreen)
                    .frame(width: geometry.size.width * progress, height: 8)
                    .animation(.spring(response: 0.3), value: progress)
            }
        }
        .frame(height: 8)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                      y: bounds.minY + result.positions[index].y),
                         proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var rowHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if x + size.width > maxWidth && x > 0 {
                    x = 0
                    y += rowHeight + spacing
                    rowHeight = 0
                }
                
                positions.append(CGPoint(x: x, y: y))
                rowHeight = max(rowHeight, size.height)
                x += size.width + spacing
            }
            
            self.size = CGSize(width: maxWidth, height: y + rowHeight)
        }
    }
}

#Preview {
    OnboardingView()
        .environmentObject(AuthService())
}
