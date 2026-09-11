import { useEffect, useState } from "react";
import { getConvexAdminSecret } from "@/lib/api";

export type AdminSecretState =
  | { status: "loading"; secret: null }
  | { status: "ready"; secret: string }
  | { status: "error"; secret: null };

export const useConvexAdminSecret = (): AdminSecretState => {
  const [state, setState] = useState<AdminSecretState>({ status: "loading", secret: null });

  useEffect(() => {
    let cancelled = false;
    getConvexAdminSecret()
      .then((secret) => {
        if (!cancelled) setState({ status: "ready", secret });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to obtain Convex admin secret", error);
          setState({ status: "error", secret: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};