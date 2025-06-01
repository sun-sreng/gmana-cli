import { confirm, intro, outro, select, text } from "@clack/prompts";
import { bold, cyan, green } from "colorette";
import { Command } from "commander";
import consola from "consola";

import { loadConfig, saveConfig, type Config } from "@/lib/config.js";

export const configCommand = new Command()
  .name("config")
  .alias("c")
  .description("⚙️  Manage configuration settings")
  .option("-s, --show", "show current configuration")
  .option("-r, --reset", "reset to default configuration")
  .option("--set <key=value>", "set a configuration value")
  .action(async (options) => {
    try {
      if (options.show) {
        await showConfig();
      } else if (options.reset) {
        await resetConfig();
      } else if (options.set) {
        await setConfigValue(options.set);
      } else {
        await interactiveConfig();
      }
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        consola.error("Configuration failed:", error.message);
      } else {
        consola.error("An unexpected error occurred");
      }
      process.exit(1);
    }
  });

async function showConfig() {
  const config = await loadConfig();

  console.log(cyan("\n📋 Current Configuration:"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const configEntries = [
    ["Default Length", config.defaultLength],
    ["Include Uppercase", config.defaultIncludeUppercase ? "✅" : "❌"],
    ["Include Lowercase", config.defaultIncludeLowercase ? "✅" : "❌"],
    ["Include Numbers", config.defaultIncludeNumbers ? "✅" : "❌"],
    ["Include Symbols", config.defaultIncludeSymbols ? "✅" : "❌"],
    ["Auto Copy", config.autoCopy ? "✅" : "❌"],
    ["Save History", config.saveHistory ? "✅" : "❌"],
    ["History Limit", config.historyLimit],
  ];

  configEntries.forEach(([key, value]) => {
    console.log(`${bold(key.toString().padEnd(20))}: ${value}`);
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function resetConfig() {
  const confirmed = await confirm({
    message: "Are you sure you want to reset all settings to defaults?",
  });

  if (confirmed) {
    await saveConfig({
      defaultLength: 12,
      defaultIncludeUppercase: true,
      defaultIncludeLowercase: true,
      defaultIncludeNumbers: true,
      defaultIncludeSymbols: true,
      autoCopy: true,
      saveHistory: false,
      historyLimit: 100,
    });
    consola.success("🔄 Configuration reset to defaults");
  } else {
    consola.info("Operation cancelled");
  }
}

async function setConfigValue(keyValue: string) {
  const [key, value] = keyValue.split("=");

  if (!key || value === undefined) {
    consola.error("Invalid format. Use: --set key=value");
    return;
  }

  // const config = await loadConfig();
  const updates: Partial<Config> = {};

  switch (key.toLowerCase()) {
    case "defaultlength":
    case "length":
      const length = parseInt(value);
      if (isNaN(length) || length < 4 || length > 128) {
        consola.error("Length must be between 4 and 128");
        return;
      }
      updates.defaultLength = length;
      break;

    case "autocopy":
      updates.autoCopy = value.toLowerCase() === "true";
      break;

    case "savehistory":
      updates.saveHistory = value.toLowerCase() === "true";
      break;

    case "historylimit":
      const limit = parseInt(value);
      if (isNaN(limit) || limit < 0 || limit > 1000) {
        consola.error("History limit must be between 0 and 1000");
        return;
      }
      updates.historyLimit = limit;
      break;

    default:
      consola.error(`Unknown configuration key: ${key}`);
      return;
  }

  await saveConfig(updates);
  consola.success(`✅ Updated ${key} = ${value}`);
}

async function interactiveConfig() {
  intro(cyan("⚙️ Configuration Settings"));

  const config = await loadConfig();

  const action = await select({
    message: "What would you like to configure?",
    options: [
      { value: "defaults", label: "🎯 Default Password Settings" },
      { value: "behavior", label: "⚡ Behavior Settings" },
      { value: "history", label: "📚 History Settings" },
      { value: "show", label: "👀 Show Current Config" },
      { value: "reset", label: "🔄 Reset to Defaults" },
    ],
  });

  switch (action) {
    case "defaults":
      await configureDefaults(config);
      break;
    case "behavior":
      await configureBehavior(config);
      break;
    case "history":
      await configureHistory(config);
      break;
    case "show":
      await showConfig();
      break;
    case "reset":
      await resetConfig();
      break;
  }

  outro(green("✨ Configuration updated!"));
}

async function configureDefaults(config: Config) {
  const length = await text({
    message: "Default password length?",
    placeholder: config.defaultLength.toString(),
    validate: (value) => {
      const num = parseInt(value || config.defaultLength.toString());
      if (isNaN(num) || num < 4 || num > 128) {
        return "Length must be between 4 and 128";
      }
    },
  });

  const uppercase = await confirm({
    message: "Include uppercase letters by default?",
    initialValue: config.defaultIncludeUppercase,
  });

  const lowercase = await confirm({
    message: "Include lowercase letters by default?",
    initialValue: config.defaultIncludeLowercase,
  });

  const numbers = await confirm({
    message: "Include numbers by default?",
    initialValue: config.defaultIncludeNumbers,
  });

  const symbols = await confirm({
    message: "Include symbols by default?",
    initialValue: config.defaultIncludeSymbols,
  });

  await saveConfig({
    defaultLength: parseInt(length as string) || config.defaultLength,
    defaultIncludeUppercase: uppercase as boolean,
    defaultIncludeLowercase: lowercase as boolean,
    defaultIncludeNumbers: numbers as boolean,
    defaultIncludeSymbols: symbols as boolean,
  });
}

async function configureBehavior(config: Config) {
  const autoCopy = await confirm({
    message: "Auto-copy passwords to clipboard?",
    initialValue: config.autoCopy,
  });

  await saveConfig({ autoCopy: autoCopy as boolean });
}

async function configureHistory(config: Config) {
  const saveHistory = await confirm({
    message: "Save password history?",
    initialValue: config.saveHistory,
  });

  let historyLimit = config.historyLimit;

  if (saveHistory) {
    const limitText = await text({
      message: "Maximum history entries?",
      placeholder: config.historyLimit.toString(),
      validate: (value) => {
        const num = parseInt(value || config.historyLimit.toString());
        if (isNaN(num) || num < 0 || num > 1000) {
          return "Limit must be between 0 and 1000";
        }
      },
    });
    historyLimit = parseInt(limitText as string) || config.historyLimit;
  }

  await saveConfig({
    saveHistory: saveHistory as boolean,
    historyLimit,
  });
}
