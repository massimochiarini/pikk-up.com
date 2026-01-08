//
//  LocationManager.swift
//  Sports App 1
//

import Foundation
import CoreLocation
import Combine

@MainActor
class LocationManager: NSObject, ObservableObject {
    static let shared = LocationManager()
    
    @Published var userLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isLoading = false
    
    private let locationManager = CLLocationManager()
    private let geocoder = CLGeocoder()
    
    // Cache for geocoded addresses to avoid repeated lookups
    private var geocodeCache: [String: CLLocationCoordinate2D] = [:]
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        authorizationStatus = locationManager.authorizationStatus
        
        // If already authorized, request location immediately
        if locationManager.authorizationStatus == .authorizedWhenInUse ||
           locationManager.authorizationStatus == .authorizedAlways {
            requestCurrentLocation()
        }
    }
    
    func requestLocationPermission() {
        if locationManager.authorizationStatus == .notDetermined {
            locationManager.requestWhenInUseAuthorization()
        } else if locationManager.authorizationStatus == .authorizedWhenInUse ||
                  locationManager.authorizationStatus == .authorizedAlways {
            // Already authorized, just request location
            if userLocation == nil {
                requestCurrentLocation()
            }
        }
    }
    
    func requestCurrentLocation() {
        isLoading = true
        locationManager.requestLocation()
    }
    
    // MARK: - Geocoding
    
    /// Geocode an address to coordinates with caching
    func geocodeAddress(_ address: String) async -> CLLocationCoordinate2D? {
        // Check cache first
        if let cached = geocodeCache[address] {
            return cached
        }
        
        do {
            let placemarks = try await geocoder.geocodeAddressString(address)
            if let coordinate = placemarks.first?.location?.coordinate {
                geocodeCache[address] = coordinate
                return coordinate
            }
        } catch {
            print("⚠️ [LocationManager] Geocoding failed for '\(address)': \(error.localizedDescription)")
        }
        
        return nil
    }
    
    // MARK: - Distance Calculation
    
    /// Calculate distance in miles between two coordinates
    func distanceInMiles(from: CLLocation, to: CLLocationCoordinate2D) -> Double {
        let toLocation = CLLocation(latitude: to.latitude, longitude: to.longitude)
        let distanceInMeters = from.distance(from: toLocation)
        return distanceInMeters / 1609.344 // Convert meters to miles
    }
    
    /// Calculate distance in miles from user's location to a coordinate
    func distanceFromUser(to coordinate: CLLocationCoordinate2D) -> Double? {
        guard let userLocation = userLocation else { return nil }
        return distanceInMiles(from: userLocation, to: coordinate)
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            userLocation = locations.last
            isLoading = false
        }
    }
    
    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            print("⚠️ [LocationManager] Location error: \(error.localizedDescription)")
            isLoading = false
        }
    }
    
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            authorizationStatus = manager.authorizationStatus
            
            switch manager.authorizationStatus {
            case .authorizedWhenInUse, .authorizedAlways:
                requestCurrentLocation()
            default:
                break
            }
        }
    }
}
