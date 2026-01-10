//
//  MapSnapshotView.swift
//  Sports App 1
//
//  Displays a Look Around image or hybrid map of a venue location using Apple Maps
//

import SwiftUI
import MapKit

struct MapSnapshotView: View {
    let address: String
    let height: CGFloat
    var cornerRadius: CGFloat = 12
    
    @State private var snapshot: UIImage?
    @State private var lookAroundScene: MKLookAroundScene?
    @State private var coordinate: CLLocationCoordinate2D?
    @State private var isLoading = true
    
    var body: some View {
        ZStack {
            if let scene = lookAroundScene, let coord = coordinate {
                // Show Look Around preview (street-level imagery)
                LookAroundPreview(initialScene: scene)
                    .frame(height: height)
                    .allowsHitTesting(false) // Disable interaction
            } else if let snapshot = snapshot {
                // Fallback to map snapshot
                Image(uiImage: snapshot)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: height)
                    .clipped()
            } else {
                // Placeholder while loading
                Rectangle()
                    .fill(AppTheme.textPrimary.opacity(0.06))
                    .frame(height: height)
                    .overlay(
                        Group {
                            if isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                // Failed to load - show icon
                                Image(systemName: "photo")
                                    .font(.system(size: 24))
                                    .foregroundColor(AppTheme.textPrimary.opacity(0.3))
                            }
                        }
                    )
            }
        }
        .clipShape(
            UnevenRoundedRectangle(
                topLeadingRadius: cornerRadius,
                bottomLeadingRadius: 0,
                bottomTrailingRadius: 0,
                topTrailingRadius: cornerRadius
            )
        )
        .task {
            await loadSnapshot()
        }
    }
    
    private func loadSnapshot() async {
        let geocoder = CLGeocoder()
        
        do {
            let placemarks = try await geocoder.geocodeAddressString(address)
            guard let location = placemarks.first?.location else {
                await MainActor.run { isLoading = false }
                return
            }
            
            let coord = location.coordinate
            await MainActor.run { self.coordinate = coord }
            
            // Try to get Look Around scene first (street-level imagery)
            let lookAroundRequest = MKLookAroundSceneRequest(coordinate: coord)
            if let scene = try? await lookAroundRequest.scene {
                await MainActor.run {
                    self.lookAroundScene = scene
                    self.isLoading = false
                }
                return
            }
            
            // Fallback to hybrid map snapshot if Look Around not available
            let options = MKMapSnapshotter.Options()
            options.region = MKCoordinateRegion(
                center: coord,
                span: MKCoordinateSpan(latitudeDelta: 0.003, longitudeDelta: 0.003)
            )
            options.size = CGSize(width: 800, height: height * 4)
            options.mapType = .standard  // ✅ Changed from .hybrid for better text readability
            options.showsBuildings = true
            options.pointOfInterestFilter = .includingAll
            
            let snapshotter = MKMapSnapshotter(options: options)
            let mapSnapshot = try await snapshotter.start()
            
            // ✅ Add a black pin annotation to the map
            let snapshotImage = mapSnapshot.image
            let finalImage = UIGraphicsImageRenderer(size: snapshotImage.size).image { context in
                // Draw the map
                snapshotImage.draw(at: .zero)
                
                // Convert coordinate to point on the image
                let point = mapSnapshot.point(for: coord)
                
                // Draw black pin
                let pinSize: CGFloat = 50
                let pinRect = CGRect(
                    x: point.x - pinSize / 2,
                    y: point.y - pinSize,
                    width: pinSize,
                    height: pinSize
                )
                
                // Draw pin shape (teardrop)
                let pinPath = UIBezierPath()
                let center = CGPoint(x: pinRect.midX, y: pinRect.minY + pinSize * 0.35)
                let radius = pinSize * 0.35
                
                // Circle part
                pinPath.addArc(
                    withCenter: center,
                    radius: radius,
                    startAngle: 0,
                    endAngle: .pi * 2,
                    clockwise: true
                )
                
                // Point part (triangle)
                pinPath.move(to: CGPoint(x: center.x - radius * 0.5, y: center.y + radius * 0.7))
                pinPath.addLine(to: CGPoint(x: center.x, y: pinRect.maxY))
                pinPath.addLine(to: CGPoint(x: center.x + radius * 0.5, y: center.y + radius * 0.7))
                pinPath.close()
                
                // Fill pin with black
                UIColor.black.setFill()
                pinPath.fill()
                
                // Add white border for contrast
                UIColor.white.setStroke()
                pinPath.lineWidth = 3
                pinPath.stroke()
            }
            
            await MainActor.run {
                self.snapshot = finalImage
                self.isLoading = false
            }
            
        } catch {
            print("Error loading map snapshot: \(error)")
            await MainActor.run {
                self.isLoading = false
            }
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        MapSnapshotView(
            address: "Jose Marti Park, Miami, FL",
            height: 120
        )
        
        MapSnapshotView(
            address: "Flamingo Park, Miami Beach, FL",
            height: 120
        )
    }
    .padding()
}
