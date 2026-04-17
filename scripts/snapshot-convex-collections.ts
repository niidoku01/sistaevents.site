import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

type Category = "weddings" | "funerals" | "corporate";

type SnapshotImage = {
  _id: string;
  url: string;
  originalName: string;
  category: Category;
};

type CollectionRow = {
  url?: string | null;
  originalName?: string | null;
};

const readEnvValue = (key: string): string | undefined => {
  if (process.env[key]) return process.env[key];

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return undefined;

  const envText = fs.readFileSync(envPath, "utf8");
  const line = envText
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) return undefined;

  return line.replace(`${key}=`, "").trim().replace(/^"|"$/g, "");
};

const categories: Category[] = ["weddings", "funerals", "corporate"];

async function main() {
  const convexUrl = readEnvValue("VITE_CONVEX_URL");
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL not found in env or .env.local");
  }

  const client = new ConvexHttpClient(convexUrl);

  const byCategory = {} as Record<Category, SnapshotImage[]>;

  for (const category of categories) {
    const rows = (await client.query(api.collections.listImages, {
      category,
    })) as CollectionRow[];

    byCategory[category] = rows
      .filter((row) => Boolean(row.url))
      .map((row, index) => ({
        _id: `${category}-${index + 1}`,
        url: row.url as string,
        originalName: row.originalName ?? `image-${index + 1}`,
        category,
      }));
  }

  const generated = `export type CollectionCategory = "weddings" | "funerals" | "corporate";\n\nexport type StaticCollectionImage = {\n  _id: string;\n  url: string;\n  originalName: string;\n  category: CollectionCategory;\n};\n\nexport const staticCollectionImagesByCategory: Record<CollectionCategory, StaticCollectionImage[]> = ${JSON.stringify(byCategory, null, 2)} as Record<CollectionCategory, StaticCollectionImage[]>;\n\nexport const staticCollectionImages: StaticCollectionImage[] = [\n  ...staticCollectionImagesByCategory.weddings,\n  ...staticCollectionImagesByCategory.funerals,\n  ...staticCollectionImagesByCategory.corporate,\n];\n`;

  const outPath = path.resolve(process.cwd(), "src/lib/staticCollections.ts");
  fs.writeFileSync(outPath, generated, "utf8");

  const total = categories.reduce((sum, category) => sum + byCategory[category].length, 0);
  console.log(`Updated static collections from Convex snapshot: ${total} images total.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
