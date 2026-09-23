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
const r2 = require("./r2");
const sharp = require("sharp");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === "production";
const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

app.disable("x-powered-by");

// Trust the first proxy hop (Vercel / NGINX) so express-rate-limit and req.ip
// see the real client IP instead of the shared edge server. In serverless mode
// the last proxy is Vercel's edge; locally only loopback is trusted.
app.set("trust proxy", isServerlessRuntime ? 1 : "loopback");

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
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
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
  "https://sistaevents.site",
  "https://www.sistaevents.site",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
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

// Verify the actual file content (magic bytes), not just the client-supplied
// MIME type / filename, to reject disguised HTML/polyglot uploads.
const sniffImageType = (buf) => {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return "png";
  const ascii = buf.toString("ascii", 0, 8);
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return "gif";
  if (ascii.startsWith("RIFF") && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
};

const validateImageFiles = (files, allowed) => {
  if (!files) return [];
  const rejected = [];
  for (const file of Array.isArray(files) ? files : [files]) {
    let buf;
    try {
      buf = fs.readFileSync(file.path);
    } catch {
      rejected.push(file);
      continue;
    }
    const sniffed = sniffImageType(buf);
    if (!sniffed || !allowed.includes(sniffed)) {
      rejected.push(file);
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    }
  }
  return rejected;
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 20, fields: 50, fieldNestingDepth: 10, parts: 60 },
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
  limits: { fileSize: 10 * 1024 * 1024, files: 20, fields: 50, fieldNestingDepth: 10, parts: 60 },
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

// Serve only image subdirectories statically. Backups (bookings/, reviews/)
// and metadata live outside the exposed mount to avoid leaking PII.
const staticHeaders = (res, filePath) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
};

// Block internal metadata files from being served, even though they live
// inside a public image directory.
const blockInternalFiles = (req, res, next) => {
  if (req.path.endsWith("collections-meta.json") || req.path.includes("..")) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
};

app.use("/uploads/collections", blockInternalFiles, express.static(collectionDir, {
  index: false,
  redirect: false,
  dotfiles: "deny",
  setHeaders: staticHeaders,
}));

