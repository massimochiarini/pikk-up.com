//
//  AuthView.swift
//  PickleballApp
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct AuthView: View {
    @EnvironmentObject var authService: AuthService
    @State private var isSignUp = true
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var isSignUpFormValid: Bool {
        !firstName.isEmpty && !lastName.isEmpty && !email.isEmpty && password.count >= 6
    }
    
    var isSignInFormValid: Bool {
        !email.isEmpty && !password.isEmpty
    }
    
    var body: some View {
        ZStack {
            // Background
            AppTheme.background
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 0) {
                    // Header image
                    ZStack(alignment: .bottomLeading) {
                        AsyncImage(url: URL(string: "https://images.unsplash.com/photo-1648809546822-6d0c3e646894?w=800&q=80")) { phase in
                            switch phase {
                            case .empty:
                                Rectangle()
                                    .fill(Color(hex: "2E7D4C").opacity(0.3))
                                    .overlay(ProgressView().tint(.white))
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            case .failure:
                                Rectangle()
                                    .fill(Color(hex: "2E7D4C").opacity(0.3))
                                    .overlay(
                                        Image(systemName: "sportscourt.fill")
                                            .font(.system(size: 50))
                                            .foregroundColor(.white.opacity(0.5))
                                    )
                            @unknown default:
                                EmptyView()
                            }
                        }
                        .frame(height: 200)
                        .clipped()
                        
                        // Gradient overlay
                        LinearGradient(
                            colors: [.clear, .black.opacity(0.6)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        
                        // App title
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Miami Pickleball")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text("Join the community")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .padding(24)
                    }
                    .frame(height: 200)
                    
                    // Tab selector
                    HStack(spacing: 0) {
                        AuthTabButton(title: "Sign Up", isSelected: isSignUp) {
                            withAnimation(.spring(response: 0.3)) {
                                isSignUp = true
                                clearForm()
                            }
                        }
                        
                        AuthTabButton(title: "Sign In", isSelected: !isSignUp) {
                            withAnimation(.spring(response: 0.3)) {
                                isSignUp = false
                                clearForm()
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 24)
                    
                    // Form
                    VStack(spacing: 16) {
                        if isSignUp {
                            // Name Row
                            HStack(spacing: 12) {
                                AuthTextField(
                                    placeholder: "First name",
                                    text: $firstName
                                )
                                
                                AuthTextField(
                                    placeholder: "Last name",
                                    text: $lastName
                                )
                            }
                            .transition(.asymmetric(
                                insertion: .opacity.combined(with: .move(edge: .top)),
                                removal: .opacity
                            ))
                        }
                        
                        AuthTextField(
                            placeholder: "Email address",
                            text: $email,
                            isEmailField: true,
                            disableAutocapitalization: true
                        )
                        
                        AuthTextField(
                            placeholder: isSignUp ? "Password (6+ characters)" : "Password",
                            text: $password,
                            isSecure: true
                        )
                        
                        // Error Message
                        if let error = errorMessage {
                            HStack {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(.red)
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(.red)
                                Spacer()
                            }
                            .padding(.horizontal, 4)
                        }
                        
                        // Submit Button
                        Button(action: isSignUp ? signUp : signIn) {
                            HStack {
                                if isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text(isSignUp ? "Create Account" : "Sign In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                (isSignUp ? isSignUpFormValid : isSignInFormValid)
                                    ? Color(hex: "2E7D4C")
                                    : Color(hex: "2E7D4C").opacity(0.5)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(14)
                        }
                        .disabled(isSignUp ? !isSignUpFormValid : !isSignInFormValid)
                        .disabled(isLoading)
                        .padding(.top, 8)
                        
                        if isSignUp {
                            // Terms
                            Text("By signing up you agree to our Terms of Use and Privacy Notice.")
                                .font(.caption)
                                .foregroundColor(AppTheme.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.top, 8)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 24)
                    .padding(.bottom, 40)
                }
            }
            .scrollDismissesKeyboard(.interactively)
        }
    }
    
    private func clearForm() {
        firstName = ""
        lastName = ""
        email = ""
        password = ""
        errorMessage = nil
    }
    
    private func signUp() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await authService.signUp(
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName
                )
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
    
    private func signIn() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await authService.signIn(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct AuthTabButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 16, weight: isSelected ? .semibold : .medium))
                    .foregroundColor(isSelected ? Color(hex: "2E7D4C") : AppTheme.textSecondary)
                
                Rectangle()
                    .fill(isSelected ? Color(hex: "2E7D4C") : Color.clear)
                    .frame(height: 2)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct AuthTextField: View {
    let placeholder: String
    @Binding var text: String
    var isEmailField: Bool = false
    var disableAutocapitalization: Bool = false
    var isSecure: Bool = false
    
    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
                    #if canImport(UIKit)
                    .keyboardType(isEmailField ? .emailAddress : .default)
                    .textInputAutocapitalization(disableAutocapitalization ? .never : .sentences)
                    #endif
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .background(AppTheme.background)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(AppTheme.textPrimary.opacity(0.08), lineWidth: 1)
        )
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthService())
}
