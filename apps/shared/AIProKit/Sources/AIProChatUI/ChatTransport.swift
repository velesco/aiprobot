import Foundation

public enum AIProChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(AIProChatEventPayload)
    case agent(AIProAgentEventPayload)
    case seqGap
}

public protocol AIProChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> AIProChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [AIProChatAttachmentPayload]) async throws -> AIProChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> AIProChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<AIProChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension AIProChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "AIProChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> AIProChatSessionsListResponse {
        throw NSError(
            domain: "AIProChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
