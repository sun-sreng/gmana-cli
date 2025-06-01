import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

const ConfigSchema = z.object({
  defaultLength: z.number().int().min(4).max(128).default(12),
  defaultIncludeUppercase: z.boolean().default(true),
  defaultIncludeLowercase: z.boolean().default(true),
  defaultIncludeNumbers: z.boolean().default(true),
  defaultIncludeSymbols: z.boolean().default(true),
  autoCopy: z.boolean().default(true),
  saveHistory: z.boolean().default(false),
  historyLimit: z.number().int().min(0).max(1000).default(100),
});

export type Config = z.infer<typeof ConfigSchema>;

const CONFIG_DIR = path.join(os.homedir(), ".gmana");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<Config> {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const rawConfig = await fs.readJson(CONFIG_FILE);
      return ConfigSchema.parse(rawConfig);
    }
  } catch {
    // Fall back to defaults if config is invalid
  }

  return ConfigSchema.parse({});
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, ...config };
  const validatedConfig = ConfigSchema.parse(newConfig);
  await fs.writeJson(CONFIG_FILE, validatedConfig, { spaces: 2 });
}
