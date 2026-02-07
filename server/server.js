// Load environment variables from .env when present
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

const app = express();
const PORT = 5000;

// Initialize Firebase Admin SDK
try {
  // For development, use application default credentials or service account
  // In production, set GOOGLE_APPLICATION_CREDENTIALS environment variable
  admin.initializeApp({
    projectId: "sistaer",
    // If you have a service account key, uncomment and use:
    // credential: admin.credential.cert(require('./serviceAccountKey.json'))
  });
  const db = admin.firestore();
  console.log("Firebase Admin initialized");
} catch (err) {
  console.warn("Firebase Admin initialization failed:", err.message);
  console.log("Will fall back to JSON file storage");
}

// Twilio setup (optional) - configure via environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || null;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || null;
const TWILIO_FROM = process.env.TWILIO_FROM || null; // e.g. +1234567890
const BOOKINGS_SMS_TO = process.env.BOOKINGS_SMS_TO || null; // destination number(s), comma separated
const SEND_CONFIRMATION_TO_CUSTOMER = (process.env.SEND_CONFIRMATION_TO_CUSTOMER || "false").toLowerCase() === "true";
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    const Twilio = require("twilio");
    twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log("Twilio client initialized");
  } catch (err) {
    console.warn("Twilio not available:", err.message);
  }
}

// Security Middleware
// Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting - Prevent brute force and DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for booking endpoint
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 booking attempts per 15 minutes
  message: "Too many booking attempts, please try again later.",
});

// Apply rate limiting
app.use("/api/", limiter);

// CORS - Configure allowed origins (update with your production domain)
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL || "http://localhost:8080",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing with size limits
app.use(express.json({ limit: "10mb" })); // Reduced from 50mb for security
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Prevent parameter pollution
app.use((req, res, next) => {
  // Remove duplicate parameters
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  }
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
const collectionDir = path.join(uploadsDir, "collections");
const bookingsDir = path.join(uploadsDir, "bookings");
const reviewsDir = path.join(uploadsDir, "reviews");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(collectionDir)) fs.mkdirSync(collectionDir);
if (!fs.existsSync(bookingsDir)) fs.mkdirSync(bookingsDir);
if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, collectionDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Serve static files (uploaded images)
app.use("/uploads", express.static(uploadsDir));

// Routes

/**
 * POST /api/bookings
 * Receive booking form data with validation
 */
