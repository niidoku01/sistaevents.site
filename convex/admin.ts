import { v } from "convex/values";
import { createHash, timingSafeEqual } from "node:crypto";

export const adminSecretArg = {
  secret: v.string(),
};

// Hash both sides then compare in constant time so response timing leaks
// nothing about how closely an attacker's guess matches the real secret.
const timingSafeCompare = (a: string, b: string): boolean => {
  try {
    const ah = createHash("sha256").update(a).digest();
    const bh = createHash("sha256").update(b).digest();
    return timingSafeEqual(ah, bh);
  } catch {
    return a === b;
  }
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
