import { describe, expect, it } from "vitest";

import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "aipro", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "aipro", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "aipro", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "aipro", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "aipro", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "aipro", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "aipro", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "aipro"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "aipro", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "aipro", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "aipro", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "aipro", "status", "--timeout=2500"], "--timeout")).toBe("2500");
    expect(getFlagValue(["node", "aipro", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "aipro", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "aipro", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "aipro", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "aipro", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "aipro", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "aipro", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "aipro", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "aipro", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "aipro", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["node", "aipro", "status"],
    });
    expect(nodeArgv).toEqual(["node", "aipro", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["node-22", "aipro", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "aipro", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["node-22.2.0.exe", "aipro", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "aipro", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["node-22.2", "aipro", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "aipro", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["node-22.2.exe", "aipro", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "aipro", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["/usr/bin/node-22.2.0", "aipro", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "aipro", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["nodejs", "aipro", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "aipro", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["node-dev", "aipro", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "aipro", "node-dev", "aipro", "status"]);

    const directArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["aipro", "status"],
    });
    expect(directArgv).toEqual(["node", "aipro", "status"]);

    const bunArgv = buildParseArgv({
      programName: "aipro",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "aipro",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "aipro", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "aipro", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "aipro", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "aipro", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "aipro", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "aipro", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "aipro", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "aipro", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
