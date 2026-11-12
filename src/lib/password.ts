import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export type PasswordValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("Password must be at least 10 characters long.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
