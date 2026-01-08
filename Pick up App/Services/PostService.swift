//
//  PostService.swift
//  Sports App 1
//

import Foundation
import Combine
import Supabase

@MainActor
class PostService: ObservableObject {
    @Published var posts: [PostWithProfile] = []
    @Published var userPosts: [PostWithProfile] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseManager.shared.client
    
    // MARK: - Fetch Posts
    
    func fetchActivePosts() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let fetchedPosts: [PostWithProfile] = try await supabase
                .from("posts")
                .select("*, profiles(*)")
                .eq("is_active", value: true)
                .order("created_at", ascending: false)
                .execute()
                .value
            
            // Filter out expired posts
            posts = fetchedPosts.filter { post in
                if let expiresAt = post.expiresAt {
                    return expiresAt > Date()
                }
                return true
            }
        } catch {
            errorMessage = "Failed to load posts: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func fetchUserPosts(userId: UUID) async {
        do {
            let fetchedPosts: [PostWithProfile] = try await supabase
                .from("posts")
                .select("*, profiles(*)")
                .eq("user_id", value: userId.uuidString)
                .order("created_at", ascending: false)
                .execute()
                .value
            
            userPosts = fetchedPosts
        } catch {
            print("Error fetching user posts: \(error)")
        }
    }
    
    // MARK: - Create Post
    
    func createPost(_ newPost: NewPost) async throws -> Post {
        let post: Post = try await supabase
            .from("posts")
            .insert(newPost)
            .select()
            .single()
            .execute()
            .value
        
        // Refresh posts
        await fetchActivePosts()
        
        return post
    }
    
    // MARK: - Update Post
    
    func deactivatePost(postId: UUID) async throws {
        try await supabase
            .from("posts")
            .update(["is_active": false])
            .eq("id", value: postId.uuidString)
            .execute()
        
        await fetchActivePosts()
    }
    
    func updatePost(postId: UUID, headline: String?, timeWindow: String?, sport: String?) async throws {
        var updates: [String: AnyEncodable] = [:]
        
        if let headline = headline {
            updates["headline"] = AnyEncodable(headline)
        }
        if let timeWindow = timeWindow {
            updates["time_window"] = AnyEncodable(timeWindow)
        }
        if let sport = sport {
            updates["sport"] = AnyEncodable(sport)
        }
        
        guard !updates.isEmpty else { return }
        
        try await supabase
            .from("posts")
            .update(updates)
            .eq("id", value: postId.uuidString)
            .execute()
        
        await fetchActivePosts()
    }
    
    // MARK: - Delete Post
    
    func deletePost(postId: UUID) async throws {
        try await supabase
            .from("posts")
            .delete()
            .eq("id", value: postId.uuidString)
            .execute()
        
        await fetchActivePosts()
    }
}

// Helper for encoding dynamic updates
struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void
    
    init<T: Encodable>(_ value: T) {
        _encode = { encoder in
            try value.encode(to: encoder)
        }
    }
    
    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}

