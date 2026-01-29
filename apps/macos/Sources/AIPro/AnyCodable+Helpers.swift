import AIProKit
import AIProProtocol
import Foundation

// Prefer the AIProKit wrapper to keep gateway request payloads consistent.
typealias AnyCodable = AIProKit.AnyCodable
typealias InstanceIdentity = AIProKit.InstanceIdentity

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

extension AIProProtocol.AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AIProProtocol.AnyCodable]? { self.value as? [String: AIProProtocol.AnyCodable] }
    var arrayValue: [AIProProtocol.AnyCodable]? { self.value as? [AIProProtocol.AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AIProProtocol.AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AIProProtocol.AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}
