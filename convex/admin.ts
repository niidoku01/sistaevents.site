import { v } from "convex/values";

export const adminSecretArg = {
  secret: v.string(),
};

// Constant-time string comparison that stays pure JS so this helper can be
// imported by queries/mutations (no Node-only APIs, so Convex can bundle it).
// It never short-circuits on the first differing character, so response timing
// leaks nothing about how closely an attacker's guess matches the real secret.
const timingSafeCompare = (a: string, b: string): boolean => {
  let diff = a.length ^ b.length;
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
};

export const validateAdminSecret = (secret: string) => {
  const configured = (globalThis.process?.env as Record<string, string | undefined>)?.["CONVEX_ADMIN_SECRET"];
  if (!configured) {
    throw new Error("Server misconfiguration: admin secret not set");
  }
  if (!timingSafeCompare(secret, configured)) {
    throw new Error("Unauthorized: invalid admin secret");
  }
};