app.post(
  "/api/bookings",
  bookingLimiter,
  [
    // Validation middleware
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2-100 characters")
      .matches(/^[a-zA-Z\s'-]+$/).withMessage("Name contains invalid characters"),
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format")
      .normalizeEmail(),
    body("phone")
      .trim()
      .notEmpty().withMessage("Phone is required")
      .matches(/^[\d\s()+-]+$/).withMessage("Invalid phone format")
      .isLength({ min: 10, max: 20 }).withMessage("Phone must be between 10-20 characters"),
    body("eventDate")
      .notEmpty().withMessage("Event date is required")
      .isISO8601().withMessage("Invalid date format"),
    body("message")
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage("Message too long (max 1000 characters)"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: errors.array() 
        });
      }

      const { name, email, phone, eventDate, message } = req.body;

    // Create booking object
    const booking = {
      id: Date.now(),
      name,
      email,
      phone,
      eventDate,
      message,
      createdAt: new Date().toISOString(),
    };

    // Save booking to Firestore (primary) and JSON file (backup)
    try {
      const db = admin.firestore();
      await db.collection("bookings").doc(booking.id.toString()).set(booking);
      console.log("Booking saved to Firestore");
    } catch (firestoreErr) {
      console.error("Failed to save to Firestore:", firestoreErr.message);
    }

    // Also save to JSON file as backup
    const bookingsFile = path.join(bookingsDir, "bookings.json");
    let bookings = [];

    if (fs.existsSync(bookingsFile)) {
      const data = fs.readFileSync(bookingsFile, "utf-8");
      bookings = JSON.parse(data);
    }

    bookings.push(booking);
    fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));

    // Send SMS notification if Twilio configured and destination provided
    if (twilioClient && TWILIO_FROM && BOOKINGS_SMS_TO) {
      // Allow comma-separated recipients in BOOKINGS_SMS_TO
      const recipients = BOOKINGS_SMS_TO.split(",").map((s) => s.trim()).filter(Boolean);

      // Build an organized message, truncate message body to keep SMS concise
      const preview = booking.message ? booking.message.replace(/\s+/g, " ").trim() : "-";
      const truncated = preview.length > 120 ? preview.slice(0, 117) + "..." : preview;

      const smsLines = [
        `New Booking #${booking.id}`,
        `Name: ${booking.name}`,
        `Phone: ${booking.phone}`,
        `Date: ${booking.eventDate}`,
        `Email: ${booking.email}`,
        `Message: ${truncated}`,
      ];

      const smsBody = smsLines.join("\n");

      recipients.forEach((to) => {
        twilioClient.messages
          .create({ body: smsBody, from: TWILIO_FROM, to })
          .then((msg) => console.log(`SMS sent to ${to}, SID: ${msg.sid}`))
          .catch((err) => console.error(`Failed to send SMS to ${to}:`, err.message));
      });
    } else {
      if (!twilioClient) console.log("Twilio client not configured; skipping admin SMS");
      else if (!TWILIO_FROM || !BOOKINGS_SMS_TO) console.log("TWILIO_FROM or BOOKINGS_SMS_TO not set; skipping admin SMS");
    }

    // Optionally send a confirmation SMS to the customer if enabled and phone provided
    if (SEND_CONFIRMATION_TO_CUSTOMER && twilioClient && TWILIO_FROM && booking.phone) {
      const customerMsg = `Thanks ${booking.name}, we received your booking for ${booking.eventDate}. We'll be in touch. - Sista Events`;
      twilioClient.messages
        .create({ body: customerMsg, from: TWILIO_FROM, to: booking.phone })
        .then((msg) => console.log(`Confirmation SMS sent to customer ${booking.phone}, SID: ${msg.sid}`))
        .catch((err) => console.error(`Failed to send confirmation SMS to ${booking.phone}:`, err.message));
    } else {
      if (SEND_CONFIRMATION_TO_CUSTOMER && !twilioClient) console.log("Twilio not configured; skipping confirmation SMS to customer");
      if (SEND_CONFIRMATION_TO_CUSTOMER && (!TWILIO_FROM || !booking.phone)) console.log("TWILIO_FROM or booking.phone not set; skipping confirmation SMS to customer");
    }
    res.status(201).json({
      success: true,
      message: "Booking received successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/uploads/collections
 * Upload collection images
 */
app.post("/api/uploads/collections", upload.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    // Return URLs for uploaded images
    const imageUrls = req.files.map((file) => ({
      url: `/uploads/collections/${file.filename}`,
      name: file.originalname,
    }));

    res.status(201).json({
      success: true,
      message: "Images uploaded successfully",
      images: imageUrls,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/collections
 * Get all collection images
 */
app.get("/api/collections", (req, res) => {
  try {
    const files = fs.readdirSync(collectionDir);
    const images = files
      .filter(file => !file.startsWith('.')) // Exclude hidden files
      .map((file) => {
        const filePath = path.join(collectionDir, file);
        const stats = fs.statSync(filePath);
        return {
          id: file,
          filename: file,
          url: `/uploads/collections/${file}`,
          uploadedAt: stats.birthtime.toISOString(),
        };
      });

    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings
 * Get all bookings (for admin panel)
 */
app.get("/api/bookings", async (req, res) => {
  try {
    // Try Firestore first
    try {
      const db = admin.firestore();
      const snapshot = await db.collection("bookings").orderBy("createdAt", "desc").get();
      const bookings = [];
      snapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ success: true, bookings });
    } catch (firestoreErr) {
      console.error("Failed to fetch from Firestore:", firestoreErr.message);
    }

    // Fallback to JSON file
    const bookingsFile = path.join(bookingsDir, "bookings.json");

    if (!fs.existsSync(bookingsFile)) {
      return res.json({ success: true, bookings: [] });
    }

    const data = fs.readFileSync(bookingsFile, "utf-8");
    const bookings = JSON.parse(data);

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bookings/:id/resend
 * Resend SMS notifications for a booking (admin action)
 */
app.post("/api/bookings/:id/resend", (req, res) => {
  try {
    const bookingsFile = path.join(bookingsDir, "bookings.json");
    if (!fs.existsSync(bookingsFile)) return res.status(404).json({ error: "No bookings found" });

    const data = fs.readFileSync(bookingsFile, "utf-8");
    const bookings = JSON.parse(data);
    const id = Number(req.params.id);
    const booking = bookings.find((b) => Number(b.id) === id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Build admin SMS body same as initial send
    if (twilioClient && TWILIO_FROM && BOOKINGS_SMS_TO) {
      const recipients = BOOKINGS_SMS_TO.split(",").map((s) => s.trim()).filter(Boolean);
      const preview = booking.message ? booking.message.replace(/\s+/g, " ").trim() : "-";
      const truncated = preview.length > 120 ? preview.slice(0, 117) + "..." : preview;
      const smsLines = [
        `Resent Booking #${booking.id}`,
        `Name: ${booking.name}`,
        `Phone: ${booking.phone}`,
        `Date: ${booking.eventDate}`,
        `Email: ${booking.email}`,
        `Message: ${truncated}`,
      ];
      const smsBody = smsLines.join("\n");

      recipients.forEach((to) => {
        twilioClient.messages
          .create({ body: smsBody, from: TWILIO_FROM, to })
          .then((msg) => console.log(`Resent SMS to ${to}, SID: ${msg.sid}`))
          .catch((err) => console.error(`Failed to resend SMS to ${to}:`, err.message));
      });

      // Optionally resend confirmation to customer
      if (SEND_CONFIRMATION_TO_CUSTOMER && booking.phone) {
        const customerMsg = `Thanks ${booking.name}, your booking for ${booking.eventDate} has been received (resend). - Sista Events`;
        twilioClient.messages
          .create({ body: customerMsg, from: TWILIO_FROM, to: booking.phone })
          .then((msg) => console.log(`Confirmation resent to ${booking.phone}, SID: ${msg.sid}`))
          .catch((err) => console.error(`Failed to resend confirmation to ${booking.phone}:`, err.message));
      }

      return res.json({ success: true, message: "Resent SMS notifications" });
    }

    res.status(400).json({ error: "Twilio not configured or recipients missing" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/bookings/:id
 * Delete a booking by id
 */
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Try to delete from Firestore first
    try {
      const db = admin.firestore();
      await db.collection("bookings").doc(id).delete();
      console.log("Booking deleted from Firestore");
    } catch (firestoreErr) {
      console.error("Failed to delete from Firestore:", firestoreErr.message);
    }

    // Also delete from JSON file
    const bookingsFile = path.join(bookingsDir, "bookings.json");
    if (fs.existsSync(bookingsFile)) {
      const data = fs.readFileSync(bookingsFile, "utf-8");
      let bookings = JSON.parse(data);
      const numericId = Number(id);
      bookings = bookings.filter((b) => Number(b.id) !== numericId);
      fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));
    }

    res.json({ success: true, message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/collections/:filename
 * Delete a collection image
 */
app.delete("/api/collections/:filename", (req, res) => {
  try {
    const filePath = path.join(collectionDir, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

/**
 * POST /api/reviews
 * Submit a new review
 */
app.post(
  "/api/reviews",
  bookingLimiter,
  [
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
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: errors.array() 
        });
      }

      const { name, email, event, content, rating } = req.body;

      const review = {
        id: Date.now(),
        name,
        email,
        event,
        content,
        rating,
        approved: false,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      try {
        const db = admin.firestore();
        await db.collection("reviews").doc(review.id.toString()).set(review);
        console.log("Review saved to Firestore");
      } catch (firestoreErr) {
        console.error("Failed to save to Firestore:", firestoreErr.message);
      }

      // Save to JSON file as backup
      const reviewsFile = path.join(reviewsDir, "reviews.json");
      let reviews = [];

      if (fs.existsSync(reviewsFile)) {
        const data = fs.readFileSync(reviewsFile, "utf-8");
        reviews = JSON.parse(data);
      }

      reviews.push(review);
      fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));

      res.status(201).json({
        success: true,
        message: "Review submitted successfully. It will be published after approval.",
        review,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/reviews
 * Get all approved reviews
 */
app.get("/api/reviews", async (req, res) => {
  try {
    let reviews = [];

    // Try to get from Firestore first
    try {
      const db = admin.firestore();
      const snapshot = await db.collection("reviews").where("approved", "==", true).get();
      reviews = snapshot.docs.map((doc) => doc.data());
      console.log("Reviews fetched from Firestore");
    } catch (firestoreErr) {
      console.error("Failed to fetch from Firestore:", firestoreErr.message);
      
      // Fallback to JSON file
      const reviewsFile = path.join(reviewsDir, "reviews.json");
      if (fs.existsSync(reviewsFile)) {
        const data = fs.readFileSync(reviewsFile, "utf-8");
        const allReviews = JSON.parse(data);
        reviews = allReviews.filter((r) => r.approved === true);
      }
    }

    // Sort by creation date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reviews/pending
 * Get all pending reviews (admin only)
 */
app.get("/api/reviews/pending", async (req, res) => {
  try {
    let reviews = [];

    // Try to get from Firestore first
    try {
      const db = admin.firestore();
      const snapshot = await db.collection("reviews").where("approved", "==", false).get();
      reviews = snapshot.docs.map((doc) => doc.data());
    } catch (firestoreErr) {
      console.error("Failed to fetch from Firestore:", firestoreErr.message);
      
      // Fallback to JSON file
      const reviewsFile = path.join(reviewsDir, "reviews.json");
      if (fs.existsSync(reviewsFile)) {
        const data = fs.readFileSync(reviewsFile, "utf-8");
        const allReviews = JSON.parse(data);
        reviews = allReviews.filter((r) => r.approved === false);
      }
    }

    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/reviews/:id/approve
 * Approve a review (admin only)
 */
app.put("/api/reviews/:id/approve", async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Update in Firestore
    try {
      const db = admin.firestore();
      await db.collection("reviews").doc(reviewId).update({ approved: true });
      console.log("Review approved in Firestore");
    } catch (firestoreErr) {
      console.error("Failed to update in Firestore:", firestoreErr.message);
    }

    // Update in JSON file
    const reviewsFile = path.join(reviewsDir, "reviews.json");
    if (fs.existsSync(reviewsFile)) {
      const data = fs.readFileSync(reviewsFile, "utf-8");
      const reviews = JSON.parse(data);
      const review = reviews.find((r) => r.id.toString() === reviewId);
      
      if (review) {
        review.approved = true;
        fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
      }
    }

    res.json({ success: true, message: "Review approved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (admin only)
 */
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Delete from Firestore
    try {
      const db = admin.firestore();
      await db.collection("reviews").doc(reviewId).delete();
      console.log("Review deleted from Firestore");
    } catch (firestoreErr) {
      console.error("Failed to delete from Firestore:", firestoreErr.message);
    }

    // Delete from JSON file
    const reviewsFile = path.join(reviewsDir, "reviews.json");
    if (fs.existsSync(reviewsFile)) {
      const data = fs.readFileSync(reviewsFile, "utf-8");
      let reviews = JSON.parse(data);
      reviews = reviews.filter((r) => r.id.toString() !== reviewId);
      fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
    }

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
