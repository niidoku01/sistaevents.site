import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const readEnvValue = (key: string): string | undefined => {
  if (process.env[key]) return process.env[key];

  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return undefined;

  const envText = fs.readFileSync(envPath, "utf8");
  const line = envText
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) return undefined;

  return line.replace(`${key}=`, "").trim().replace(/^"|"$/g, "");
};

async function main() {
  const convexUrl = readEnvValue("VITE_CONVEX_URL");
  if (!convexUrl) {
    console.error("VITE_CONVEX_URL not found in .env");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  try {
    const reviews = await client.query(api.reviews.getApprovedReviews);
    console.log(JSON.stringify(reviews ?? [], null, 2));
  } catch (err: any) {
    console.error("Failed to query Convex:", err?.message ?? err);
    process.exit(2);
  }
}

main();
