// swift-tools-version: 6.2
// Package manifest for the AIPro macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "AIPro",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "AIProIPC", targets: ["AIProIPC"]),
        .library(name: "AIProDiscovery", targets: ["AIProDiscovery"]),
        .executable(name: "AIPro", targets: ["AIPro"]),
        .executable(name: "aipro-mac", targets: ["AIProMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/AIProKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "AIProIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "AIProDiscovery",
            dependencies: [
                .product(name: "AIProKit", package: "AIProKit"),
            ],
            path: "Sources/AIProDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "AIPro",
            dependencies: [
                "AIProIPC",
                "AIProDiscovery",
                .product(name: "AIProKit", package: "AIProKit"),
                .product(name: "AIProChatUI", package: "AIProKit"),
                .product(name: "AIProProtocol", package: "AIProKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/AIPro.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "AIProMacCLI",
            dependencies: [
                "AIProDiscovery",
                .product(name: "AIProKit", package: "AIProKit"),
                .product(name: "AIProProtocol", package: "AIProKit"),
            ],
            path: "Sources/AIProMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "AIProIPCTests",
            dependencies: [
                "AIProIPC",
                "AIPro",
                "AIProDiscovery",
                .product(name: "AIProProtocol", package: "AIProKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
