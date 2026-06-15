import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const require = createRequire(import.meta.url);
const { pool, initDb } = require("../server/db.js");

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

  let convexReviews: any[];
  try {
    const [approved, pending] = await Promise.all([
      client.query(api.reviews.getApprovedReviews),
      client.query(api.reviews.getPendingReviews),
    ]);
    convexReviews = [...(approved ?? []), ...(pending ?? [])];
    console.log(
      `Found ${convexReviews.length} reviews in Convex (${approved?.length ?? 0} approved, ${pending?.length ?? 0} pending)`
    );
  } catch (err: any) {
    console.error("Failed to query Convex:", err?.message ?? err);
    process.exit(2);
  }

  if (convexReviews.length === 0) {
    console.log("No reviews to migrate.");
    await pool.end();
    return;
  }

  await initDb();

  let migrated = 0;
  for (const review of convexReviews) {
    try {
      await pool.query(
        `INSERT INTO reviews (name, email, event, content, rating, approved, created_at, convex_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (convex_id) DO NOTHING`,
        [
          review.name ?? "",
          review.email ?? "",
          review.event ?? "",
          review.content ?? "",
          review.rating ?? 5,
          review.approved ?? false,
          review.createdAt ?? Date.now(),
          review._id ?? null,
        ]
      );
      migrated++;
    } catch (err: any) {
      console.error(`Failed to migrate review ${review._id}:`, err.message);
    }
  }

  console.log(`Migrated ${migrated} / ${convexReviews.length} reviews to PostgreSQL.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
