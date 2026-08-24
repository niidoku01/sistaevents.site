const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { getAuth } = require("firebase-admin/auth");
const { db } = require("../db");

const router = Router();

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await getAuth().verifyIdToken(authHeader.split("Bearer ")[1]);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many review submissions, please try again later.",
});

const validateReview = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2-100 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("event")
    .trim()
    .notEmpty().withMessage("Event type is required")
    .isLength({ max: 100 }).withMessage("Event type too long"),
  body("content")
    .trim()
    .notEmpty().withMessage("Review content is required")
    .isLength({ min: 10, max: 1000 }).withMessage("Review must be between 10-1000 characters"),
  body("rating")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1-5"),
];

router.post("/", reviewLimiter, validateReview, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    const { name, email, event, content, rating } = req.body;
    const createdAt = Date.now();

    const stmt = db.prepare(
      `INSERT INTO reviews (name, email, event, content, rating, approved, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`
    );
    const result = stmt.run(name, email, event, content, rating, createdAt);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully. It will be published after approval.",
      review: { id: result.lastInsertRowid, name, email, event, content, rating, approved: false, created_at: createdAt },
    });
  } catch (error) {
    console.error("POST /api/reviews error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT id, name, email, event, content, rating, approved, created_at
       FROM reviews
       WHERE approved = 1
       ORDER BY created_at DESC`
    ).all();

    res.json({ reviews: rows });
  } catch (error) {
    console.error("GET /api/reviews error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pending", (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT id, name, email, event, content, rating, approved, created_at
       FROM reviews
       WHERE approved = 0
       ORDER BY created_at DESC`
    ).all();

    res.json({ reviews: rows });
  } catch (error) {
    console.error("GET /api/reviews/pending error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/approve", verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare(
      `UPDATE reviews SET approved = 1 WHERE id = ?`
    ).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    const review = db.prepare(
      `SELECT id, name, email, event, content, rating, approved, created_at FROM reviews WHERE id = ?`
    ).get(id);

    res.json({ success: true, message: "Review approved", review });
  } catch (error) {
    console.error("PUT /api/reviews/:id/approve error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare(`DELETE FROM reviews WHERE id = ?`).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("DELETE /api/reviews/:id error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;