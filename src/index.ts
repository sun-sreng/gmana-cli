import { Command } from "commander";
import consola from "consola";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { genCommand } from "@/commands/gen.js";
import pkg from "../package.json";
import { configCommand } from "./commands/config";
import { historyCommand } from "./commands/history";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const program = new Command()
    .name("gmana")
    .description("🔐 A modern password generator CLI")
    .version(pkg.version, "-v, --version", "display version number")
    .helpOption("-h, --help", "display help for command");

  program
    .addCommand(genCommand)
    .addCommand(configCommand)
    .addCommand(historyCommand);

  // Global error handling
  program.exitOverride();

  try {
    await program.parseAsync();
  } catch (error) {
    if (error instanceof Error && error.name !== "CommanderError") {
      consola.error("Unexpected error:", error.message);
      process.exit(1);
    }
    throw error;
  }
}

main().catch((error) => {
  consola.error("Fatal error:", error);
  process.exit(1);
});
