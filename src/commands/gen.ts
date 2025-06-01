import { confirm, intro, multiselect, outro, spinner, text } from "@clack/prompts";
import clipboardy from "clipboardy";
import { bgBlue, bold, cyan, dim, green, red, white, yellow } from "colorette";
import { Command } from "commander";
import consola from "consola";

import { loadConfig } from "@/lib/config";
import { saveToHistory } from "@/lib/history.js";
import { PasswordGenerator, type PasswordOptions } from "@/lib/password-generator.js";
import type { CommandOptions } from "@/types/command-options";

export const genCommand = new Command()
  .name("gen")
  .alias("g")
  .description("🎲 Generate a secure password")
  .option("-l, --length <number>", "password length", "12")
  .option("-i, --interactive", "interactive mode", false)
  .option("--no-uppercase", "exclude uppercase letters")
  .option("--no-lowercase", "exclude lowercase letters")
  .option("--no-numbers", "exclude numbers")
  .option("--no-symbols", "exclude symbols")
  .option("--extra-symbols", "include extra symbols")
  .option("--exclude-similar", "exclude similar characters (il1Lo0O)")
  .option("--exclude-ambiguous", "exclude ambiguous characters")
  .option("-c, --copy", "copy to clipboard", true)
  .option("-s, --save", "save to history", false)
  .option("--show-strength", "show password strength", true)
  .action(async (options) => {
    try {
      if (options.interactive) {
        await runInteractiveMode();
      } else {
        await runCommandMode(options);
      }
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        consola.error("Generation failed:", error.message);
      } else {
        consola.error("An unexpected error occurred");
      }
      process.exit(1);
    }
  });

async function runInteractiveMode() {
  intro(cyan("🔐 Password Generator"));

  const length = await text({
    message: "Password length?",
    placeholder: "12",
    validate: (value) => {
      const num = parseInt(value || "12");
      if (isNaN(num) || num < 4 || num > 128) {
        return "Length must be between 4 and 128";
      }
    },
  });

  const charTypes = await multiselect({
    message: "Select character types:",
    options: [
      { value: "uppercase", label: "Uppercase (A-Z)", hint: "recommended" },
      { value: "lowercase", label: "Lowercase (a-z)", hint: "recommended" },
      { value: "numbers", label: "Numbers (0-9)", hint: "recommended" },
      { value: "symbols", label: "Symbols (!@#$)", hint: "recommended" },
      {
        value: "extraSymbols",
        label: "Extra Symbols ([]{}|)",
        hint: "optional",
      },
    ],
    initialValues: ["uppercase", "lowercase", "numbers", "symbols"],
  });

  const excludeOptions = await multiselect({
    message: "Exclude characters? (optional)",
    options: [
      { value: "similar", label: "Similar chars (il1Lo0O)" },
      { value: "ambiguous", label: "Ambiguous chars ({}[]/\\)" },
    ],
    required: false,
  });

  const copyToClipboard = await confirm({
    message: "Copy to clipboard?",
    initialValue: true,
  });

  const saveToHistoryConfirm = await confirm({
    message: "Save to history?",
    initialValue: false,
  });

  const passwordOptions: PasswordOptions = {
    length: parseInt(length as string) || 12,
    includeUppercase: (charTypes as string[]).includes("uppercase"),
    includeLowercase: (charTypes as string[]).includes("lowercase"),
    includeNumbers: (charTypes as string[]).includes("numbers"),
    includeSymbols: (charTypes as string[]).includes("symbols"),
    includeExtraSymbols: (charTypes as string[]).includes("extraSymbols"),
    excludeSimilar: (excludeOptions as string[]).includes("similar"),
    excludeAmbiguous: (excludeOptions as string[]).includes("ambiguous"),
  };

  await generateAndDisplay(passwordOptions, {
    copy: copyToClipboard as boolean,
    save: saveToHistoryConfirm as boolean,
    showStrength: true,
  });

  outro(green("✨ Done!"));
}

async function runCommandMode(options: CommandOptions) {
  const config = await loadConfig();

  const passwordOptions: PasswordOptions = {
    length: parseInt(options.length || "") || config.defaultLength || 12,
    includeUppercase: options.uppercase !== false,
    includeLowercase: options.lowercase !== false,
    includeNumbers: options.numbers !== false,
    includeSymbols: options.symbols !== false,
    includeExtraSymbols: options.extraSymbols ?? false,
    excludeSimilar: options.excludeSimilar ?? false,
    excludeAmbiguous: options.excludeAmbiguous ?? false,
  };

  await generateAndDisplay(passwordOptions, {
    copy: options.copy ?? false,
    save: options.save ?? false,
    showStrength: options.showStrength ?? false,
  });
}

async function generateAndDisplay(options: PasswordOptions, actions: { copy: boolean; save: boolean; showStrength: boolean }) {
  const s = spinner();
  s.start("Generating secure password...");

  await new Promise((resolve) => setTimeout(resolve, 500)); // Dramatic effect

  const password = PasswordGenerator.generate(options);
  s.stop("Password generated!");

  // Display password
  console.log("\n" + bgBlue(white(" Generated Password ")));
  console.log(bold(white(password)));

  // Show strength analysis
  if (actions.showStrength) {
    const strength = PasswordGenerator.calculateStrength(password);
    const strengthColor = strength.score >= 75 ? green : strength.score >= 50 ? yellow : red;

    console.log(`\n${bold("Strength:")} ${strengthColor(strength.level)} (${strength.score}/100)`);

    if (strength.feedback.length > 0) {
      console.log(dim("Suggestions: " + strength.feedback.join(", ")));
    }
  }

  // Copy to clipboard
  if (actions.copy) {
    try {
      await clipboardy.write(password);
      consola.success("📋 Copied to clipboard!");
    } catch {
      consola.warn("Failed to copy to clipboard");
    }
  }

  // Save to history
  if (actions.save) {
    try {
      await saveToHistory(password, options);
      consola.success("💾 Saved to history!");
    } catch {
      consola.warn("Failed to save to history");
    }
  }
}
