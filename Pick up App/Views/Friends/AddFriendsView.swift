//
//  AddFriendsView.swift
//  Sports App 1
//

import SwiftUI
import Contacts
import ContactsUI
import MessageUI
import Auth

// MARK: - Contact Model
struct ImportedContact: Identifiable, Hashable {
    let id = UUID()
    let firstName: String
    let lastName: String
    let phoneNumber: String?
    let email: String?
    let imageData: Data?
    
    var fullName: String {
        "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
    }
    
    var initials: String {
        let first = firstName.first.map { String($0) } ?? ""
        let last = lastName.first.map { String($0) } ?? ""
        return "\(first)\(last)".uppercased()
    }
    
    var hasContactInfo: Bool {
        phoneNumber != nil || email != nil
    }
}

struct AddFriendsView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    @StateObject private var profileService = ProfileService()
    @State private var searchText = ""
    @State private var searchResults: [Profile] = []
    @State private var isSearching = false
    @State private var hasSearched = false
    @State private var selectedProfile: Profile?
    
    // Contacts
    @State private var importedContacts: [ImportedContact] = []
    @State private var contactsPermissionStatus: CNAuthorizationStatus = .notDetermined
    @State private var isLoadingContacts = false
    @State private var showMessageComposer = false
    @State private var selectedContact: ImportedContact?
    @State private var invitedContacts: Set<UUID> = []
    
    private let appDownloadLink = "https://apps.apple.com/app/pickup"
    
    // Debounce timer for search
    @State private var searchTask: Task<Void, Never>?
    
    var filteredContacts: [ImportedContact] {
        if searchText.isEmpty {
            return importedContacts
        }
        return importedContacts.filter { contact in
            contact.fullName.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                searchBar
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 16)
                
                Divider()
                
                ScrollView {
                    VStack(spacing: 0) {
                        // Import Contacts Section (only show if not already imported)
                        if importedContacts.isEmpty && !isLoadingContacts {
                            importContactsSection
                        }
                        
                        // Loading indicator
                        if isLoadingContacts {
                            VStack(spacing: 12) {
                                ProgressView()
                                Text("Loading contacts...")
                                    .font(.subheadline)
                                    .foregroundColor(AppTheme.textSecondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                        }
                        
                        // Imported Contacts List (if any)
                        if !filteredContacts.isEmpty {
                            importedContactsList
                        }
                        
                        // Search Results Section
                        if isSearching {
                            loadingView
                        } else if !searchResults.isEmpty {
                            searchResultsSection
                        } else if hasSearched && searchResults.isEmpty && searchText.count >= 2 {
                            noResultsView
                        } else if importedContacts.isEmpty && searchResults.isEmpty && !hasSearched && !isLoadingContacts {
                            emptyStateView
                        }
                    }
                }
            }
            .background(AppTheme.background)
            .navigationTitle("Add Friends")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(AppTheme.textSecondary)
                }
            }
            .navigationDestination(item: $selectedProfile) { profile in
                OtherProfileView(profile: profile)
                    .environmentObject(authService)
            }
            .sheet(isPresented: $showMessageComposer) {
                if let contact = selectedContact {
                    if MFMessageComposeViewController.canSendText() {
                        MessageComposerView(
                            contact: contact,
                            appLink: appDownloadLink,
                            onSent: {
                                invitedContacts.insert(contact.id)
                            }
                        )
                    }
                }
            }
            .onAppear {
                checkContactsPermission()
            }
        }
    }
    
    // MARK: - Contacts Permission & Fetching
    
    private func checkContactsPermission() {
        contactsPermissionStatus = CNContactStore.authorizationStatus(for: .contacts)
    }
    
    private func requestContactsAccess() {
        let store = CNContactStore()
        isLoadingContacts = true
        
        store.requestAccess(for: .contacts) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    self.contactsPermissionStatus = .authorized
                    self.fetchAllContacts()
                } else {
                    self.contactsPermissionStatus = .denied
                    self.isLoadingContacts = false
                }
            }
        }
    }
    
    private func fetchAllContacts() {
        let store = CNContactStore()
        let keysToFetch: [CNKeyDescriptor] = [
            CNContactGivenNameKey as CNKeyDescriptor,
            CNContactFamilyNameKey as CNKeyDescriptor,
            CNContactPhoneNumbersKey as CNKeyDescriptor,
            CNContactEmailAddressesKey as CNKeyDescriptor,
            CNContactThumbnailImageDataKey as CNKeyDescriptor
        ]
        
        let request = CNContactFetchRequest(keysToFetch: keysToFetch)
        request.sortOrder = .givenName
        
        DispatchQueue.global(qos: .userInitiated).async {
            var contacts: [ImportedContact] = []
            
            do {
                try store.enumerateContacts(with: request) { cnContact, _ in
                    let firstName = cnContact.givenName
                    let lastName = cnContact.familyName
                    let phoneNumber = cnContact.phoneNumbers.first?.value.stringValue
                    let email = cnContact.emailAddresses.first?.value as String?
                    let imageData = cnContact.thumbnailImageData
                    
                    // Only include contacts with a name and contact info
                    if (!firstName.isEmpty || !lastName.isEmpty) && (phoneNumber != nil || email != nil) {
                        contacts.append(ImportedContact(
                            firstName: firstName,
                            lastName: lastName,
                            phoneNumber: phoneNumber,
                            email: email,
                            imageData: imageData
                        ))
                    }
                }
            } catch {
                print("Error fetching contacts: \(error)")
            }
            
            DispatchQueue.main.async {
                self.importedContacts = contacts
                self.isLoadingContacts = false
            }
        }
    }
    
    // MARK: - Import Contacts Section
    
    private var importContactsSection: some View {
        VStack(spacing: 0) {
            if contactsPermissionStatus == .denied {
                // Permission denied - show settings prompt
                Button(action: { openSettings() }) {
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(AppTheme.brandBlue.opacity(0.12))
                                .frame(width: 50, height: 50)
                            
                            Image(systemName: "gear")
                                .font(.system(size: 22))
                                .foregroundColor(AppTheme.brandBlue)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Enable Contacts Access")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppTheme.textPrimary)
                            
                            Text("Open Settings to allow access")
                                .font(.system(size: 13))
                                .foregroundColor(AppTheme.textSecondary)
                        }
                        
                        Spacer()
                        
                        Image(systemName: "arrow.up.forward")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 14)
                    .contentShape(Rectangle())
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                // Not determined or authorized - show import button
                Button(action: { requestContactsAccess() }) {
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(AppTheme.brandBlue.opacity(0.12))
                                .frame(width: 50, height: 50)
                            
                            Image(systemName: "person.crop.circle.badge.plus")
                                .font(.system(size: 22))
                                .foregroundColor(AppTheme.brandBlue)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Import Contacts")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppTheme.textPrimary)
                            
                            Text("Invite friends to join Pickup")
                                .font(.system(size: 13))
                                .foregroundColor(AppTheme.textSecondary)
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 14)
                    .contentShape(Rectangle())
                }
                .buttonStyle(PlainButtonStyle())
            }
            
            Divider()
                .padding(.leading, 84)
        }
    }
    
    private func openSettings() {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
    
    // MARK: - Imported Contacts List
    
    private var importedContactsList: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header
            HStack {
                Text("Your Contacts (\(filteredContacts.count))")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                    .textCase(.uppercase)
                
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 12)
            
            ForEach(filteredContacts) { contact in
                ContactRow(
                    contact: contact,
                    isInvited: invitedContacts.contains(contact.id),
                    onInvite: {
                        selectedContact = contact
                        if MFMessageComposeViewController.canSendText() {
                            showMessageComposer = true
                        } else {
                            // Fallback: share via share sheet
                            shareInvite(for: contact)
                        }
                    }
                )
                .padding(.horizontal, 20)
                
                if contact.id != filteredContacts.last?.id {
                    Divider()
                        .padding(.leading, 84)
                }
            }
            
            Divider()
                .padding(.top, 8)
        }
    }
    
    // MARK: - Search Results Section
    
    private var searchResultsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header
            Text("Users on Pickup")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(AppTheme.textSecondary)
                .textCase(.uppercase)
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 12)
            
            ForEach(searchResults) { profile in
                UserSearchRow(profile: profile) {
                    selectedProfile = profile
                }
                
                Divider()
                    .padding(.leading, 84)
            }
        }
    }
    
    private func shareInvite(for contact: ImportedContact) {
        let message = "play pickleball with me\n\(appDownloadLink)"
        
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first,
              let rootVC = window.rootViewController else { return }
        
        let activityVC = UIActivityViewController(activityItems: [message], applicationActivities: nil)
        
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = rootVC.view
            popover.sourceRect = CGRect(x: UIScreen.main.bounds.width / 2, y: UIScreen.main.bounds.height / 2, width: 0, height: 0)
        }
        
        rootVC.present(activityVC, animated: true) {
            self.invitedContacts.insert(contact.id)
        }
    }
    
    // MARK: - Search Bar
    
    private var searchBar: some View {
        HStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(AppTheme.textSecondary)
            
            TextField("Search by name or username", text: $searchText)
                .font(.system(size: 16))
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .onChange(of: searchText) { _, newValue in
                    performSearch(query: newValue)
                }
            
            if !searchText.isEmpty {
                Button(action: {
                    searchText = ""
                    searchResults = []
                    hasSearched = false
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(AppTheme.textTertiary)
                }
            }
        }
        .padding(14)
        .background(AppTheme.textPrimary.opacity(0.06))
        .cornerRadius(12)
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .scaleEffect(1.2)
            Text("Searching...")
                .font(.system(size: 14))
                .foregroundColor(AppTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    // MARK: - No Results View
    
    private var noResultsView: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.slash")
                .font(.system(size: 48))
                .foregroundColor(AppTheme.textTertiary)
            
            Text("No users found")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(AppTheme.textPrimary)
            
            Text("Try a different name or username")
                .font(.system(size: 14))
                .foregroundColor(AppTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    // MARK: - Empty State View
    
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 48))
                .foregroundColor(AppTheme.textTertiary)
            
            Text("Find friends to play with")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(AppTheme.textPrimary)
            
            Text("Search for players by name or username")
                .font(.system(size: 14))
                .foregroundColor(AppTheme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    // MARK: - Search Logic
    
    private func performSearch(query: String) {
        // Cancel previous search task
        searchTask?.cancel()
        
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            searchResults = []
            hasSearched = false
            isSearching = false
            return
        }
        
        // Debounce search by 300ms
        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            
            guard !Task.isCancelled else { return }
            
            await MainActor.run {
                isSearching = true
            }
            
            do {
                let results = try await profileService.searchUsers(
                    query: query,
                    excludingUserId: authService.currentUser?.id
                )
                
                guard !Task.isCancelled else { return }
                
                await MainActor.run {
                    searchResults = results
                    hasSearched = true
                    isSearching = false
                }
            } catch {
                print("Search error: \(error)")
                await MainActor.run {
                    searchResults = []
                    hasSearched = true
                    isSearching = false
                }
            }
        }
    }
}

