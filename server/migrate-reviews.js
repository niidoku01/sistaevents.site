// Run: node migrate-reviews.js
// Migrates approved reviews from Convex to PostgreSQL

require("dotenv").config();
const { ConvexHttpClient } = require("convex/browser");
const { pool, initDb } = require("./db");

const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://judicious-rhinoceros-41.convex.cloud";

async function migrate() {
  console.log("Connecting to Convex...");
  const client = new ConvexHttpClient(CONVEX_URL);

  let reviews;
  try {
    reviews = await client.query("reviews:getApprovedReviews");
    console.log(`Fetched ${reviews.length} approved reviews from Convex`);
  } catch (err) {
    console.error("Failed to fetch from Convex:", err.message);
    console.log("Trying direct API query...");
    try {
      const resp = await fetch(`${CONVEX_URL}/api/query/reviews:getApprovedReviews`);
      const json = await resp.json();
      reviews = json.value ?? [];
      console.log(`Fetched ${reviews.length} reviews via HTTP`);
    } catch (err2) {
      console.error("Also failed:", err2.message);
      process.exit(1);
    }
  }

  if (!reviews || reviews.length === 0) {
    console.log("No reviews to migrate.");
    await pool.end();
    return;
  }

  console.log("Initializing PostgreSQL schema...");
  await initDb();

  let migrated = 0;
  let skipped = 0;

  for (const r of reviews) {
    const exists = await pool.query(
      "SELECT id FROM reviews WHERE convex_id = $1",
      [r._id]
    );
    if (exists.rows.length > 0) {
      skipped++;
      continue;
    }

    await pool.query(
      `INSERT INTO reviews (name, email, event, content, rating, approved, created_at, convex_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [r.name, r.email, r.event, r.content, r.rating, r.approved ?? true, r.createdAt ?? r._creationTime, r._id]
    );
    migrated++;
  }

  console.log(`Migration complete: ${migrated} inserted, ${skipped} skipped`);
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