app.use("/uploads/popup-ads", express.static(popupAdsDir, {
  index: false,
  redirect: false,
  dotfiles: "deny",
  setHeaders: staticHeaders,
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
 * POST /api/collections/upload-url
 * Issue a unique R2 object key for a Collection image (admin). The browser
 * uploads the file bytes through the server (`POST /api/collections/upload-file`)
 * and records metadata in Convex via the `collectionImages.saveImage` mutation.
 */
app.post("/api/collections/upload-url", adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const { fileName, contentType, size, category } = req.body || {};

    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    // Must match the category allowlist enforced by convex/collectionImages.ts.
    const allowedCategories = ["weddings", "funerals", "birthdays", "corporate", "social", "decor", "other"];

    if (typeof fileName !== "string" || fileName.length === 0 || fileName.length > 260) {
      return res.status(400).json({ error: "Invalid file name" });
    }
    const ext = path.extname(fileName).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ error: "File extension not allowed" });
    }
    if (!allowedMimes.includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type; only image files are allowed" });
    }
    if (typeof size !== "number" || size <= 0 || size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: "Invalid file size (max 20 MB)" });
    }
    if (typeof category !== "string" || !allowedCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (!r2.isConfigured()) {
      return res.status(500).json({ error: "R2 storage is not configured on the server" });
    }
    if (!r2.hasPublicUrl()) {
      return res.status(500).json({ error: "R2_PUBLIC_URL is not configured on the server" });
    }

    // Predictable structure: collections/{category}/{uniqueId}-{ext}
    const key = `collections/${category}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;

    return res.status(201).json({
      success: true,
      key,
      publicUrl: r2.getPublicUrl(key),
    });
  } catch (error) {
    console.error("Failed to create collection upload URL:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/collections/upload-file?key=<key>
 * Store a Collection image in R2 by proxying the bytes from the browser through
 * this server (admin). The server-to-server PUT avoids requiring CORS PUT
 * access on the bucket (only configurable in the Cloudflare dashboard). The
 * matching Convex row is created afterwards via `collectionImages.saveImage`.
 */
app.post("/api/collections/upload-file", adminLimiter, verifyAdmin, express.raw({ type: () => true, limit: "20mb" }), async (req, res) => {
  try {
    const key = typeof req.query.key === "string" ? req.query.key : "";
    const contentType = (req.get("content-type") || "").toLowerCase();
    const body = req.body;

    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!r2.isValidCollectionKey(key)) {
      return res.status(400).json({ error: "Invalid object key" });
    }
    if (!allowedMimes.includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type; only image files are allowed" });
    }
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ error: "Empty upload body" });
    }
    if (body.length > 20 * 1024 * 1024) {
      return res.status(413).json({ error: "File too large (max 20 MB)" });
    }
    if (!r2.isConfigured()) {
      return res.status(500).json({ error: "R2 storage is not configured on the server" });
    }

    await r2.putObject({ key, body, contentType });

    // Generate responsive WebP variants (best-effort) so the gallery can send
    // the right size to each screen instead of always downloading the original.
    const VARIANT_WIDTHS = [480, 800, 1280];
    const variants = [];
    const keyWithoutExt = key.replace(/\.[^.]+$/, "");
    try {
      const image = sharp(body, { failOn: "none" });
      const metadata = await image.metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      for (const width of VARIANT_WIDTHS) {
        if (originalWidth && width >= originalWidth) continue;
        const variantBody = await sharp(body, { failOn: "none" })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const variantKey = `${keyWithoutExt}-${width}.webp`;
        await r2.putObject({ key: variantKey, body: variantBody, contentType: "image/webp" });
        variants.push({ width, key: variantKey, url: r2.getPublicUrl(variantKey) });
      }
      return res.status(201).json({
        success: true,
        key,
        publicUrl: r2.getPublicUrl(key),
        width: originalWidth,
        height: originalHeight,
        variants,
      });
    } catch (variantError) {
      console.error("Variant generation failed (original kept):", variantError.message);
      return res.status(201).json({
        success: true,
        key,
        publicUrl: r2.getPublicUrl(key),
        width: 0,
        height: 0,
        variants,
      });
    }
  } catch (error) {
    // Log enough context to diagnose without leaking credentials: the S3 SDK
    // surfaces things like `Invalid character in header content ["authorization"]`
    // which points straight at a corrupted R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
    // (e.g. stray CR/LF stripped by r2.js) or a misconfigured R2_PUBLIC_URL.
    console.error(
      "Failed to store collection image:",
      error.message,
      "| key:",
      String(req.query.key || "").slice(0, 120),
      "| contentType:",
      (req.get("content-type") || "").slice(0, 60),
      "| bytes:",
      Buffer.isBuffer(req.body) ? req.body.length : 0
    );
    return res.status(500).json({
      error: "Upload failed on the server. Check the server logs for details.",
    });
  }
});

/**
 * DELETE /api/collections/r2/:key
 * Delete a Collection image object from R2 (admin). Best-effort: the R2 bucket
 * policy may protect the `collections/` prefix (object lock). Failing to remove
 * the object never blocks the Convex metadata row from being deleted — R2 keeps
 * the file as a backup in that case. The matching Convex row is removed by the
 * `collectionImages.deleteImage` mutation. Legacy Convex storage blobs are
 * intentionally left untouched as a backup.
 */
app.delete("/api/collections/r2/:key(.*)", adminLimiter, verifyAdmin, async (req, res) => {
  try {
    const key = req.params.key;
    if (!r2.isValidCollectionKey(key)) {
      return res.status(400).json({ error: "Invalid object key" });
    }
    if (!r2.isConfigured()) {
      return res.status(500).json({ error: "R2 storage is not configured on the server" });
    }
    const results = [];
    // Always attempt to remove responsive variants derived from the source key
    // (`<base>-480.webp`, `<base>-800.webp`, ...) as well as the original.
    const keyWithoutExt = key.replace(/\.[^.]+$/, "");
    const keysToDelete = [key];
    for (const width of [480, 800, 1280]) {
      keysToDelete.push(`${keyWithoutExt}-${width}.webp`);
    }
    for (const deleteKey of keysToDelete) {
      try {
        await r2.deleteObject(deleteKey);
        results.push({ key: deleteKey, deleted: true });
      } catch (deleteErr) {
        results.push({ key: deleteKey, deleted: false });
      }
    }
    const allDeleted = results.every((r) => r.deleted);
    if (allDeleted) {
      return res.json({ success: true, message: "Collection image removed from storage" });
    }
    const deletedCount = results.filter((r) => r.deleted).length;
    return res.json({
      success: true,
      message: `Removed ${deletedCount} of ${results.length} object(s); remainder kept by bucket policy`,
      warning: true,
      kept: results.filter((r) => !r.deleted).map((r) => r.key),
    });
  } catch (error) {
    console.error("Failed to delete collection object:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/uploads/collections
 * Upload collection images (admin)
 */
app.post("/api/uploads/collections", verifyAdmin, upload.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const rejected = validateImageFiles(req.files, ["jpeg", "png", "gif", "webp"]);
    if (rejected.length > 0) {
      return res.status(400).json({ error: `Rejected ${rejected.length} file(s): content is not a valid image` });
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

    const rejected = validateImageFiles(req.file, ["jpeg", "png", "gif", "webp"]);
    if (rejected.length > 0) {
      return res.status(400).json({ error: "Rejected file: content is not a valid image" });
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
