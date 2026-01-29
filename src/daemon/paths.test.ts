import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".aipro"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", AIPRO_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".aipro-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", AIPRO_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".aipro"));
  });

  it("uses AIPRO_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", AIPRO_STATE_DIR: "/var/lib/aipro" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/aipro"));
  });

  it("expands ~ in AIPRO_STATE_DIR", () => {
    const env = { HOME: "/Users/test", AIPRO_STATE_DIR: "~/aipro-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/aipro-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { AIPRO_STATE_DIR: "C:\\State\\aipro" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\aipro");
  });
});