// MARK: - User Search Row

struct UserSearchRow: View {
    let profile: Profile
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Avatar
                AvatarView(
                    url: profile.avatarUrl,
                    initials: profile.initials,
                    size: 50,
                    showBorder: false
                )
                
                // User info
                VStack(alignment: .leading, spacing: 4) {
                    Text(profile.fullName)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    if let username = profile.username {
                        Text("@\(username)")
                            .font(.system(size: 14))
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
                
                Spacer()
                
                // Chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Contact Row

struct ContactRow: View {
    let contact: ImportedContact
    let isInvited: Bool
    let onInvite: () -> Void
    
    var body: some View {
        HStack(spacing: 14) {
            // Avatar
            if let imageData = contact.imageData,
               let uiImage = UIImage(data: imageData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 50, height: 50)
                    .clipShape(Circle())
            } else {
                Circle()
                    .fill(AppTheme.textPrimary.opacity(0.1))
                    .frame(width: 50, height: 50)
                    .overlay(
                        Text(contact.initials)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(AppTheme.textSecondary)
                    )
            }
            
            // Name and contact info
            VStack(alignment: .leading, spacing: 2) {
                Text(contact.fullName)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(AppTheme.textPrimary)
                
                if let phone = contact.phoneNumber {
                    Text(phone)
                        .font(.system(size: 13))
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
            
            Spacer()
            
            // Invite button
            if contact.hasContactInfo {
                Button(action: onInvite) {
                    if isInvited {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark")
                            Text("Invited")
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(AppTheme.textPrimary.opacity(0.08))
                        .cornerRadius(16)
                    } else {
                        Text("Invite")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 6)
                            .background(AppTheme.brandBlue)
                            .cornerRadius(16)
                    }
                }
                .disabled(isInvited)
            }
        }
        .padding(.vertical, 10)
    }
}

// MARK: - Message Composer (UIKit Wrapper)

struct MessageComposerView: UIViewControllerRepresentable {
    let contact: ImportedContact
    let appLink: String
    let onSent: () -> Void
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> MFMessageComposeViewController {
        let composer = MFMessageComposeViewController()
        composer.messageComposeDelegate = context.coordinator
        
        // Set recipient
        if let phone = contact.phoneNumber {
            composer.recipients = [phone]
        }
        
        // Set message body
        composer.body = "play pickleball with me\n\(appLink)"
        
        return composer
    }
    
    func updateUIViewController(_ uiViewController: MFMessageComposeViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MFMessageComposeViewControllerDelegate {
        let parent: MessageComposerView
        
        init(_ parent: MessageComposerView) {
            self.parent = parent
        }
        
        func messageComposeViewController(_ controller: MFMessageComposeViewController, didFinishWith result: MessageComposeResult) {
            if result == .sent {
                parent.onSent()
            }
            parent.dismiss()
        }
    }
}

#Preview {
    AddFriendsView()
        .environmentObject(AuthService.shared)
}
