//
//  NotificationService.swift
//  Sports App 1
//

import Foundation
import Combine
import UserNotifications
import UIKit
import Supabase

@MainActor
class NotificationService: NSObject, ObservableObject {
    static let shared = NotificationService()
    
    @Published var isNotificationsEnabled = false
    @Published var deviceToken: String?
    
    private let supabase = SupabaseManager.shared.client
    
    override init() {
        super.init()
    }
    
    // MARK: - Request Permission
    
    func requestPermission() async -> Bool {
        do {
            let center = UNUserNotificationCenter.current()
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            
            await MainActor.run {
                isNotificationsEnabled = granted
            }
            
            if granted {
                // Register for remote notifications on main thread
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            
            return granted
        } catch {
            print("Error requesting notification permission: \(error)")
            return false
        }
    }
    
    // MARK: - Check Current Status
    
    func checkNotificationStatus() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        
        await MainActor.run {
            isNotificationsEnabled = settings.authorizationStatus == .authorized
        }
    }
    
    // MARK: - Register Device Token
    
    func registerDeviceToken(_ tokenData: Data, userId: UUID) async {
        let tokenString = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
        
        await MainActor.run {
            deviceToken = tokenString
        }
        
        print("📱 Device token: \(tokenString)")
        
        // Store token in Supabase
        do {
            let deviceInfo = DeviceToken(
                userId: userId,
                token: tokenString,
                platform: "ios",
                appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
            )
            
            // Upsert to handle token updates
            try await supabase
                .from("device_tokens")
                .upsert(deviceInfo, onConflict: "user_id,token")
                .execute()
            
            print("✅ Device token registered successfully")
        } catch {
            print("❌ Error registering device token: \(error)")
        }
    }
    
    // MARK: - Unregister Device Token
    
    func unregisterDeviceToken(userId: UUID) async {
        guard let token = deviceToken else { return }
        
        do {
            try await supabase
                .from("device_tokens")
                .delete()
                .eq("user_id", value: userId.uuidString)
                .eq("token", value: token)
                .execute()
            
            print("✅ Device token unregistered")
        } catch {
            print("❌ Error unregistering device token: \(error)")
        }
    }
    
    // MARK: - Handle Notification
    
    func handleNotification(_ userInfo: [AnyHashable: Any]) {
        print("📬 Received notification: \(userInfo)")
        
        // Extract notification data
        if let aps = userInfo["aps"] as? [String: Any] {
            print("APS: \(aps)")
        }
        
        // Handle navigation based on notification type
        if let type = userInfo["type"] as? String {
            switch type {
            case "message":
                if let conversationId = userInfo["conversation_id"] as? String {
                    // Post notification to navigate to conversation
                    NotificationCenter.default.post(
                        name: .navigateToConversation,
                        object: nil,
                        userInfo: ["conversationId": conversationId]
                    )
                }
            case "group_message":
                if let groupChatId = userInfo["group_chat_id"] as? String {
                    // Post notification to navigate to group chat
                    NotificationCenter.default.post(
                        name: .navigateToGroupChat,
                        object: nil,
                        userInfo: ["groupChatId": groupChatId]
                    )
                }
            case "yoga_session":
                if let gameId = userInfo["game_id"] as? String {
                    NotificationCenter.default.post(
                        name: .navigateToGame,
                        object: nil,
                        userInfo: ["gameId": gameId]
                    )
                }
            default:
                break
            }
        }
    }
}

// MARK: - Device Token Model

struct DeviceToken: Encodable {
    let userId: UUID
    let token: String
    let platform: String
    let appVersion: String
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case token
        case platform
        case appVersion = "app_version"
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let navigateToConversation = Notification.Name("navigateToConversation")
    static let navigateToGroupChat = Notification.Name("navigateToGroupChat")
    static let navigateToGame = Notification.Name("navigateToGame")
}
