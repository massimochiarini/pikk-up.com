//
//  Sport.swift
//  Sports App 1
//

import Foundation
import SwiftUI

enum Sport: String, Codable, CaseIterable, Sendable, Identifiable {
    case yoga = "yoga"
    case pickleball = "pickleball"
    case tennis = "tennis"
    case other = "other"
    
    var id: String { self.rawValue }
    
    var displayName: String {
        switch self {
        case .yoga: return "Yoga"
        case .pickleball: return "Pickleball"
        case .tennis: return "Tennis"
        case .other: return "Other"
        }
    }
    
    var icon: String {
        switch self {
        case .yoga: return "figure.mind.and.body"
        case .pickleball: return "figure.tennis"
        case .tennis: return "tennisball.fill"
        case .other: return "sportscourt.fill"
        }
    }
    
    var emoji: String {
        switch self {
        case .yoga: return "🧘"
        case .pickleball: return "🎾"
        case .tennis: return "🎾"
        case .other: return "🏃"
        }
    }
    
    var color: Color {
        switch self {
        case .yoga: return Color(hex: "6B7280")      // Medium gray
        case .pickleball: return Color(hex: "9CA3AF") // Light gray
        case .tennis: return Color(hex: "4B5563")     // Dark gray
        case .other: return Color(hex: "9CA3AF")      // Light gray
        }
    }
}
