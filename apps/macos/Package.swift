// swift-tools-version: 6.2
// Package manifest for the AIPro macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "AIPro",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "AiproIPC", targets: ["AiproIPC"]),
        .library(name: "AiproDiscovery", targets: ["AiproDiscovery"]),
        .executable(name: "AIPro", targets: ["AIPro"]),
        .executable(name: "aipro-mac", targets: ["AiproMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/AiproKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "AiproIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "AiproDiscovery",
            dependencies: [
                .product(name: "AiproKit", package: "AiproKit"),
            ],
            path: "Sources/AiproDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "AIPro",
            dependencies: [
                "AiproIPC",
                "AiproDiscovery",
                .product(name: "AiproKit", package: "AiproKit"),
                .product(name: "AiproChatUI", package: "AiproKit"),
                .product(name: "AiproProtocol", package: "AiproKit"),
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
            name: "AiproMacCLI",
            dependencies: [
                "AiproDiscovery",
                .product(name: "AiproKit", package: "AiproKit"),
                .product(name: "AiproProtocol", package: "AiproKit"),
            ],
            path: "Sources/AiproMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "AiproIPCTests",
            dependencies: [
                "AiproIPC",
                "AIPro",
                "AiproDiscovery",
                .product(name: "AiproProtocol", package: "AiproKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
