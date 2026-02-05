import AiproKit
import AiproProtocol
import Foundation

// Prefer the AiproKit wrapper to keep gateway request payloads consistent.
typealias AnyCodable = AiproKit.AnyCodable
typealias InstanceIdentity = AiproKit.InstanceIdentity

extension AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AnyCodable]? { self.value as? [String: AnyCodable] }
    var arrayValue: [AnyCodable]? { self.value as? [AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}

extension AiproProtocol.AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AiproProtocol.AnyCodable]? { self.value as? [String: AiproProtocol.AnyCodable] }
    var arrayValue: [AiproProtocol.AnyCodable]? { self.value as? [AiproProtocol.AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AiproProtocol.AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AiproProtocol.AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}
