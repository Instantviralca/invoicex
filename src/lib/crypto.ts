import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

export function generateUrlSafeToken(length = 32): string {
  return nanoid(length);
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

export function hashIpAddress(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? process.env.AUTH_SECRET ?? "invoicerush";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
