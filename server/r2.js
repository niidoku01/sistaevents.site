// Cloudflare R2 helper for Collection image files.
// R2 credentials stay server-side only — they are never exposed to the client.
// The client talks to R2 through short-lived presigned URLs issued from here.
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

const r2Configured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME
);

let s3Client = null;
if (r2Configured) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// Collection objects live under a single prefix so keys are easy to validate
// and cross-account listing stays cheap.
const COLLECTION_KEY_PREFIX = "collections/";

const isConfigured = () => r2Configured;
const hasPublicUrl = () => Boolean(R2_PUBLIC_URL);

const getPublicUrl = (key) => {
  if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL is not configured on the server");
  }
  return `${R2_PUBLIC_URL}/${key}`;
};

// Short-lived URL the browser can PUT a file to directly. Includes the content
// type in the signature so we know what we stored.
const createPresignedUploadUrl = async ({ key, contentType, expiresIn = 300 }) => {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

const deleteObject = async (key) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
};

// Server-to-server PUT. Used when the browser can't reach R2 directly (no CORS
// on the bucket, which can only be configured in the Cloudflare dashboard).
const putObject = async ({ key, body, contentType }) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
};

// Only accept collection keys; reject anything that could escape the prefix or
// smuggle path traversal.
const isValidCollectionKey = (key) => {
  if (typeof key !== "string" || key.length === 0 || key.length > 300) return false;
  if (!key.startsWith(COLLECTION_KEY_PREFIX)) return false;
  if (key.includes("..") || key.includes("\0") || key.includes("\\")) return false;
  return /^[A-Za-z0-9._:/+\-]+$/.test(key);
};

module.exports = {
  isConfigured,
  hasPublicUrl,
  getPublicUrl,
  createPresignedUploadUrl,
  putObject,
  deleteObject,
  isValidCollectionKey,
};