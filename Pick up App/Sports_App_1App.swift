//
//  Sports_App_1App.swift
//  Sports App 1
//
//  Created by Massimo Chiarini on 12/15/25.
//

import SwiftUI

@main
struct Sports_App_1App: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var authService = AuthService.shared
    @StateObject private var gameService = GameService()
    @StateObject private var locationManager = LocationManager()
    
    private var notificationService: NotificationService {
        NotificationService.shared
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .environmentObject(gameService)
                .environmentObject(locationManager)
                .environmentObject(notificationService)
                .task {
                    // Check and request notification permissions on app launch
                    await notificationService.checkNotificationStatus()
                }
        }
    }
}
