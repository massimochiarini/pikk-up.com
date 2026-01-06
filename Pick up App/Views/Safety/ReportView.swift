//
//  ReportView.swift
//  Sports App 1
//
//  Report content UI

import SwiftUI
import Auth

struct ReportView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    let contentType: SafetyService.ReportableContentType
    let contentId: UUID
    let contentTitle: String // e.g., user name, game title
    
    @StateObject private var safetyService = SafetyService()
    @State private var selectedReportType: SafetyService.ReportType?
    @State private var description = ""
    @State private var isSubmitting = false
    @State private var showSuccessAlert = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Image(systemName: "exclamationmark.shield.fill")
                            .font(.system(size: 48))
                            .foregroundColor(AppTheme.error)
                            .frame(maxWidth: .infinity, alignment: .center)
                        
                        Text("Report \(contentTypeName)")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(AppTheme.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .center)
                        
                        Text("Help us keep Pickup safe for everyone")
                            .font(.system(size: 15))
                            .foregroundColor(AppTheme.textSecondary)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .padding(.top, 20)
                    
                    // Content being reported
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Reporting")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(AppTheme.textTertiary)
                            .textCase(.uppercase)
                        
                        Text(contentTitle)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(AppTheme.divider)
                            .cornerRadius(12)
                    }
                    
                    // Reason selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("What's wrong?")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(AppTheme.textPrimary)
                        
                        ForEach(SafetyService.ReportType.allCases, id: \.self) { type in
                            ReportTypeButton(
                                type: type,
                                isSelected: selectedReportType == type,
                                action: { selectedReportType = type }
                            )
                        }
                    }
                    
                    // Additional details
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Additional details (optional)")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(AppTheme.textSecondary)
                        
                        TextEditor(text: $description)
                            .frame(height: 100)
                            .padding(12)
                            .background(AppTheme.divider)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(AppTheme.border, lineWidth: 1)
                            )
                    }
                    
                    // Error message
                    if let error = errorMessage {
                        Text(error)
                            .font(.system(size: 14))
                            .foregroundColor(AppTheme.error)
                            .padding(.horizontal, 12)
                    }
                    
                    // Submit button
                    Button(action: submitReport) {
                        HStack {
                            if isSubmitting {
                                ProgressView()
                                    .progressViewStyle(.circular)
                                    .tint(.white)
                            } else {
                                Text("Submit Report")
                                    .font(.system(size: 17, weight: .semibold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(selectedReportType != nil ? AppTheme.error : AppTheme.error.opacity(0.5))
                        .foregroundColor(.white)
                        .cornerRadius(16)
                    }
                    .disabled(selectedReportType == nil || isSubmitting)
                    
                    // Disclaimer
                    Text("We review all reports and take appropriate action. Reports are confidential and the person won't know you reported them.")
                        .font(.system(size: 13))
                        .foregroundColor(AppTheme.textTertiary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                    
                    Spacer()
                }
                .padding(.horizontal, 20)
            }
            .background(AppTheme.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(AppTheme.textSecondary)
                }
            }
            .alert("Report Submitted", isPresented: $showSuccessAlert) {
                Button("OK") { dismiss() }
            } message: {
                Text("Thank you for helping keep Pickup safe. We'll review your report and take appropriate action.")
            }
        }
        .navigationViewStyle(.stack)
    }
    
    private var contentTypeName: String {
        switch contentType {
        case .user: return "User"
        case .message: return "Message"
        case .game: return "Game"
        case .post: return "Post"
        }
    }
    
    private func submitReport() {
        guard let reportType = selectedReportType,
              let userId = authService.currentUser?.id else { return }
        
        isSubmitting = true
        errorMessage = nil
        
        Task {
            do {
                try await safetyService.reportContent(
                    reporterId: userId,
                    contentType: contentType,
                    contentId: contentId,
                    reportType: reportType,
                    description: description.isEmpty ? nil : description
                )
                
                isSubmitting = false
                showSuccessAlert = true
            } catch {
                errorMessage = "Failed to submit report. Please try again."
                isSubmitting = false
            }
        }
    }
}

// MARK: - Report Type Button

struct ReportTypeButton: View {
    let type: SafetyService.ReportType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? AppTheme.brandBlue : AppTheme.textTertiary)
                
                Text(type.displayName)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(AppTheme.textPrimary)
                
                Spacer()
            }
            .padding(.vertical, 16)
            .padding(.horizontal, 16)
            .background(isSelected ? AppTheme.brandBlue.opacity(0.08) : AppTheme.divider)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? AppTheme.brandBlue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    ReportView(
        contentType: .user,
        contentId: UUID(),
        contentTitle: "John Doe"
    )
    .environmentObject(AuthService.shared)
}

