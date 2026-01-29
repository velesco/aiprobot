import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createConfigIO } from "./io.js";

async function withTempHome(run: (home: string) => Promise<void>): Promise<void> {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "aipro-config-"));
  try {
    await run(home);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
}

async function writeConfig(home: string, port: number) {
  const dir = path.join(home, ".aipro");
  await fs.mkdir(dir, { recursive: true });
  const configPath = path.join(dir, "aipro.json");
  await fs.writeFile(configPath, JSON.stringify({ gateway: { port } }, null, 2));
  return configPath;
}

describe("config io", () => {
  it("uses ~/.aipro/aipro.json by default", async () => {
    await withTempHome(async (home) => {
      const configPath = await writeConfig(home, 19001);

      const io = createConfigIO({
        env: {} as NodeJS.ProcessEnv,
        homedir: () => home,
      });
      expect(io.configPath).toBe(configPath);
      expect(io.loadConfig().gateway?.port).toBe(19001);
    });
  });

  it("returns default path even when config file is missing", async () => {
    await withTempHome(async (home) => {
      const io = createConfigIO({
        env: {} as NodeJS.ProcessEnv,
        homedir: () => home,
      });

      expect(io.configPath).toBe(path.join(home, ".aipro", "aipro.json"));
      expect(io.loadConfig().gateway?.port).toBeUndefined();
    });
  });

  it("honors AIPRO_CONFIG_PATH env override", async () => {
    await withTempHome(async (home) => {
      // Create config in a custom location
      const customDir = path.join(home, "custom-config");
      await fs.mkdir(customDir, { recursive: true });
      const customConfigPath = path.join(customDir, "custom.json");
      await fs.writeFile(customConfigPath, JSON.stringify({ gateway: { port: 20002 } }, null, 2));

      const io = createConfigIO({
        env: { AIPRO_CONFIG_PATH: customConfigPath } as NodeJS.ProcessEnv,
        homedir: () => home,
      });

      expect(io.configPath).toBe(customConfigPath);
      expect(io.loadConfig().gateway?.port).toBe(20002);
    });
  });

  it("honors AIPRO_STATE_DIR env override", async () => {
    await withTempHome(async (home) => {
      // Create config in a custom state directory
      const customStateDir = path.join(home, "custom-state");
      await fs.mkdir(customStateDir, { recursive: true });
      const customConfigPath = path.join(customStateDir, "aipro.json");
      await fs.writeFile(customConfigPath, JSON.stringify({ gateway: { port: 30001 } }, null, 2));

      const io = createConfigIO({
        env: { AIPRO_STATE_DIR: customStateDir } as NodeJS.ProcessEnv,
        homedir: () => home,
      });

      expect(io.configPath).toBe(customConfigPath);
      expect(io.loadConfig().gateway?.port).toBe(30001);
    });
  });
});
