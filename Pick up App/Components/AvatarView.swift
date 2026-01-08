//
//  AvatarView.swift
//  Sports App 1
//

import SwiftUI

struct AvatarView: View {
    let url: String?
    let initials: String
    let size: CGFloat
    var borderColor: Color = .white
    var borderWidth: CGFloat = 2
    var showBorder: Bool = true
    
    var body: some View {
        Group {
            if let urlString = url, let imageUrl = URL(string: urlString) {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .empty:
                        placeholderView
                            .overlay(
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.7)
                            )
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        placeholderView
                    @unknown default:
                        placeholderView
                    }
                }
            } else {
                placeholderView
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(
            Circle()
                .stroke(showBorder ? borderColor : .clear, lineWidth: borderWidth)
        )
    }
    
    private var placeholderView: some View {
        ZStack {
            Circle()
                .fill(AppTheme.textPrimary.opacity(0.12))
            
            Text(initials)
                .font(.system(size: size * 0.4, weight: .bold))
                .foregroundColor(AppTheme.textPrimary.opacity(0.6))
        }
    }
}

// Avatar stack for showing multiple participants
struct AvatarStackView: View {
    let avatars: [(url: String?, initials: String)]
    let size: CGFloat
    let maxVisible: Int
    
    init(avatars: [(url: String?, initials: String)], size: CGFloat = 32, maxVisible: Int = 4) {
        self.avatars = avatars
        self.size = size
        self.maxVisible = maxVisible
    }
    
    var body: some View {
        HStack(spacing: -size * 0.3) {
            ForEach(0..<min(avatars.count, maxVisible), id: \.self) { index in
                AvatarView(
                    url: avatars[index].url,
                    initials: avatars[index].initials,
                    size: size,
                    borderColor: .white,
                    borderWidth: 2
                )
                .zIndex(Double(maxVisible - index))
            }
            
            if avatars.count > maxVisible {
                ZStack {
                    Circle()
                        .fill(AppTheme.textSecondary)
                    
                    Text("+\(avatars.count - maxVisible)")
                        .font(.system(size: size * 0.35, weight: .bold))
                        .foregroundColor(.white)
                }
                .frame(width: size, height: size)
                .overlay(
                    Circle()
                        .stroke(Color.white, lineWidth: 2)
                )
            }
        }
    }
}

// Avatar with online indicator
struct AvatarWithStatusView: View {
    let url: String?
    let initials: String
    let size: CGFloat
    var isOnline: Bool = false
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            AvatarView(
                url: url,
                initials: initials,
                size: size,
                showBorder: false
            )
            
            if isOnline {
                Circle()
                    .fill(AppTheme.success)
                    .frame(width: size * 0.25, height: size * 0.25)
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 2)
                    )
                    .offset(x: 2, y: 2)
            }
        }
    }
}

#Preview {
    VStack(spacing: 24) {
        AvatarView(url: nil, initials: "JD", size: 80)
        
        AvatarStackView(
            avatars: [
                (nil, "JD"),
                (nil, "AB"),
                (nil, "CD"),
                (nil, "EF"),
                (nil, "GH")
            ],
            size: 40
        )
        
        AvatarWithStatusView(url: nil, initials: "JD", size: 60, isOnline: true)
    }
    .padding()
}

