//
//  Sport.swift
//  Sports App 1
//

import SwiftUI

enum Sport: String, Codable, CaseIterable, Identifiable, Sendable {
    case tennis = "tennis"
    case pickleball = "pickleball"
    case padel = "padel"
    case basketball = "basketball"
    case soccer = "soccer"
    case volleyball = "volleyball"
    case badminton = "badminton"
    case tableTennis = "table_tennis"
    case squash = "squash"
    case golf = "golf"
    case running = "running"
    case cycling = "cycling"
    case swimming = "swimming"
    case yoga = "yoga"
    case other = "other"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .tennis: return "Tennis"
        case .pickleball: return "Pickleball"
        case .padel: return "Padel"
        case .basketball: return "Basketball"
        case .soccer: return "Soccer"
        case .volleyball: return "Volleyball"
        case .badminton: return "Badminton"
        case .tableTennis: return "Table Tennis"
        case .squash: return "Squash"
        case .golf: return "Golf"
        case .running: return "Running"
        case .cycling: return "Cycling"
        case .swimming: return "Swimming"
        case .yoga: return "Yoga"
        case .other: return "Other"
        }
    }
    
    var icon: String {
        // Using SF Symbols available in iOS 14+
        switch self {
        case .tennis: return "sportscourt"
        case .pickleball: return "sportscourt"
        case .padel: return "sportscourt"
        case .basketball: return "sportscourt"
        case .soccer: return "sportscourt"
        case .volleyball: return "sportscourt"
        case .badminton: return "sportscourt"
        case .tableTennis: return "sportscourt"
        case .squash: return "sportscourt"
        case .golf: return "flag.fill"
        case .running: return "figure.walk"
        case .cycling: return "bicycle"
        case .swimming: return "drop.fill"
        case .yoga: return "figure.mind.and.body"
        case .other: return "sportscourt"
        }
    }
    
    var color: Color {
        switch self {
        case .tennis: return Color(hex: "C7F464")
        case .pickleball: return Color(hex: "2E7D4C")
        case .padel: return Color(hex: "4ECDC4")
        case .basketball: return Color(hex: "FF6B35")
        case .soccer: return Color(hex: "2ECC71")
        case .volleyball: return Color(hex: "F39C12")
        case .badminton: return Color(hex: "9B59B6")
        case .tableTennis: return Color(hex: "E74C3C")
        case .squash: return Color(hex: "3498DB")
        case .golf: return Color(hex: "1ABC9C")
        case .running: return Color(hex: "E91E63")
        case .cycling: return Color(hex: "FF9800")
        case .swimming: return Color(hex: "00BCD4")
        case .yoga: return Color(hex: "9C27B0")
        case .other: return Color(hex: "607D8B")
        }
    }
    
    // Popular sports shown first
    static var popular: [Sport] {
        [.tennis, .pickleball, .padel, .basketball, .soccer, .volleyball]
    }
}

