import { confirm, intro, outro, select } from "@clack/prompts";
import clipboardy from "clipboardy";
import { bold, cyan, dim, green, yellow } from "colorette";
import { Command } from "commander";
import consola from "consola";

import { clearHistory, loadHistory, type HistoryEntry } from "@/lib/history.js";

export const historyCommand = new Command()
  .name("history")
  .alias("h")
  .description("📚 Manage password history")
  .option("-l, --list", "list password history")
  .option("-c, --clear", "clear password history")
  .option("--limit <number>", "limit number of entries to show", "10")
  .action(async (options) => {
    try {
      if (options.clear) {
        await clearHistoryCommand();
      } else if (options.list) {
        await listHistory(parseInt(options.limit));
      } else {
        await interactiveHistory();
      }
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        consola.error("History operation failed:", error.message);
      } else {
        consola.error("An unexpected error occurred");
      }
      process.exit(1);
    }
  });

async function listHistory(limit: number = 10) {
  const history = await loadHistory();

  if (history.length === 0) {
    consola.info("📭 No password history found");
    return;
  }

  console.log(cyan(`\n📚 Password History (${Math.min(limit, history.length)} of ${history.length}):`));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const entries = history.slice(0, limit);

  entries.forEach((entry, index) => {
    const date = new Date(entry.createdAt).toLocaleString();
    const maskedPassword = maskPassword(entry.password);
    const options = formatOptions(entry.options);

    console.log(`\n${bold(`${index + 1}.`)} ${dim(date)}`);
    console.log(`   Password: ${yellow(maskedPassword)}`);
    console.log(`   Settings: ${dim(options)}`);
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function clearHistoryCommand() {
  const confirmed = await confirm({
    message: "Are you sure you want to clear all password history?",
  });

  if (confirmed) {
    await clearHistory();
    consola.success("🗑️  Password history cleared");
  } else {
    consola.info("Operation cancelled");
  }
}

async function interactiveHistory() {
  intro(cyan("📚 Password History"));

  const history = await loadHistory();

  if (history.length === 0) {
    consola.info("📭 No password history found");
    outro("Generate some passwords first!");
    return;
  }

  const action = await select({
    message: "What would you like to do?",
    options: [
      { value: "view", label: "👀 View History" },
      { value: "copy", label: "📋 Copy Password" },
      { value: "clear", label: "🗑️  Clear History" },
    ],
  });

  switch (action) {
    case "view":
      await listHistory(20);
      break;
    case "copy":
      await copyFromHistory(history);
      break;
    case "clear":
      await clearHistoryCommand();
      break;
  }

  outro(green("✨ Done!"));
}

async function copyFromHistory(history: HistoryEntry[]) {
  const options = history.slice(0, 10).map((entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();
    const maskedPassword = maskPassword(entry.password);
    const settings = formatOptions(entry.options);

    return {
      value: entry.id,
      label: `${maskedPassword} (${date})`,
      hint: settings,
    };
  });

  const selectedId = await select({
    message: "Select password to copy:",
    options,
  });

  const selectedEntry = history.find((entry) => entry.id === selectedId);

  if (selectedEntry) {
    try {
      await clipboardy.write(selectedEntry.password);
      consola.success("📋 Password copied to clipboard!");
    } catch {
      consola.error("Failed to copy password to clipboard");
    }
  }
}

function maskPassword(password: string): string {
  if (password.length <= 4) {
    return "••••";
  }

  const start = password.substring(0, 2);
  const end = password.substring(password.length - 2);
  const middle = "•".repeat(password.length - 4);

  return `${start}${middle}${end}`;
}

function formatOptions(options: HistoryEntry["options"]): string {
  const parts = [];

  parts.push(`L:${options.length}`);

  if (options.includeUppercase) parts.push("A-Z");
  if (options.includeLowercase) parts.push("a-z");
  if (options.includeNumbers) parts.push("0-9");
  if (options.includeSymbols) parts.push("!@#");
  if (options.includeExtraSymbols) parts.push("[]{}");

  return parts.join(" ");
}
