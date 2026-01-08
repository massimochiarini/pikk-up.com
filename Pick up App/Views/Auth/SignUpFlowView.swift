//
//  SignUpFlowView.swift
//  PickleballApp
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

enum SignUpStep: Int, CaseIterable {
    case firstName = 0
    case lastName = 1
    case credentials = 2
    
    var title: String {
        switch self {
        case .firstName: return "FIRST NAME"
        case .lastName: return "LAST NAME"
        case .credentials: return "EMAIL"
        }
    }
    
    var subtitle: String {
        switch self {
        case .firstName: return "What's your first name?"
        case .lastName: return "What's your last name?"
        case .credentials: return "Enter your email and create a password"
        }
    }
}

struct SignUpFlowView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    @State private var currentStep: SignUpStep = .firstName
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    @FocusState private var isInputFocused: Bool
    
    private var canProceed: Bool {
        switch currentStep {
        case .firstName:
            return !firstName.trimmingCharacters(in: .whitespaces).isEmpty
        case .lastName:
            return !lastName.trimmingCharacters(in: .whitespaces).isEmpty
        case .credentials:
            return !email.isEmpty && password.count >= 6
        }
    }
    
    private var progress: CGFloat {
        CGFloat(currentStep.rawValue + 1) / CGFloat(SignUpStep.allCases.count)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with back button and progress
            HStack {
                Button(action: goBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)
                        .frame(width: 44, height: 44)
                }
                
                Spacer()
                
                // Progress indicator
                HStack(spacing: 6) {
                    ForEach(SignUpStep.allCases, id: \.rawValue) { step in
                        Capsule()
                            .fill(step.rawValue <= currentStep.rawValue ? AppTheme.neonGreen : AppTheme.textPrimary.opacity(0.12))
                            .frame(width: 40, height: 4)
                    }
                }
                
                Spacer()
                
                // Placeholder for symmetry
                Color.clear
                    .frame(width: 44, height: 44)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
                
                Spacer()
                
                // Content
                VStack(alignment: .leading, spacing: 32) {
                    // Title
                    VStack(alignment: .leading, spacing: 8) {
                        Text(currentStep.title)
                            .font(.system(size: 34, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        Text(currentStep.subtitle)
                            .font(.system(size: 17))
                            .foregroundColor(AppTheme.textSecondary)
                    }
                    
                    // Input fields based on step
                    VStack(spacing: 16) {
                        switch currentStep {
                        case .firstName:
                            SignUpTextField(
                                placeholder: "Enter First Name",
                                text: $firstName,
                                autocapitalizeWords: true
                            )
                            .focused($isInputFocused)
                            
                        case .lastName:
                            SignUpTextField(
                                placeholder: "Enter Last Name",
                                text: $lastName,
                                autocapitalizeWords: true
                            )
                            .focused($isInputFocused)
                            
                        case .credentials:
                            SignUpTextField(
                                placeholder: "Email address",
                                text: $email,
                                isEmailField: true
                            )
                            .focused($isInputFocused)
                            
                            SignUpTextField(
                                placeholder: "Password (6+ characters)",
                                text: $password,
                                isSecure: true
                            )
                        }
                    }
                    
                    // Error message
                    if let error = errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundColor(.red)
                            Text(error)
                                .font(.subheadline)
                                .foregroundColor(.red)
                        }
                    }
                }
                .padding(.horizontal, 24)
                
                Spacer()
                
                // Next/Submit button
                HStack {
                    Spacer()
                    
                    Button(action: handleNext) {
                        ZStack {
                            Circle()
                                .fill(canProceed ? AppTheme.neonGreen : AppTheme.textPrimary.opacity(0.08))
                                .frame(width: 64, height: 64)
                                .shadow(color: canProceed ? AppTheme.neonGlow : .clear, radius: 8, x: 0, y: 4)
                            
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .black))
                            } else {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(canProceed ? .black : AppTheme.textTertiary)
                            }
                        }
                    }
                    .disabled(!canProceed || isLoading)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 50)
        }
        .background(AppTheme.background)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                isInputFocused = true
            }
        }
        .animation(.easeInOut(duration: 0.3), value: currentStep)
    }
    
    private func goBack() {
        if currentStep == .firstName {
            dismiss()
        } else {
            errorMessage = nil
            withAnimation {
                currentStep = SignUpStep(rawValue: currentStep.rawValue - 1) ?? .firstName
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isInputFocused = true
            }
        }
    }
    
    private func handleNext() {
        errorMessage = nil
        
        if currentStep == .credentials {
            // Final step - submit
            signUp()
        } else {
            // Go to next step
            withAnimation {
                currentStep = SignUpStep(rawValue: currentStep.rawValue + 1) ?? .credentials
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isInputFocused = true
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
                    firstName: firstName.trimmingCharacters(in: .whitespaces),
                    lastName: lastName.trimmingCharacters(in: .whitespaces)
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct SignUpTextField: View {
    let placeholder: String
    @Binding var text: String
    var isEmailField: Bool = false
    var autocapitalizeWords: Bool = false
    var isSecure: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(placeholder.components(separatedBy: "(").first?.trimmingCharacters(in: .whitespaces) ?? placeholder)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(AppTheme.textSecondary)
            
            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                        #if canImport(UIKit)
                        .keyboardType(isEmailField ? .emailAddress : .default)
                        .textInputAutocapitalization(autocapitalizeWords ? .words : .never)
                        #endif
                }
            }
            .font(.system(size: 17))
            .padding(.horizontal, 16)
            .padding(.vertical, 18)
            .background(AppTheme.textPrimary.opacity(0.04))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(AppTheme.textPrimary.opacity(0.06), lineWidth: 1)
            )
        }
    }
}

#Preview {
    SignUpFlowView()
        .environmentObject(AuthService())
}
