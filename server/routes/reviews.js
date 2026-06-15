const { Router } = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../db");

const router = Router();

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

router.post("/", validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    const { name, email, event, content, rating } = req.body;
    const createdAt = Date.now();

    const result = await pool.query(
      `INSERT INTO reviews (name, email, event, content, rating, approved, created_at)
       VALUES ($1, $2, $3, $4, $5, false, $6)
       RETURNING id, name, email, event, content, rating, approved, created_at`,
      [name, email, event, content, rating, createdAt]
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully. It will be published after approval.",
      review: result.rows[0],
    });
  } catch (error) {
    console.error("POST /api/reviews error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, event, content, rating, approved, created_at
       FROM reviews
       WHERE approved = true
       ORDER BY created_at DESC`
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    console.error("GET /api/reviews error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/pending", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, event, content, rating, approved, created_at
       FROM reviews
       WHERE approved = false
       ORDER BY created_at DESC`
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    console.error("GET /api/reviews/pending error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE reviews SET approved = true WHERE id = $1 RETURNING id, name, email, event, content, rating, approved, created_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true, message: "Review approved", review: result.rows[0] });
  } catch (error) {
    console.error("PUT /api/reviews/:id/approve error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM reviews WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("DELETE /api/reviews/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
