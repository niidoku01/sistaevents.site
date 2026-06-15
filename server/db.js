const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || "sista_events",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "",
      max: 10,
      idleTimeoutMillis: 30000,
    });

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        event VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        approved BOOLEAN NOT NULL DEFAULT false,
        created_at BIGINT NOT NULL,
        convex_id VARCHAR(255),
        created_at_local TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews (approved);
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_convex_id ON reviews (convex_id);
    `);
    console.log("PostgreSQL schema initialized");
  } finally {
    client.release();
  }
};

module.exports = { pool, initDb };
