//
//  SupabaseManager.swift
//  PickleballApp
//

import Foundation
import Supabase

// Using a nonisolated struct to hold the Supabase client
struct SupabaseManager: Sendable {
    static let shared = SupabaseManager()
    
    let client: SupabaseClient
    
    private init() {
        let supabaseURL = URL(string: "https://xkesrtakogrsrurvsmnp.supabase.co")!
        let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZXNydGFrb2dyc3J1cnZzbW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mjc2MDUsImV4cCI6MjA4MTQwMzYwNX0.RZwCfhPEgMaQOH9JJowoKDCrjRLeiQvtSfcKkyWdzko"
        
        client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey,
            options: .init(
                auth: .init(
                    autoRefreshToken: true,
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }
}
