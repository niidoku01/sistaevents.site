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
const crypto = require("crypto");
const { initializeApp, cert, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { initDb } = require("./db");
const reviewRoutes = require("./routes/reviews");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === "production";
const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

app.disable("x-powered-by");

// Initialize Firebase Admin SDK
let firebaseAdminReady = false;
try {
  const serviceAccountJsonB64 = process.env.SERVICE_ACCOUNT_JSON_BASE64;
  const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

  if (serviceAccountJsonB64) {
    try {
      const decoded = Buffer.from(serviceAccountJsonB64, "base64").toString("utf8");
      const obj = JSON.parse(decoded);
      initializeApp({
        credential: cert(obj),
        projectId: process.env.FIREBASE_PROJECT_ID || obj.project_id || "sistaer",
      });
      console.log("Firebase Admin initialized using SERVICE_ACCOUNT_JSON_BASE64");
    } catch (decodeErr) {
      throw new Error(`Failed to decode SERVICE_ACCOUNT_JSON_BASE64: ${decodeErr.message}`);
    }
  } else if (serviceAccountJson) {
    try {
      const obj = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(obj),
        projectId: process.env.FIREBASE_PROJECT_ID || obj.project_id || "sistaer",
      });
      console.log("Firebase Admin initialized using SERVICE_ACCOUNT_JSON");
    } catch (parseErr) {
      throw new Error(`Failed to parse SERVICE_ACCOUNT_JSON: ${parseErr.message}`);
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;
    initializeApp({
      credential: cert(require(serviceAccountPath)),
      projectId: process.env.FIREBASE_PROJECT_ID || "sistaer",
    });
    console.log("Firebase Admin initialized using serviceAccountKey.json");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || "sistaer",
    });
    console.log("Firebase Admin initialized using application default credentials");
  } else {
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "sistaer" });
    console.log("Firebase Admin initialized without explicit credentials (may be limited)");
  }
  firebaseAdminReady = true;
  const db = getFirestore();
} catch (err) {
  console.error("Firebase Admin initialization failed:", err.message);
  firebaseAdminReady = false;
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
  hsts: isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// Additional security headers not covered by Helmet
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// Rate limiting - Prevent brute force and DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for booking endpoint
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many booking attempts, please try again later.",
});

// Strict rate limit for admin endpoints (convex-token, etc.)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: "Too many admin requests, please try again later.",
});

// Apply rate limiting
app.use("/api/", limiter);

// CORS - Configure allowed origins (update with your production domain)
const defaultAllowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const frontendUrl = (process.env.FRONTEND_URL || "").trim();

const allowedOrigins = [...defaultAllowedOrigins, ...configuredOrigins, frontendUrl].filter(Boolean);

const isAllowedOrigin = (origin) => allowedOrigins.includes(origin);

const getBaseUrl = (req) => {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
};

const VALID_CATEGORIES = ["weddings", "birthdays", "corporate", "social", "decor", "other"];

