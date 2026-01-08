//
//  CreateGameView.swift
//  Sports App 1
//

import SwiftUI
import Auth
import MapKit

struct CreateGameView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var gameService: GameService
    @EnvironmentObject var locationManager: LocationManager
    @Environment(\.dismiss) var dismiss
    
    let existingGame: Game?
    let onGameDeleted: (() -> Void)?
    
    @State private var location = ""
    @State private var venueName = ""
    @State private var venueSearchText = ""
    @State private var venueSearchResults: [MKMapItem] = []
    @State private var isSearchingVenues = false
    @State private var showVenueResults = false
    @State private var hasSelectedVenue = false
    @State private var gameDate = Date()
    @State private var selectedTimeSlot: Date = Date()
    @State private var costDollars = 0
    @State private var selectedSkillLevel: SkillLevel? = nil
    
    // New fields for instructor features
    @State private var customTitle = ""
    @State private var selectedLatitude: Double? = nil
    @State private var selectedLongitude: Double? = nil
    @State private var showLocationPicker = false
    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 25.7617, longitude: -80.1918), // Miami default
        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
    )
    
    @State private var isLoading = false
    @State private var isDeleting = false
    @State private var errorMessage: String?
    @State private var showDeleteConfirmation = false
    
    @FocusState private var isVenueFieldFocused: Bool
    
    // Pickleball always has 4 players
    private let maxPlayers = 4
    
    // Generate time slots in 30-minute increments
    private var timeSlots: [Date] {
        var slots: [Date] = []
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        for hour in 0..<24 {
            for minute in stride(from: 0, to: 60, by: 30) {
                if let time = calendar.date(bySettingHour: hour, minute: minute, second: 0, of: today) {
                    slots.append(time)
                }
            }
        }
        return slots
    }
    
    private func timeString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }
    
    var isEditMode: Bool { existingGame != nil }
    var isFormValid: Bool { 
        !location.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !venueName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    init(existingGame: Game? = nil, onGameDeleted: (() -> Void)? = nil) {
        self.existingGame = existingGame
        self.onGameDeleted = onGameDeleted
    }
    
    var body: some View {
        NavigationView {
            formContent
                .background(AppTheme.background)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") { dismiss() }
                            .foregroundColor(AppTheme.textPrimary)
                    }
                }
                .alert("Delete Game?", isPresented: $showDeleteConfirmation) {
                    Button("Cancel", role: .cancel) { }
                    Button("Delete", role: .destructive) { deleteGame() }
                } message: {
                    Text("Are you sure you want to delete this game? This action cannot be undone.")
                }
                .onAppear {
                    if let game = existingGame {
                        prefillForm(with: game)
                    }
                }
        }
    }
    
    private var formContent: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                headerSection
                locationSection
                locationPickerSection
                dateTimeSection
                costSection
                skillLevelSection
                errorSection
                actionButtons
                Spacer(minLength: 40)
            }
            .padding(24)
        }
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(isEditMode ? "Edit Game" : "Schedule a Game")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(AppTheme.textPrimary)
            Text(isEditMode ? "Update your game details." : "Organize a match and invite others to join!")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(AppTheme.textSecondary)
        }
    }
    
    // MARK: - Custom Title Section
    
    private var customTitleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Event Title")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(AppTheme.textSecondary)
            
            TextField("e.g., Morning Vinyasa Flow", text: $customTitle)
                .font(.system(size: 16))
                .foregroundColor(AppTheme.textPrimary)
                .padding()
                .background(AppTheme.cardBackground)
                .cornerRadius(AppTheme.cornerRadiusMedium)
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                        .stroke(AppTheme.border, lineWidth: 1)
                )
            
            Text("This is what players will see as the event name")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(AppTheme.textTertiary)
        }
    }
    
    // MARK: - Location Picker Section
    
    private var locationPickerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Adjust Pin Location")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                
                Text("(Optional)")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(AppTheme.textTertiary)
            }
            
            HStack(spacing: 8) {
                Button(action: {
                    showLocationPicker = true
                }) {
                    HStack {
                        Image(systemName: "map.fill")
                            .font(.system(size: 16))
                        
                        if let lat = selectedLatitude, let lng = selectedLongitude {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Custom location set")
                                    .font(.system(size: 14, weight: .semibold))
                                Text("Lat: \(lat, specifier: "%.6f"), Lng: \(lng, specifier: "%.6f")")
                                    .font(.system(size: 11))
                                    .foregroundColor(AppTheme.textTertiary)
                            }
                        } else {
                            Text("Set precise location on map")
                                .font(.system(size: 14, weight: .medium))
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                    .foregroundColor(AppTheme.textPrimary)
                    .padding()
                    .background(AppTheme.cardBackground)
                    .cornerRadius(AppTheme.cornerRadiusMedium)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                            .stroke(selectedLatitude != nil ? AppTheme.success : AppTheme.border, lineWidth: selectedLatitude != nil ? 2 : 1)
                    )
                }
                
                // Clear button if coordinates are set
                if selectedLatitude != nil && selectedLongitude != nil {
                    Button(action: {
                        selectedLatitude = nil
                        selectedLongitude = nil
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(AppTheme.textTertiary)
                    }
                }
            }
            
            Text("Fine-tune the exact location (e.g., back house studio)")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(AppTheme.textTertiary)
        }
        .sheet(isPresented: $showLocationPicker) {
            LocationPickerView(
                region: $mapRegion,
                selectedLatitude: $selectedLatitude,
                selectedLongitude: $selectedLongitude,
                address: location
            )
        }
    }
    
    // MARK: - Location
    
    private var locationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Venue Name Field with Search (PRIMARY - user enters this first)
            VStack(alignment: .leading, spacing: 8) {
                Text("Venue Name")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                
                ZStack(alignment: .topLeading) {
                    VStack(spacing: 0) {
                        // Search field
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(AppTheme.textTertiary)
                            
                            TextField("Search for a venue...", text: $venueSearchText)
                                .font(.system(size: 16))
                                .foregroundColor(AppTheme.textPrimary)
                                .focused($isVenueFieldFocused)
                                .onChange(of: venueSearchText) { _, newValue in
                                    if !hasSelectedVenue {
                                        searchVenues(query: newValue)
                                    }
                                    hasSelectedVenue = false
                                }
                                .onSubmit {
                                    showVenueResults = false
                                    // If user submits without selecting, use the search text as venue name
                                    if venueName.isEmpty && !venueSearchText.isEmpty {
                                        venueName = venueSearchText
                                    }
                                }
                            
                            if isSearchingVenues {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else if !venueSearchText.isEmpty {
                                Button(action: {
                                    venueSearchText = ""
                                    venueName = ""
                                    location = ""
                                    venueSearchResults = []
                                    showVenueResults = false
                                    hasSelectedVenue = false
                                }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.system(size: 16))
                                        .foregroundColor(AppTheme.textTertiary)
                                }
                            }
                        }
                        .padding()
                        .background(AppTheme.cardBackground)
                        .cornerRadius(AppTheme.cornerRadiusMedium)
                        .overlay(
                            RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                                .stroke(hasSelectedVenue ? AppTheme.success : AppTheme.border, lineWidth: hasSelectedVenue ? 2 : 1)
                        )
                        
                        // Search Results Dropdown
                        if showVenueResults && !venueSearchResults.isEmpty {
                            VStack(spacing: 0) {
                                ForEach(venueSearchResults.prefix(5), id: \.self) { mapItem in
                                    VenueSearchResultRow(mapItem: mapItem) {
                                        selectVenue(mapItem)
                                    }
                                    
                                    if mapItem != venueSearchResults.prefix(5).last {
                                        Divider()
                                            .background(AppTheme.border)
                                    }
                                }
                            }
                            .background(AppTheme.cardBackground)
                            .cornerRadius(AppTheme.cornerRadiusMedium)
                            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
                            .padding(.top, 4)
                        }
                    }
                }
                .zIndex(1) // Ensure dropdown appears above other elements
                
                if hasSelectedVenue {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundColor(AppTheme.success)
                        Text("Venue selected")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(AppTheme.success)
                    }
                }
            }
            
            // Address Field (auto-populated from venue selection)
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Address")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppTheme.textSecondary)
                    
                    if hasSelectedVenue && !location.isEmpty {
                        Text("• Auto-filled")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(AppTheme.success)
                    }
                }
                
                TextField("Enter full address", text: $location)
                    .font(.system(size: 16))
                    .foregroundColor(AppTheme.textPrimary)
                    .padding()
                    .background(AppTheme.cardBackground)
                    .cornerRadius(AppTheme.cornerRadiusMedium)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                            .stroke(hasSelectedVenue && !location.isEmpty ? AppTheme.success.opacity(0.5) : AppTheme.border, lineWidth: 1)
                    )
                    .onChange(of: location) { oldValue, newValue in
                        // If address changes, clear custom coordinates so it will use the new address
                        if oldValue != newValue && !newValue.isEmpty {
                            selectedLatitude = nil
                            selectedLongitude = nil
                        }
                    }
                
                if !hasSelectedVenue && venueSearchText.isEmpty {
                    Text("Search for a venue above, or enter the address manually")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(AppTheme.textTertiary)
                }
            }
        }
    }
    
    // MARK: - Venue Search
    
    private func searchVenues(query: String) {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard trimmedQuery.count >= 3 else {
            venueSearchResults = []
            showVenueResults = false
            return
        }
        
        isSearchingVenues = true
        
        Task {
            // Debounce
            try? await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds
            
            guard trimmedQuery == venueSearchText.trimmingCharacters(in: .whitespacesAndNewlines) else {
                return // Query changed, skip this search
            }
            
            let request = MKLocalSearch.Request()
            request.naturalLanguageQuery = trimmedQuery
            request.resultTypes = .pointOfInterest
            
            // If we have user location, search nearby first
            if let userLocation = locationManager.userLocation {
                request.region = MKCoordinateRegion(
                    center: userLocation.coordinate,
                    latitudinalMeters: 50000, // 50km radius
                    longitudinalMeters: 50000
                )
            }
            
            let search = MKLocalSearch(request: request)
            
            do {
                let response = try await search.start()
                await MainActor.run {
                    venueSearchResults = response.mapItems
                    showVenueResults = true
                    isSearchingVenues = false
                }
            } catch {
                await MainActor.run {
                    venueSearchResults = []
                    showVenueResults = false
                    isSearchingVenues = false
                }
            }
        }
    }
    
    private func selectVenue(_ mapItem: MKMapItem) {
        hasSelectedVenue = true
        showVenueResults = false
        
        // Set venue name
        venueName = mapItem.name ?? ""
        venueSearchText = mapItem.name ?? ""
        
        // Build full address from placemark
        let placemark = mapItem.placemark
        var addressComponents: [String] = []
        
        if let streetNumber = placemark.subThoroughfare {
            addressComponents.append(streetNumber)
        }
        if let street = placemark.thoroughfare {
            if addressComponents.isEmpty {
                addressComponents.append(street)
            } else {
                addressComponents[0] += " " + street
            }
        }
        if let city = placemark.locality {
            addressComponents.append(city)
        }
        if let state = placemark.administrativeArea {
            addressComponents.append(state)
        }
        if let postalCode = placemark.postalCode {
            // Append to state if exists
            if !addressComponents.isEmpty {
                addressComponents[addressComponents.count - 1] += " " + postalCode
            }
        }
        
        location = addressComponents.joined(separator: ", ")
        
        // Dismiss keyboard
        isVenueFieldFocused = false
    }
    
    // MARK: - Date & Time
    
    private var dateTimeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Date & Time")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(AppTheme.textSecondary)
            
            HStack(spacing: 12) {
                // Date picker
                DatePicker("", selection: $gameDate, in: Date()..., displayedComponents: .date)
                    .labelsHidden()
                    .padding()
                    .background(AppTheme.cardBackground)
                    .cornerRadius(AppTheme.cornerRadiusMedium)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                            .stroke(AppTheme.border, lineWidth: 1)
                    )
                
                // Time picker with 30-minute increments
                Picker("", selection: $selectedTimeSlot) {
                    ForEach(timeSlots, id: \.self) { slot in
                        Text(timeString(from: slot))
                            .tag(slot)
                    }
                }
                .labelsHidden()
                .pickerStyle(.menu)
                .padding()
                .background(AppTheme.cardBackground)
                .cornerRadius(AppTheme.cornerRadiusMedium)
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                        .stroke(AppTheme.border, lineWidth: 1)
                )
            }
        }
    }
    
    // MARK: - Cost
    
    private var costSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cost per Player")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(AppTheme.textSecondary)
            
            HStack(spacing: 12) {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(AppTheme.textTertiary)
                
                TextField("0", value: $costDollars, format: .number)
                    .keyboardType(.numberPad)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(AppTheme.textPrimary)
                    .frame(width: 60)
                
                Spacer()
                
                if costDollars == 0 {
                    Text("Free")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(AppTheme.success)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(AppTheme.success.opacity(0.15))
                        .cornerRadius(AppTheme.cornerRadiusPill)
                }
            }
            .padding()
            .background(AppTheme.cardBackground)
            .cornerRadius(AppTheme.cornerRadiusMedium)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                    .stroke(AppTheme.border, lineWidth: 1)
            )
        }
    }
    
    // MARK: - Skill Level
    
    private var skillLevelSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Skill Level")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppTheme.textSecondary)
                
                Text("(Optional)")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(AppTheme.textTertiary)
            }
            
            HStack(spacing: 10) {
                ForEach(SkillLevel.allCases, id: \.self) { level in
                    SkillLevelButton(
                        level: level,
                        isSelected: selectedSkillLevel == level,
                        action: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                if selectedSkillLevel == level {
                                    selectedSkillLevel = nil // Deselect if tapping same
                                } else {
                                    selectedSkillLevel = level
                                }
                            }
                        }
                    )
                }
            }
            
            Text("Help players find games that match their skill level")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(AppTheme.textTertiary)
        }
    }
    
    // MARK: - Error Section
    
    @ViewBuilder
    private var errorSection: some View {
        if let error = errorMessage {
            Text(error)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(AppTheme.error)
                .padding()
                .background(AppTheme.error.opacity(0.1))
                .cornerRadius(AppTheme.cornerRadiusMedium)
        }
    }
    
    // MARK: - Action Buttons
    
    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button(action: { isEditMode ? updateGame() : createGame() }) {
                HStack {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .black))
                    } else {
                        Text(isEditMode ? "Save Changes" : "Schedule Game")
                            .font(.system(size: 17, weight: .bold))
                    }
                }
                .foregroundColor(AppTheme.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(isFormValid ? AppTheme.neonGreen : AppTheme.neonGreen.opacity(0.5))
                .cornerRadius(AppTheme.cornerRadiusLarge)
            }
            .disabled(!isFormValid || isLoading)
            
            if isEditMode {
                Button(action: { showDeleteConfirmation = true }) {
                    HStack {
                        if isDeleting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: "trash.fill")
                            Text("Delete Game")
                        }
                    }
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(AppTheme.error)
                    .cornerRadius(AppTheme.cornerRadiusLarge)
                }
                .disabled(isDeleting)
            }
        }
        .padding(.top, 8)
    }
    
    // MARK: - Form Actions
    
    private func prefillForm(with game: Game) {
        location = game.address
        venueName = game.venueName
        venueSearchText = game.venueName
        hasSelectedVenue = true  // Don't show search results when editing
        gameDate = game.gameDate
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm:ss"
        if let time = timeFormatter.date(from: game.startTime) {
            let calendar = Calendar.current
            let components = calendar.dateComponents([.hour, .minute], from: time)
            if let h = components.hour, let m = components.minute {
                // Round to nearest 30-minute increment
                let roundedMinute = (m / 30) * 30
                selectedTimeSlot = calendar.date(bySettingHour: h, minute: roundedMinute, second: 0, of: Date()) ?? Date()
            }
        }
        costDollars = game.costCents / 100
        selectedSkillLevel = game.skillLevel
        customTitle = game.customTitle ?? game.venueName
        selectedLatitude = game.latitude
        selectedLongitude = game.longitude
        
        // Set map region if coordinates exist
        if let lat = game.latitude, let lng = game.longitude {
            mapRegion = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
                span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            )
        }
    }
    
    private func createGame() {
        // Validate user is logged in
        guard let userId = authService.currentUser?.id else {
            errorMessage = "You must be logged in to create a game."
            return
        }
        
        // Validate required fields
        let trimmedVenueName = venueName.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedAddress = location.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmedVenueName.isEmpty else {
            errorMessage = "Please enter the venue name."
            return
        }
        
        guard !trimmedAddress.isEmpty else {
            errorMessage = "Please enter the address."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                let timeFormatter = DateFormatter()
                timeFormatter.dateFormat = "HH:mm:ss"
                
                let newGame = NewGame(
                    createdBy: userId,
                    sport: "pickleball",  // Explicitly set sport for mobile games
                    venueName: trimmedVenueName,
                    address: trimmedAddress,
                    gameDate: dateFormatter.string(from: gameDate),
                    startTime: timeFormatter.string(from: selectedTimeSlot),
                    maxPlayers: maxPlayers,
                    costCents: costDollars * 100,
                    description: nil,
                    imageUrl: nil,
                    isPrivate: false,
                    skillLevel: selectedSkillLevel,
                    customTitle: nil,  // Mobile users don't set custom titles
                    latitude: selectedLatitude,
                    longitude: selectedLongitude
                )
                
                let createdGame = try await gameService.createGame(newGame)
                print("✅ Game created successfully: \(createdGame.id)")
                await MainActor.run {
                    dismiss()
                }
            } catch {
                print("❌ Failed to create game: \(error)")
                await MainActor.run {
                    errorMessage = "Failed to create game: \(error.localizedDescription)"
                    isLoading = false
                }
                return
            }
            await MainActor.run {
                isLoading = false
            }
        }
    }
    
    private func updateGame() {
        guard let game = existingGame else { return }
        
        let trimmedVenueName = venueName.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedAddress = location.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmedVenueName.isEmpty else {
            errorMessage = "Please enter the venue name."
            return
        }
        
        guard !trimmedAddress.isEmpty else {
            errorMessage = "Please enter the address."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                let timeFormatter = DateFormatter()
                timeFormatter.dateFormat = "HH:mm:ss"
                
                let updates = GameUpdate(
                    venueName: trimmedVenueName,
                    address: trimmedAddress,
                    gameDate: dateFormatter.string(from: gameDate),
                    startTime: timeFormatter.string(from: selectedTimeSlot),
                    maxPlayers: maxPlayers,
                    costCents: costDollars * 100,
                    description: nil,
                    isPrivate: false,
                    skillLevel: selectedSkillLevel,
                    customTitle: nil,  // Mobile users don't set custom titles
                    imageUrl: nil,
                    latitude: selectedLatitude,
                    longitude: selectedLongitude
                )
                
                // Debug logging
                print("🔄 [CreateGameView] Updating game:")
                print("  - Skill Level: \(selectedSkillLevel?.rawValue ?? "nil")")
                print("  - Latitude: \(selectedLatitude?.description ?? "nil")")
                print("  - Longitude: \(selectedLongitude?.description ?? "nil")")
                
                try await gameService.updateGame(gameId: game.id, updates: updates, userId: game.createdBy)
                dismiss()
            } catch {
                errorMessage = "Failed to update game: \(error.localizedDescription)"
            }
            isLoading = false
        }
    }
    
    private func deleteGame() {
        guard let game = existingGame else { return }
        isDeleting = true
        Task {
            do {
                try await gameService.deleteGame(gameId: game.id, userId: game.createdBy)
                onGameDeleted?()
                dismiss()
            } catch {
                errorMessage = "Failed to delete game: \(error.localizedDescription)"
            }
            isDeleting = false
        }
    }
}

