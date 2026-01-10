//
//  MessagePayloads.swift
//  PickleballApp
//
//

import Foundation

enum MessagePayloadType: String, Codable {
    case gameInvite = "game_invite"
    case gameInviteResponse = "game_invite_response"
}

enum InviteResponseStatus: String, Codable {
    case accepted
    case declined
    
    var displayText: String {
        switch self {
        case .accepted: return "accepted"
        case .declined: return "declined"
        }
    }
}

struct GameInvitePayload: Codable {
    let type: MessagePayloadType
    let gameId: UUID
    let gameName: String
    let address: String
    let formattedDate: String
    let formattedTime: String
    let inviterId: UUID
    
    init(
        gameId: UUID,
        gameName: String,
        address: String,
        formattedDate: String,
        formattedTime: String,
        inviterId: UUID
    ) {
        self.type = .gameInvite
        self.gameId = gameId
        self.gameName = gameName
        self.address = address
        self.formattedDate = formattedDate
        self.formattedTime = formattedTime
        self.inviterId = inviterId
    }
}

struct GameInviteResponsePayload: Codable {
    let type: MessagePayloadType
    let gameId: UUID
    let responderId: UUID
    let responderName: String
    let status: InviteResponseStatus
    let gameName: String
    let formattedDate: String
    let formattedTime: String
    
    init(
        gameId: UUID,
        responderId: UUID,
        responderName: String,
        status: InviteResponseStatus,
        gameName: String,
        formattedDate: String,
        formattedTime: String
    ) {
        self.type = .gameInviteResponse
        self.gameId = gameId
        self.responderId = responderId
        self.responderName = responderName
        self.status = status
        self.gameName = gameName
        self.formattedDate = formattedDate
        self.formattedTime = formattedTime
    }
}

extension Encodable {
    /// Encodes an Encodable into a JSON string for storage in the messages table.
    var jsonString: String? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        
        guard let data = try? encoder.encode(self) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
