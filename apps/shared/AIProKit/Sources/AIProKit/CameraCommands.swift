import Foundation

public enum AIProCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum AIProCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum AIProCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum AIProCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct AIProCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: AIProCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: AIProCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: AIProCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: AIProCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct AIProCameraClipParams: Codable, Sendable, Equatable {
    public var facing: AIProCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: AIProCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: AIProCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: AIProCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