// MARK: - Venue Search Result Row

struct VenueSearchResultRow: View {
    let mapItem: MKMapItem
    let onSelect: () -> Void
    
    private var subtitle: String {
        let placemark = mapItem.placemark
        var parts: [String] = []
        
        if let city = placemark.locality {
            parts.append(city)
        }
        if let state = placemark.administrativeArea {
            parts.append(state)
        }
        
        return parts.joined(separator: ", ")
    }
    
    private var category: String? {
        mapItem.pointOfInterestCategory?.rawValue
            .replacingOccurrences(of: "MKPOICategory", with: "")
            .replacingOccurrences(of: "([a-z])([A-Z])", with: "$1 $2", options: .regularExpression)
    }
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Icon
                ZStack {
                    Circle()
                        .fill(AppTheme.neonGreen.opacity(0.15))
                        .frame(width: 40, height: 40)
                    
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(AppTheme.neonGreenDark)
                }
                
                // Content
                VStack(alignment: .leading, spacing: 2) {
                    Text(mapItem.name ?? "Unknown Venue")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                        .lineLimit(1)
                    
                    if !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(AppTheme.textSecondary)
                            .lineLimit(1)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Skill Level Button

struct SkillLevelButton: View {
    let level: SkillLevel
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: level.icon)
                    .font(.system(size: 14, weight: .bold))
                
                Text(level.displayName)
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundColor(isSelected ? level.color : AppTheme.textSecondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(isSelected ? level.color.opacity(0.15) : AppTheme.cardBackground)
            .cornerRadius(AppTheme.cornerRadiusMedium)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                    .stroke(isSelected ? level.color : AppTheme.border, lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    CreateGameView()
        .environmentObject(AuthService())
        .environmentObject(GameService())
        .environmentObject(LocationManager())
}
