// Backfills responsive WebP variants for already-uploaded collection images.
//
// Reads Convex + R2 credentials from server/.env (via dotenv) and keys off the
// production Convex deployment (from .env.production). Never prints secrets —
// output is limited to counts and stats.
import { readFileSync } from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname || __dirname, "..");

function loadEnvFile(file: string): Record<string, string> {
  const vars: Record<string, string> = {};
  try {
    const content = readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
    }
  } catch {
    // ignore missing file
  }
  return vars;
}

const serverEnv = loadEnvFile(path.join(root, "server", ".env"));

const R2_ACCOUNT_ID = serverEnv.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = serverEnv.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = serverEnv.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = serverEnv.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = (serverEnv.R2_PUBLIC_URL || "").replace(/\/+$/, "");
const CONVEX_ADMIN_SECRET = serverEnv.CONVEX_ADMIN_SECRET || "";

const productionEnvFile = readFileSync(path.join(root, ".env.production"), "utf8");
const prodUrlMatch = productionEnvFile.match(/VITE_CONVEX_URL\s*=\s*"?(https?:\/\/[^\s"]+)"?/);
const CONVEX_URL = prodUrlMatch ? prodUrlMatch[1].trim() : "";
const ADMIN_SECRET = CONVEX_ADMIN_SECRET;

const VARIANT_WIDTHS = [480, 800, 1280];

function ensure(configured: string, label: string) {
  if (!configured) console.error(`FAILED: ${label} is not configured in server/.env`);
}

async function main() {
  ensure(R2_ACCOUNT_ID, "R2_ACCOUNT_ID");
  ensure(R2_PUBLIC_URL, "R2_PUBLIC_URL");
  ensure(CONVEX_URL, "VITE_CONVEX_URL (in .env.production)");
  ensure(ADMIN_SECRET, "CONVEX_ADMIN_SECRET");
  if (!R2_ACCOUNT_ID || !R2_PUBLIC_URL || !CONVEX_URL || !ADMIN_SECRET) process.exit(1);

  const convex = new ConvexHttpClient(CONVEX_URL);
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  const images = await convex.query(api.collectionImages.listImages);
  const candidates = images.filter((img: { srcset?: string | null; r2Key?: string | null }) => !img.srcset && img.r2Key);
  console.log(`Images without variants: ${candidates.length} / ${images.length}`);

  let ok = 0;
  let failed = 0;
  for (const img of candidates) {
    const originalUrl = img.url;
    if (!originalUrl) {
      failed += 1;
      continue;
    }
    try {
      const res = await fetch(originalUrl);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const original = Buffer.from(await res.arrayBuffer());
      const metadata = await sharp(original, { failOn: "none" }).metadata();
      const baseKey = img.r2Key.replace(/\.[^.]+$/, "");
      const srcsetParts: string[] = [];
      for (const width of VARIANT_WIDTHS) {
        if (metadata.width && width >= metadata.width) continue;
        const variantBody = await sharp(original, { failOn: "none" })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const key = `${baseKey}-${width}.webp`;
        await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: variantBody, ContentType: "image/webp" }));
        srcsetParts.push(`${R2_PUBLIC_URL}/${key} ${width}w`);
      }
      const srcset = srcsetParts.length > 0 ? srcsetParts.join(", ") : undefined;
      await convex.mutation(api.collectionImages.updateImageVariants, {
        id: img._id,
        srcset,
        width: metadata.width || undefined,
        height: metadata.height || undefined,
        secret: ADMIN_SECRET,
      });
      ok += 1;
      console.log(`  OK  ${img.originalName} → ${srcsetParts.length} variant(s)`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL  ${img.originalName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`Done — succeeded: ${ok}, failed: ${failed}`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});