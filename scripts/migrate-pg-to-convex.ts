import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { Doc } from "../convex/_generated/dataModel.js";
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

  await initDb();

  const result = await pool.query(
    `SELECT id, name, email, event, content, rating, approved, created_at
     FROM reviews
     ORDER BY created_at ASC`
  );

  const rows = result.rows;
  console.log(`Found ${rows.length} reviews in PostgreSQL`);

  if (rows.length === 0) {
    console.log("No reviews to migrate.");
    await pool.end();
    return;
  }

  const [existingApproved, existingPending] = await Promise.all([
    client.query(api.reviews.getApprovedReviews),
    client.query(api.reviews.getPendingReviews),
  ]);

  const existingKeys = new Set([
    ...existingApproved.map((r: Doc<"reviews">) => `${r.email}:${r.createdAt}`),
    ...existingPending.map((r: Doc<"reviews">) => `${r.email}:${r.createdAt}`),
  ]);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const key = `${row.email}:${row.created_at}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    try {
      await client.mutation(api.reviews.migrateImport, {
        name: row.name,
        email: row.email,
        event: row.event,
        content: row.content,
        rating: row.rating,
        approved: row.approved,
        createdAt: Number(row.created_at),
      });
      migrated++;
    } catch (err: unknown) {
      console.error(`Failed to migrate review ${row.id}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Migration complete: ${migrated} inserted, ${skipped} skipped`);
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
