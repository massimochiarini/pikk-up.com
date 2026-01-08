//
//  SignInView.swift
//  PickleballApp
//

import SwiftUI

struct SignInView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var isFormValid: Bool {
        !email.isEmpty && !password.isEmpty
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Welcome back")
                        .font(.system(size: 32, weight: .bold))
                    
                    Text("Sign in to find your next pickleball game.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)
                
                // Form Fields
                VStack(spacing: 16) {
                    CustomTextField(
                        placeholder: "Email address",
                        text: $email,
                        isEmailField: true,
                        disableAutocapitalization: true
                    )
                    
                    CustomTextField(
                        placeholder: "Password",
                        text: $password,
                        isSecure: true
                    )
                }
                
                // Error Message
                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal, 4)
                }
                
                // Sign In Button
                PrimaryButton(
                    title: "Sign in",
                    action: signIn,
                    isLoading: isLoading
                )
                .disabled(!isFormValid)
                .opacity(isFormValid ? 1 : 0.6)
                
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 24)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                BackButton(action: { dismiss() })
            }
        }
        .navigationBarBackButtonHidden(true)
    }
    
    private func signIn() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await authService.signIn(email: email, password: password)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        SignInView()
            .environmentObject(AuthService())
    }
}

