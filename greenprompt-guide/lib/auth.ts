import bcryptjs from "bcryptjs";

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string" || email.length > 254 || email.includes(" ")) return false;

  const atIndex = email.indexOf("@");
  // must have exactly one @ and not at the start or end
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@") || atIndex === email.length - 1) {
    return false;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  // local part length limit
  if (local.length === 0 || local.length > 64) return false;

  // domain must exist and contain at least one dot
  if (!domain || domain.length > 255 || !domain.includes(".")) return false;

  // Domain labels: 1-63 chars, letters/digits/hyphen, cannot start/end with hyphen
  const labels = domain.split(".");
  for (const label of labels) {
    if (!label || label.length > 63) return false;
    if (!/^[A-Za-z0-9-]+$/.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }

  // Local part: disallow leading/trailing dot and consecutive dots
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (local.includes("..")) return false;

  // Allow common local-part characters per RFC but keep regex simple (linear)
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;

  return true;
}

/**
 * Validate password strength (minimum 8 characters)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
