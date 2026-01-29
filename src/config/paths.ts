import os from "node:os";
import path from "node:path";
import type { AIProConfig } from "./types.js";

/**
 * Nix mode detection: When AIPRO_NIX_MODE=1, the gateway is running under Nix.
 */
export function resolveIsNixMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.AIPRO_NIX_MODE === "1";
}

export const isNixMode = resolveIsNixMode();

const STATE_DIRNAME = ".aipro";
const CONFIG_FILENAME = "aipro.json";

function stateDir(homedir: () => string = os.homedir): string {
  return path.join(homedir(), STATE_DIRNAME);
}

function resolveUserPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("~")) {
    const expanded = trimmed.replace(/^~(?=$|[\\/])/, os.homedir());
    return path.resolve(expanded);
  }
  return path.resolve(trimmed);
}

/** @deprecated Use resolveStateDir instead */
export function resolveLegacyStateDir(homedir: () => string = os.homedir): string {
  return stateDir(homedir);
}

/** @deprecated Use resolveStateDir instead */
export function resolveNewStateDir(homedir: () => string = os.homedir): string {
  return stateDir(homedir);
}

/**
 * State directory for mutable data (sessions, logs, caches).
 * Can be overridden via AIPRO_STATE_DIR.
 * Default: ~/.aipro
 */
export function resolveStateDir(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): string {
  const override = env.AIPRO_STATE_DIR?.trim();
  if (override) return resolveUserPath(override);
  return stateDir(homedir);
}

export const STATE_DIR = resolveStateDir();

/**
 * Config file path.
 * Can be overridden via AIPRO_CONFIG_PATH.
 * Default: ~/.aipro/aipro.json
 */
export function resolveCanonicalConfigPath(
  env: NodeJS.ProcessEnv = process.env,
  stateDirectory: string = resolveStateDir(env, os.homedir),
): string {
  const override = env.AIPRO_CONFIG_PATH?.trim();
  if (override) return resolveUserPath(override);
  return path.join(stateDirectory, CONFIG_FILENAME);
}

/**
 * Resolve the active config path.
 */
export function resolveConfigPathCandidate(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): string {
  const override = env.AIPRO_CONFIG_PATH?.trim();
  if (override) return resolveUserPath(override);
  return path.join(resolveStateDir(env, homedir), CONFIG_FILENAME);
}

/**
 * Active config path.
 */
export function resolveConfigPath(
  env: NodeJS.ProcessEnv = process.env,
  stateDirectory: string = resolveStateDir(env, os.homedir),
  _homedir: () => string = os.homedir,
): string {
  const override = env.AIPRO_CONFIG_PATH?.trim();
  if (override) return resolveUserPath(override);
  return path.join(stateDirectory, CONFIG_FILENAME);
}

export const CONFIG_PATH = resolveConfigPathCandidate();

/**
 * Resolve config path candidates.
 */
export function resolveDefaultConfigCandidates(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): string[] {
  const override = env.AIPRO_CONFIG_PATH?.trim();
  if (override) return [resolveUserPath(override)];
  return [path.join(resolveStateDir(env, homedir), CONFIG_FILENAME)];
}

export const DEFAULT_GATEWAY_PORT = 18789;

/**
 * Gateway lock directory (ephemeral).
 * Default: os.tmpdir()/aipro-<uid>
 */
export function resolveGatewayLockDir(tmpdir: () => string = os.tmpdir): string {
  const base = tmpdir();
  const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
  const suffix = uid != null ? `aipro-${uid}` : "aipro";
  return path.join(base, suffix);
}

const OAUTH_FILENAME = "oauth.json";

/**
 * OAuth credentials storage directory.
 * Default: ~/.aipro/credentials
 */
export function resolveOAuthDir(
  env: NodeJS.ProcessEnv = process.env,
  stateDirectory: string = resolveStateDir(env, os.homedir),
): string {
  const override = env.AIPRO_OAUTH_DIR?.trim();
  if (override) return resolveUserPath(override);
  return path.join(stateDirectory, "credentials");
}

export function resolveOAuthPath(
  env: NodeJS.ProcessEnv = process.env,
  stateDirectory: string = resolveStateDir(env, os.homedir),
): string {
  return path.join(resolveOAuthDir(env, stateDirectory), OAUTH_FILENAME);
}

export function resolveGatewayPort(
  cfg?: AIProConfig,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const envRaw = env.AIPRO_GATEWAY_PORT?.trim();
  if (envRaw) {
    const parsed = Number.parseInt(envRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const configPort = cfg?.gateway?.port;
  if (typeof configPort === "number" && Number.isFinite(configPort)) {
    if (configPort > 0) return configPort;
  }
  return DEFAULT_GATEWAY_PORT;
}
