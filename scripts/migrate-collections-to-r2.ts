// One-time (resumable) migration: moves Collection/Gallery image FILES from
// Convex storage to Cloudflare R2, then records the R2 key + public URL on each
// Convex row via the `collectionImages.markMigrated` mutation.
//
// Convex stays the database for all Collection metadata. Convex storage blobs
// are NOT deleted — they remain as a backup until the migration is verified.
//
// Object layout on R2 (predictable, safe, request-scoped prefix):
//   collections/{category}/{docId}.{ext}
//   collections/{category}/{time}-{rand}.{ext}   (new admin uploads)
//
// The migration is idempotent:
//   * Rows that already have an r2Key are skipped unless the R2 object is
//     actually missing (then the file is re-uploaded).
//   * Each Convex doc maps to exactly one deterministic R2 key, so re-running
//     overwrites/reuses the same object instead of duplicating files.
//   * upload is only skipped, never the metadata patch; markMigrated is safe
//     to call more than once.
//
// Pre-requisites (server-side secrets, never committed):
//   VITE_CONVEX_URL           -> Convex deployment URL (read from .env.local)
//   CONVEX_ADMIN_SECRET       -> admin secret for the markMigrated mutation
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET_NAME, R2_PUBLIC_URL (read from server/.env)
//
// Run:      npm run migrate:collections-to-r2
// Dry-run:  npm run migrate:collections-to-r2 -- --dry-run

import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

type CollectionRow = {
  _id: string;
  storageId?: string | null;
  r2Key?: string | null;
  url?: string | null;
  originalName?: string | null;
  contentType?: string | null;
  category?: string | null;
};

const envSources = [".env.local", "server/.env"];

const readEnvValue = (key: string): string | undefined => {
  if (process.env[key]) return process.env[key];

  for (const rel of envSources) {
    const envPath = path.resolve(process.cwd(), rel);
    if (!fs.existsSync(envPath)) continue;
    const envText = fs.readFileSync(envPath, "utf8");
    const line = envText
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));
    if (line) {
      return line.replace(`${key}=`, "").trim().replace(/^"|"$/g, "");
    }
  }
  return undefined;
};

const extForContentType = (contentType?: string | null): string => {
  switch (contentType) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/gif": return ".gif";
    case "image/webp": return ".webp";
    default: return ".jpg";
  }
};

// Categories are stored lowercase from a fixed allowlist; anything unexpected
// falls back to a safe token so object keys can never escape the namespace.
const safeCategory = (category?: string | null): string =>
  category && /^[a-z0-9-]+$/.test(category) ? category : "uncategorized";

const buildKey = (row: CollectionRow): string =>
  `collections/${safeCategory(row.category)}/${row._id}${extForContentType(row.contentType)}`;

const objectExists = async (s3: S3Client, bucket: string, key: string): Promise<boolean> => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
};

const uploadBody = async (
  s3: S3Client,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> => {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
};

const downloadFromConvex = async (storageUrl: string): Promise<Buffer> => {
  const response = await fetch(storageUrl);
  if (!response.ok) {
    throw new Error(`failed to download image from Convex storage (${response.status} ${response.statusText})`);
  }
  return Buffer.from(await response.arrayBuffer());
};

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");

  const convexUrl = readEnvValue("VITE_CONVEX_URL");
  const adminSecret = readEnvValue("CONVEX_ADMIN_SECRET");
  const accountId = readEnvValue("R2_ACCOUNT_ID");
  const accessKeyId = readEnvValue("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnvValue("R2_SECRET_ACCESS_KEY");
  const bucket = readEnvValue("R2_BUCKET_NAME");
  const publicUrl = (readEnvValue("R2_PUBLIC_URL") || "").replace(/\/+$/, "");

  const missing = [];
  if (!convexUrl) missing.push("VITE_CONVEX_URL");
  if (!adminSecret) missing.push("CONVEX_ADMIN_SECRET");
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucket) missing.push("R2_BUCKET_NAME");
  if (!publicUrl) missing.push("R2_PUBLIC_URL");
  if (missing.length > 0) {
    console.error(`Missing environment variable(s): ${missing.join(", ")}`);
    console.error("Add them to .env.local and/or server/.env then re-run.");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const rows = (await client.query(api.collectionImages.listImages)) as unknown as CollectionRow[];
  const alreadyMigrated = rows.filter((row) => row.r2Key);
  const pending = rows.filter((row) => !row.r2Key);
  const withoutSource = pending.filter((row) => !row.storageId);

  console.log(`Convex deployment: ${convexUrl}`);
  console.log(`Total Collection rows: ${rows.length}`);
  console.log(`Already migrated (have r2Key): ${alreadyMigrated.length}`);
  console.log(`Pending migration: ${pending.length}`);
  if (withoutSource.length > 0) {
    console.error(`⚠ ${withoutSource.length} pending row(s) have neither storageId nor r2Key — cannot migrate them.`);
    for (const row of withoutSource) console.error(`  ✗ ${row.originalName ?? row._id}`);
  }
  if (dryRun) {
    console.log("DRY RUN — no files downloaded, uploaded, or Convex rows updated.");
    for (const row of pending) {
      console.log(`  would migrate ${row.originalName ?? row._id} -> ${buildKey(row)}`);
    }
    console.log(`\nDry-run complete: ${pending.length} would be migrated.`);
    await s3.destroy();
    return;
  }
  if (pending.length === 0) {
    console.log("Nothing to migrate.");
    await s3.destroy();
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const row of pending) {
    const key = buildKey(row);
    const url = `${publicUrl}/${key}`;
    const label = row.originalName ?? row._id;
    try {
      let uploaded = false;
      if (!(await objectExists(s3, bucket, key))) {
        if (!row.storageId) {
          throw new Error("no Convex storage file to migrate from (storageId is empty)");
        }
        const storageUrl = await client.query(api.collectionImages.getStorageUrl, {
          storageId: row.storageId as import("../convex/_generated/dataModel.js").Id<"_storage">,
        });
        if (!storageUrl) {
          throw new Error("Convex returned no storage URL for this row (file may be missing)");
        }

        const body = await downloadFromConvex(storageUrl);
        if (body.length === 0) {
          throw new Error("downloaded an empty file from Convex storage");
        }

        const contentType = row.contentType || "image/jpeg";
        await uploadBody(s3, bucket, key, body, contentType);
        uploaded = true;
        console.log(`✓ uploaded ${label} (${body.length} bytes) -> ${key}`);
      } else {
        console.log(`→ object already in R2, reusing ${key}`);
      }

      // Only mark the Convex row AFTER the R2 object is confirmed present.
      await client.mutation(api.collectionImages.markMigrated, {
        id: row._id as import("../convex/_generated/dataModel.js").Id<"collectionImages">,
        r2Key: key,
        url,
        secret: adminSecret,
      });
      ok += 1;
      console.log(`✓ \`recorded\` ${label} -> ${url}` + (uploaded ? "" : " (existing object)"));
    } catch (err) {
      failed += 1;
      console.error(`✗ ${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nMigration finished: ${ok} migrated, ${failed} failed.`);
  console.log("Convex storage blobs were kept as a backup. Verify the gallery, then delete them manually.");

  await s3.destroy();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});