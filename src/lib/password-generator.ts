import crypto from "node:crypto";
import { z } from "zod";

export const PasswordOptionsSchema = z.object({
  length: z.number().int().min(4).max(128).default(12),
  includeUppercase: z.boolean().default(true),
  includeLowercase: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  includeSymbols: z.boolean().default(true),
  includeExtraSymbols: z.boolean().default(false),
  excludeSimilar: z.boolean().default(false),
  excludeAmbiguous: z.boolean().default(false),
  customChars: z.string().optional(),
  pattern: z.string().optional(),
});

export type PasswordOptions = z.infer<typeof PasswordOptionsSchema>;

export class PasswordGenerator {
  private static readonly LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
  private static readonly UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  private static readonly NUMBERS = "0123456789";
  private static readonly SYMBOLS = "!@#$%^&*";
  private static readonly EXTRA_SYMBOLS = "()_+-=[]{}|;:,.<>?";
  private static readonly SIMILAR_CHARS = "il1Lo0O";
  private static readonly AMBIGUOUS_CHARS = "{}[]()/\\'\"`~,;.<>";

  static generate(options: PasswordOptions): string {
    const validatedOptions = PasswordOptionsSchema.parse(options);

    if (validatedOptions.customChars) {
      return this.generateFromCustomChars(
        validatedOptions.customChars,
        validatedOptions.length,
      );
    }

    const charset = this.buildCharset(validatedOptions);

    if (charset.length === 0) {
      throw new Error("No character types selected for password generation");
    }

    return this.generateSecurePassword(charset, validatedOptions.length);
  }

  private static buildCharset(options: PasswordOptions): string {
    let charset = "";

    if (options.includeLowercase) charset += this.LOWERCASE;
    if (options.includeUppercase) charset += this.UPPERCASE;
    if (options.includeNumbers) charset += this.NUMBERS;
    if (options.includeSymbols) charset += this.SYMBOLS;
    if (options.includeExtraSymbols) charset += this.EXTRA_SYMBOLS;

    if (options.excludeSimilar) {
      charset = charset
        .split("")
        .filter((char) => !this.SIMILAR_CHARS.includes(char))
        .join("");
    }

    if (options.excludeAmbiguous) {
      charset = charset
        .split("")
        .filter((char) => !this.AMBIGUOUS_CHARS.includes(char))
        .join("");
    }

    return charset;
  }

  private static generateSecurePassword(
    charset: string,
    length: number,
  ): string {
    const password = new Array(length);
    const charsetLength = charset.length;

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charsetLength);
      password[i] = charset[randomIndex];
    }

    return password.join("");
  }

  private static generateFromCustomChars(
    customChars: string,
    length: number,
  ): string {
    return this.generateSecurePassword(customChars, length);
  }

  static calculateStrength(password: string): {
    score: number;
    level: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong" | "Very Strong";
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else if (password.length >= 6) score += 10;
    else feedback.push("Password should be at least 8 characters long");

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push("Add lowercase letters");

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push("Add uppercase letters");

    if (/\d/.test(password)) score += 15;
    else feedback.push("Add numbers");

    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 20;
    else feedback.push("Add special characters");

    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push("Avoid repeating characters");
    }

    if (/123|abc|qwe/i.test(password)) {
      score -= 15;
      feedback.push("Avoid common sequences");
    }

    const level =
      score >= 90
        ? "Very Strong"
        : score >= 75
          ? "Strong"
          : score >= 60
            ? "Good"
            : score >= 40
              ? "Fair"
              : score >= 20
                ? "Weak"
                : "Very Weak";

    return { score: Math.max(0, score), level, feedback };
  }
}
