// Post-migration verification utility (Task 10).
// Read-only: reports how many Collection images are served from R2, whether each
// R2 object is present (HEAD) and publicly loadable (GET, Range 0-0), and how
// many rows still depend on legacy Convex storage.
//
// Env: VITE_CONVEX_URL (from .env.local); R2_* (from server/.env).
// Run: npm run verify:collections-to-r2

import fs from "node:fs";
import path from "node:path";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
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

const readEnvValue = (key: string): string | undefined => {
  if (process.env[key]) return process.env[key];
  for (const rel of [".env.local", "server/.env"]) {
    const envPath = path.resolve(process.cwd(), rel);
    if (!fs.existsSync(envPath)) continue;
    const line = fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));
    if (line) return line.replace(`${key}=`, "").trim().replace(/^"|"$/g, "");
  }
  return undefined;
};

const main = async () => {
  const convexUrl = readEnvValue("VITE_CONVEX_URL");
  const accountId = readEnvValue("R2_ACCOUNT_ID");
  const accessKeyId = readEnvValue("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnvValue("R2_SECRET_ACCESS_KEY");
  const bucket = readEnvValue("R2_BUCKET_NAME");
  const publicUrl = (readEnvValue("R2_PUBLIC_URL") || "").replace(/\/+$/, "");

  if (!convexUrl) {
    console.error("Missing VITE_CONVEX_URL (add it to .env.local).");
    process.exit(1);
  }
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    console.error("Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / R2_PUBLIC_URL (server/.env).");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const rows = (await client.query(api.collectionImages.listImages)) as unknown as CollectionRow[];
  console.log(`Convex deployment: ${convexUrl}`);
  console.log(`Total Collection rows: ${rows.length}\n`);

  const counts = {
    migrated: 0,
    storageOnly: 0,
    noSource: 0,
    r2MissingObject: 0,
    r2Unservable: 0,
    failures: 0,
  };

  const results: string[] = [];

  for (const row of rows) {
    const label = `${row.originalName ?? row._id} (${row.category ?? "no-category"})`;
    const detail = {
      ok: false,
      parts: [] as string[],
      extra: [] as string[],
    };

    if (row.r2Key && row.url) {
      counts.migrated += 1;
      detail.parts.push("r2+url");
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: row.r2Key }));
        detail.parts.push("head:ok");
      } catch {
        counts.r2MissingObject += 1;
        detail.extra.push("HEAD failed (object missing in bucket)");
      }

      try {
        const res = await fetch(row.url, { headers: { Range: "bytes=0-0" } });
        const size =
          res.status === 206
            ? res.headers.get("content-range")?.split("/")[1] ?? "?"
            : res.headers.get("content-length") ?? "?";
        if (res.ok) {
          detail.parts.push(`GET:${res.status}`);
          detail.extra.push(`size=${size}`);
        } else {
          counts.r2Unservable += 1;
          detail.extra.push(`GET failed: ${res.status}`);
        }
      } catch (err) {
        counts.r2Unservable += 1;
        detail.extra.push(`GET failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      detail.ok = detail.parts.includes("head:ok") && detail.parts.some((p) => p.startsWith("GET:2"));

      if (!detail.ok) counts.failures += 1;
      results.push(`${detail.ok ? "PASS" : "FAIL"}  ${label}\n       r2Key=${row.r2Key}\n       url=${row.url}\n       ${detail.parts.join(", ")}${detail.extra.length ? " — " + detail.extra.join(", ") : ""}`);
    } else if (row.storageId) {
      counts.storageOnly += 1;
      let storageOk = "n/a";
      try {
        const storageUrl = await client.query(api.collectionImages.getStorageUrl, {
          storageId: row.storageId as import("../convex/_generated/dataModel.js").Id<"_storage">,
        });
        if (storageUrl) {
          const res = await fetch(storageUrl, { headers: { Range: "bytes=0-0" } });
          storageOk = res.ok ? "loadable" : `status ${res.status}`;
        } else {
          storageOk = "no URL";
        }
      } catch (err) {
        storageOk = `error: ${err instanceof Error ? err.message : String(err)}`;
      }
      results.push(`WAIT   ${label}\n       not migrated yet — legacy Convex storage (${storageOk})`);
    } else {
      counts.noSource += 1;
      results.push(`FAIL   ${label}\n       has neither r2Key/url nor storageId — no image source`);
      counts.failures += 1;
    }
  }

  console.log([...results].join("\n"), "\n");

  console.log("SUMMARY");
  console.log(`  Rows:                      ${rows.length}`);
  console.log(`  Migrated to R2 (r2Key+url):${counts.migrated}`);
  console.log(`  Still on Convex storage:   ${counts.storageOnly}`);
  console.log(`  No image source:           ${counts.noSource}`);
  console.log(`  R2 object missing:         ${counts.r2MissingObject}`);
  console.log(`  R2 URL not publicly loadable: ${counts.r2Unservable}`);
  console.log(`  Verification failures:     ${counts.failures}`);

  const allMigrated =
    counts.storageOnly === 0 &&
    counts.noSource === 0 &&
    counts.r2MissingObject === 0 &&
    counts.r2Unservable === 0 &&
    counts.failures === 0;

  console.log(`\nRESULT: ${allMigrated ? "ALL IMAGES SERVED FROM R2 — migration verified." : rows.length === 0 ? "NO ROWS — nothing to verify." : "INCOMPLETE — see above for what remains."}`);
  console.log(allMigrated ? "You may now remove the legacy Convex storage blobs (manual/scripted cleanup step)." : "");

  await s3.destroy();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});