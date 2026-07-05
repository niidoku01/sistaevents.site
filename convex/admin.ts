import { v } from "convex/values";

export const adminSecretArg = {
  secret: v.string(),
};

export const validateAdminSecret = (secret: string) => {
  const configured = (globalThis.process?.env as Record<string, string | undefined>)?.["CONVEX_ADMIN_SECRET"];
  if (configured && secret !== configured) {
    throw new Error("Unauthorized: invalid admin secret");
  }
};