app.use(cors({
  origin: function (origin, callback) {
    // Reject requests with no origin when credentials are enabled
    if (!origin) return callback(null, false);
    if (!isAllowedOrigin(origin)) {
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

// Enforce origin on state-changing requests to reduce CSRF risk without cookie-based sessions.
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();

  const origin = req.headers.origin;
  if (!origin) {
    return res.status(403).json({ error: "Forbidden — missing origin" });
  }

  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  return next();
});

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

// HTTPS redirect for production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Firebase Auth middleware — verifies Firebase ID tokens for admin routes
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized — missing or invalid token" });
  }

  const token = authHeader.split("Bearer ")[1];

  if (!firebaseAdminReady) {
    return res.status(503).json({ error: "Authentication service unavailable" });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);

    const adminEmails = (process.env.FIREBASE_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length > 0 && (!decoded.email || !adminEmails.includes(decoded.email.toLowerCase()))) {
      return res.status(403).json({ error: "Forbidden — not an admin user" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized — invalid token" });
  }
};

// Create uploads directory if it doesn't exist
const uploadsRoot = isServerlessRuntime ? path.join("/tmp", "uploads") : path.join(__dirname, "uploads");
const uploadsDir = uploadsRoot;
const collectionDir = path.join(uploadsDir, "collections");
const popupAdsDir = path.join(uploadsDir, "popup-ads");
const bookingsDir = path.join(uploadsDir, "bookings");
const reviewsDir = path.join(uploadsDir, "reviews");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(collectionDir)) fs.mkdirSync(collectionDir);
if (!fs.existsSync(popupAdsDir)) fs.mkdirSync(popupAdsDir);
if (!fs.existsSync(bookingsDir)) fs.mkdirSync(bookingsDir);
if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, collectionDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + crypto.randomUUID().slice(0, 8);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

const isAllowedExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return VALID_EXTENSIONS.includes(ext);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    if (!isAllowedExtension(file.originalname)) {
      return cb(new Error("File extension not allowed"));
    }
    cb(null, true);
  },
});

const popupAdStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, popupAdsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + crypto.randomUUID().slice(0, 8);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const popupAdUpload = multer({
  storage: popupAdStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    if (!isAllowedExtension(file.originalname)) {
      return cb(new Error("File extension not allowed"));
    }
    cb(null, true);
  },
});

// Serve static files (uploaded images) with directory browsing disabled
app.use("/uploads", express.static(uploadsDir, {
  index: false,
  redirect: false,
  setHeaders: (res, path) => {
    // Remove X-Powered-By and other inspect info
    res.removeHeader("X-Powered-By");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  }
}));

// Sanitize user-provided text for SMS to prevent injection
const sanitizeForSms = (text) => {
  return text
    .replace(/[\0\n\r\t\v\f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
};

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
      const db = getFirestore();
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
      const preview = sanitizeForSms(booking.message || "-");
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
      const customerMsg = `Thanks ${booking.name}, we received your booking for ${booking.eventDate}. We'll get back to you soon. - Sista Events And Rentals`;
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
    res.status(500).json({ error: "Internal server error" });
  }
});

const metaPath = path.join(collectionDir, "collections-meta.json");

const readMeta = () => {
  try {
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, "utf8"));
    }
  } catch (e) {
    console.error("Failed to read collections meta:", e.message);
  }
  return {};
};

const writeMeta = (meta) => {
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
};

/**
 * POST /api/uploads/collections
 * Upload collection images (admin)
 */
