import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { PasswordOptions } from "./password-generator.js";

const HistoryEntrySchema = z.object({
  id: z.string(),
  password: z.string(),
  options: z.object({
    length: z.number(),
    includeUppercase: z.boolean(),
    includeLowercase: z.boolean(),
    includeNumbers: z.boolean(),
    includeSymbols: z.boolean(),
    includeExtraSymbols: z.boolean(),
  }),
  createdAt: z.string(),
});

const HistorySchema = z.array(HistoryEntrySchema);

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

const CONFIG_DIR = path.join(os.homedir(), ".gmana");
const HISTORY_FILE = path.join(CONFIG_DIR, "history.json");

export async function saveToHistory(
  password: string,
  options: PasswordOptions,
): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);

  const history = await loadHistory();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    password,
    options: {
      length: options.length,
      includeUppercase: options.includeUppercase,
      includeLowercase: options.includeLowercase,
      includeNumbers: options.includeNumbers,
      includeSymbols: options.includeSymbols,
      includeExtraSymbols: options.includeExtraSymbols,
    },
    createdAt: new Date().toISOString(),
  };

  history.unshift(entry);

  // Keep only the latest 100 entries
  const limitedHistory = history.slice(0, 100);

  await fs.writeJson(HISTORY_FILE, limitedHistory, { spaces: 2 });
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    if (await fs.pathExists(HISTORY_FILE)) {
      const rawHistory = await fs.readJson(HISTORY_FILE);
      return HistorySchema.parse(rawHistory);
    }
  } catch (error) {
    // Return empty array if history file is invalid
  }

  return [];
}

export async function clearHistory(): Promise<void> {
  if (await fs.pathExists(HISTORY_FILE)) {
    await fs.remove(HISTORY_FILE);
  }
}
