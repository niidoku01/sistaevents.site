const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.SQLITE_DB_PATH || path.join(dbDir, "sista.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      event TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      approved INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      convex_id TEXT,
      created_at_local TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews (approved);
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
  `);

  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_convex_id ON reviews (convex_id)`);
  } catch {
    // convex_id may be null for all rows, unique index with nulls is fine in SQLite
  }

  console.log("SQLite database initialized");
};

module.exports = { db, initDb };