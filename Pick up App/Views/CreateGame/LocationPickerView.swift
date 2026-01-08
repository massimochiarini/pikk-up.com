//
//  LocationPickerView.swift
//  Sports App 1
//

import SwiftUI
import MapKit

struct LocationPickerView: View {
    @Environment(\.dismiss) var dismiss
    @Binding var region: MKCoordinateRegion
    @Binding var selectedLatitude: Double?
    @Binding var selectedLongitude: Double?
    let address: String
    
    @State private var tempRegion: MKCoordinateRegion
    @State private var isGeocoding = false
    @State private var hasGeocodedOnAppear = false
    
    init(region: Binding<MKCoordinateRegion>, selectedLatitude: Binding<Double?>, selectedLongitude: Binding<Double?>, address: String) {
        self._region = region
        self._selectedLatitude = selectedLatitude
        self._selectedLongitude = selectedLongitude
        self.address = address
        
        // If we have selected coordinates, use them; otherwise use the region
        if let lat = selectedLatitude.wrappedValue, let lng = selectedLongitude.wrappedValue {
            self._tempRegion = State(initialValue: MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
                span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            ))
        } else {
            self._tempRegion = State(initialValue: region.wrappedValue)
        }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Instructions
                VStack(spacing: 8) {
                    Text("Adjust Pin Location")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(AppTheme.textPrimary)
                    
                    Text("Drag the map to position the pin at the exact location")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(AppTheme.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                .background(AppTheme.background)
                
                // Map with center pin
                ZStack {
                    Map(coordinateRegion: $tempRegion, interactionModes: .all)
                        .ignoresSafeArea(edges: .bottom)
                    
                    // Center pin
                    VStack {
                        Spacer()
                        Image(systemName: "mappin.circle.fill")
                            .font(.system(size: 50))
                            .foregroundColor(.red)
                            .shadow(color: .black.opacity(0.3), radius: 3, x: 0, y: 2)
                        Spacer()
                    }
                    
                    // Coordinate display
                    VStack {
                        Spacer()
                        HStack {
                            Spacer()
                            VStack(alignment: .trailing, spacing: 4) {
                                Text("Lat: \(tempRegion.center.latitude, specifier: "%.6f")")
                                    .font(.system(size: 11, weight: .medium))
                                Text("Lng: \(tempRegion.center.longitude, specifier: "%.6f")")
                                    .font(.system(size: 11, weight: .medium))
                            }
                            .padding(8)
                            .background(Color.white.opacity(0.9))
                            .cornerRadius(8)
                            .shadow(radius: 2)
                            .padding()
                        }
                    }
                }
                
                // Action buttons
                VStack(spacing: 12) {
                    Button(action: geocodeAddress) {
                        HStack {
                            if isGeocoding {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: AppTheme.textPrimary))
                            } else {
                                Image(systemName: "location.circle.fill")
                                    .font(.system(size: 16))
                                Text("Center on Address")
                                    .font(.system(size: 15, weight: .semibold))
                            }
                        }
                        .foregroundColor(AppTheme.textPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(AppTheme.cardBackground)
                        .cornerRadius(AppTheme.cornerRadiusMedium)
                        .overlay(
                            RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                                .stroke(AppTheme.border, lineWidth: 1)
                        )
                    }
                    .disabled(isGeocoding)
                    
                    HStack(spacing: 12) {
                        Button(action: {
                            dismiss()
                        }) {
                            Text("Cancel")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(AppTheme.textPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(AppTheme.cardBackground)
                                .cornerRadius(AppTheme.cornerRadiusMedium)
                                .overlay(
                                    RoundedRectangle(cornerRadius: AppTheme.cornerRadiusMedium)
                                        .stroke(AppTheme.border, lineWidth: 1)
                                )
                        }
                        
                        Button(action: saveLocation) {
                            Text("Save Location")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(AppTheme.textPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(AppTheme.neonGreen)
                                .cornerRadius(AppTheme.cornerRadiusMedium)
                        }
                    }
                }
                .padding()
                .background(AppTheme.background)
            }
            .navigationBarHidden(true)
        }
        .onAppear {
            // Try to geocode address on appear if no coordinates set
            if selectedLatitude == nil || selectedLongitude == nil {
                if !hasGeocodedOnAppear {
                    geocodeAddress()
                    hasGeocodedOnAppear = true
                }
            }
        }
    }
    
    private func geocodeAddress() {
        guard !address.isEmpty else { return }
        
        isGeocoding = true
        
        let geocoder = CLGeocoder()
        geocoder.geocodeAddressString(address) { placemarks, error in
            isGeocoding = false
            
            if let error = error {
                print("❌ Geocoding error: \(error)")
                return
            }
            
            if let location = placemarks?.first?.location {
                tempRegion = MKCoordinateRegion(
                    center: location.coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                )
            }
        }
    }
    
    private func saveLocation() {
        selectedLatitude = tempRegion.center.latitude
        selectedLongitude = tempRegion.center.longitude
        region = tempRegion
        dismiss()
    }
}

#Preview {
    LocationPickerView(
        region: .constant(MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 25.7617, longitude: -80.1918),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )),
        selectedLatitude: .constant(nil),
        selectedLongitude: .constant(nil),
        address: "2500 South Miami Avenue"
    )
}