app.post("/api/uploads/collections", verifyAdmin, upload.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const baseUrl = getBaseUrl(req);
    const category = req.body.category || "weddings";
    const meta = readMeta();

    const imageEntries = req.files.map((file) => {
      const entry = {
        filename: file.filename,
        originalName: file.originalname,
        url: `${baseUrl}/uploads/collections/${file.filename}`,
        category,
        uploadedAt: new Date().toISOString(),
      };
      meta[file.filename] = entry;
      return entry;
    });

    writeMeta(meta);

    res.status(201).json({
      success: true,
      message: "Images uploaded successfully",
      images: imageEntries,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/uploads/popup-ads
 * Upload popup ad image (admin)
 */
app.post("/api/uploads/popup-ads", verifyAdmin, popupAdUpload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const baseUrl = getBaseUrl(req);
    return res.status(201).json({
      success: true,
      message: "Popup ad image uploaded successfully",
      image: {
        url: `${baseUrl}/uploads/popup-ads/${req.file.filename}`,
        name: req.file.originalname,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/collections
 * Get all collection images with metadata
 */
app.get("/api/collections", (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const meta = readMeta();
    const files = fs.readdirSync(collectionDir);
    const images = files
      .filter(file => !file.startsWith('.'))
      .filter(file => file !== "collections-meta.json")
      .map((file) => {
        const filePath = path.join(collectionDir, file);
        const stats = fs.statSync(filePath);
        const entry = meta[file] || {};
        return {
          id: file,
          filename: file,
          originalName: entry.originalName || file,
          url: `${baseUrl}/uploads/collections/${file}`,
          category: entry.category || "uncategorized",
          uploadedAt: entry.uploadedAt || stats.birthtime.toISOString(),
        };
      });

    res.json(images);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/collections/:filename
 * Update collection image metadata (admin only)
 */
app.put("/api/collections/:filename", verifyAdmin, (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    if (safeFilename !== req.params.filename) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(collectionDir, safeFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const meta = readMeta();
    if (!meta[safeFilename]) {
      meta[safeFilename] = { filename: safeFilename };
    }

    if (req.body.category) {
      if (!VALID_CATEGORIES.includes(req.body.category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      meta[safeFilename].category = req.body.category;
    }
    if (req.body.originalName) {
      meta[safeFilename].originalName = req.body.originalName;
    }

    writeMeta(meta);

    res.json({ success: true, message: "Image metadata updated", image: meta[safeFilename] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/bookings
 * Get all bookings (admin only)
 */
app.get("/api/bookings", adminLimiter, verifyAdmin, async (req, res) => {
  try {
    // Try Firestore first
    try {
      const db = getFirestore();
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
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/bookings/:id/resend
 * Resend SMS notifications for a booking (admin only)
 */
app.post("/api/bookings/:id/resend", adminLimiter, verifyAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    const bookingsFile = path.join(bookingsDir, "bookings.json");
    if (!fs.existsSync(bookingsFile)) return res.status(404).json({ error: "No bookings found" });

    const data = fs.readFileSync(bookingsFile, "utf-8");
    const bookings = JSON.parse(data);
    const booking = bookings.find((b) => Number(b.id) === id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Build admin SMS body same as initial send
    if (twilioClient && TWILIO_FROM && BOOKINGS_SMS_TO) {
      const recipients = BOOKINGS_SMS_TO.split(",").map((s) => s.trim()).filter(Boolean);
      const preview = sanitizeForSms(booking.message || "-");
      const truncated = preview;
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
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/bookings/:id
 * Delete a booking by id (admin only)
 */
app.delete("/api/bookings/:id", verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    // Try to delete from Firestore first
    try {
      const db = getFirestore();
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
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/collections/:filename
 * Delete a collection image (admin only)
 */
app.delete("/api/collections/:filename", verifyAdmin, (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    if (safeFilename !== req.params.filename) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(collectionDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    fs.unlinkSync(filePath);

    // Clean up metadata
    const meta = readMeta();
    delete meta[safeFilename];
    writeMeta(meta);

    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

// Convex admin token endpoint — provides admin secret to authenticated admin clients
app.get("/api/admin/convex-token", adminLimiter, verifyAdmin, (req, res) => {
  const token = process.env.CONVEX_ADMIN_SECRET;
  if (!token) {
    return res.status(500).json({ error: "Admin token not configured on server" });
  }
  res.json({ token });
});

// Review routes (PostgreSQL)
app.use("/api/reviews", reviewRoutes);

// Legacy review routes (Firestore + JSON) - kept for migration fallback
// They are mounted after the PostgreSQL routes
// and will 404 if PostgreSQL routes catch the request first, so they remain
// only as a manual fallback path.
// The old inline review code has been replaced by the router above.

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);

  if (err.name === "MulterError") {
    return res.status(400).json({ error: "Upload failed", details: err.message });
  }

  if (err.message && err.message.includes("CORS policy")) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  return res.status(500).json({ error: "Internal server error" });
});

// Start server only for local/node runtime.
const startServer = () => {
  // Initialize SQLite database
  try {
    initDb();
  } catch (err) {
    console.warn("Database init failed:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

if (!isServerlessRuntime) {
  startServer();
}

module.exports = app;
