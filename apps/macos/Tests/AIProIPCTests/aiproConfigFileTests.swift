import Foundation
import Testing
@testable import AIPro

@Suite(.serialized)
struct AIProConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("aipro-config-\(UUID().uuidString)")
            .appendingPathComponent("aipro.json")
            .path

        await TestIsolation.withEnvValues(["AIPRO_CONFIG_PATH": override]) {
            #expect(AIProConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("aipro-config-\(UUID().uuidString)")
            .appendingPathComponent("aipro.json")
            .path

        await TestIsolation.withEnvValues(["AIPRO_CONFIG_PATH": override]) {
            AIProConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(AIProConfigFile.remoteGatewayPort() == 19999)
            #expect(AIProConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(AIProConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(AIProConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("aipro-config-\(UUID().uuidString)")
            .appendingPathComponent("aipro.json")
            .path

        await TestIsolation.withEnvValues(["AIPRO_CONFIG_PATH": override]) {
            AIProConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            AIProConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = AIProConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("aipro-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "AIPRO_CONFIG_PATH": nil,
            "AIPRO_STATE_DIR": dir,
        ]) {
            #expect(AIProConfigFile.stateDirURL().path == dir)
            #expect(AIProConfigFile.url().path == "\(dir)/aipro.json")
        }
    }
}
