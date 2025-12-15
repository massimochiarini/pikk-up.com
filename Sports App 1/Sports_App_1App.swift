//
//  Sports_App_1App.swift
//  Sports App 1
//
//  Created by Massimo Chiarini on 12/15/25.
//

import SwiftUI
import CoreData

@main
struct Sports_App_1App: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
