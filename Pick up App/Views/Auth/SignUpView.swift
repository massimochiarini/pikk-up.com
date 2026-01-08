//
//  SignUpView.swift
//  PickleballApp
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct SignUpView: View {
    @EnvironmentObject var authService: AuthService
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showSignIn = false
    
    var isFormValid: Bool {
        !firstName.isEmpty && !lastName.isEmpty && !email.isEmpty && password.count >= 6
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Sign up")
                            .font(.system(size: 32, weight: .bold))
                        
                        Text("Join the Miami pickleball community and find games near you.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 20)
                    
                    // Form Fields
                    VStack(spacing: 16) {
                        // Name Row
                        HStack(spacing: 12) {
                            CustomTextField(
                                placeholder: "First name",
                                text: $firstName
                            )
                            
                            CustomTextField(
                                placeholder: "Last name",
                                text: $lastName
                            )
                        }
                        
                        CustomTextField(
                            placeholder: "Email address",
                            text: $email,
                            isEmailField: true,
                            disableAutocapitalization: true
                        )
                        
                        CustomTextField(
                            placeholder: "Password (6+ characters)",
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
                    
                    // Sign Up Button
                    PrimaryButton(
                        title: "Sign up",
                        action: signUp,
                        isLoading: isLoading
                    )
                    .disabled(!isFormValid)
                    .opacity(isFormValid ? 1 : 0.6)
                    
                    // Terms
                    Text("By signing up you agree to our Terms of Use and Privacy Notice.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                    
                    Spacer(minLength: 40)
                    
                    // Sign In Link
                    HStack {
                        Text("Already have an account?")
                            .foregroundColor(.secondary)
                        Button("Sign in") {
                            showSignIn = true
                        }
                        .foregroundColor(Color(hex: "4F5BD5"))
                        .fontWeight(.semibold)
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, 24)
            }
            .navigationDestination(isPresented: $showSignIn) {
                SignInView()
            }
        }
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
}

struct CustomTextField: View {
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
        .padding()
        #if canImport(UIKit)
        .background(Color(UIColor.systemGray6))
        #else
        .background(Color(hex: "F2F2F7"))
        #endif
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                #if canImport(UIKit)
                .stroke(Color(UIColor.systemGray4), lineWidth: 1)
                #else
                .stroke(Color(hex: "D1D1D6"), lineWidth: 1)
                #endif
        )
    }
}

#Preview {
    SignUpView()
        .environmentObject(AuthService())
}

