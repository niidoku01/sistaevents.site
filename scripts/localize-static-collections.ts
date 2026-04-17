import fs from "node:fs";
import path from "node:path";

type Category = "weddings" | "funerals" | "corporate";

type LocalizedImage = {
  _id: string;
  url: string;
  originalName: string;
  category: Category;
  importName: string;
};

const categories: Category[] = ["weddings", "funerals", "corporate"];

const staticCollectionsPath = path.resolve(process.cwd(), "src/lib/staticCollections.ts");

const sanitize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getExtFromUrl = (url: string) => {
  const clean = url.split("?")[0];
  const parts = clean.split(".");
  const ext = parts[parts.length - 1]?.toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return ext;
  return "jpg";
};

async function download(url: string, outPath: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outPath, data);
}

async function main() {
  if (!fs.existsSync(staticCollectionsPath)) {
    throw new Error("src/lib/staticCollections.ts not found");
  }

  const currentText = fs.readFileSync(staticCollectionsPath, "utf8");
    const remoteEntryRegex =
      /\{[^{}]*_id\s*:\s*"([^"]+)"[^{}]*url\s*:\s*"(https?:\/\/[^"]+)"[^{}]*originalName\s*:\s*"([^"]*)"[^{}]*category\s*:\s*"(weddings|funerals|corporate)"[^{}]*\}/g;

  const remoteEntries: LocalizedImage[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = remoteEntryRegex.exec(currentText)) !== null) {
    remoteEntries.push({
      _id: match[1],
      url: match[2],
      originalName: match[3],
      category: match[4] as Category,
      importName: "",
    });
  }

  if (remoteEntries.length === 0) {
    console.log("No remote URLs found in src/lib/staticCollections.ts. Already localized.");
    return;
  }

  const assetsRoot = path.resolve(process.cwd(), "src/assets/collections");
  fs.mkdirSync(assetsRoot, { recursive: true });

  const byCategory = {} as Record<Category, LocalizedImage[]>;
  const importLines: string[] = [];

  for (const category of categories) {
    const list = remoteEntries.filter((entry) => entry.category === category);
    const categoryDir = path.join(assetsRoot, category);
    fs.mkdirSync(categoryDir, { recursive: true });

    byCategory[category] = [];

    for (let i = 0; i < list.length; i++) {
      const image = list[i];
      const isRemote = /^https?:\/\//i.test(image.url);

      if (!isRemote) {
        continue;
      }

      const ext = getExtFromUrl(image.url);
      const base = sanitize(image.originalName || `${category}-${i + 1}`) || `${category}-${i + 1}`;
      const fileName = `${String(i + 1).padStart(3, "0")}-${base}.${ext}`;
      const absPath = path.join(categoryDir, fileName);

      if (!fs.existsSync(absPath)) {
        await download(image.url, absPath);
      }

      const importName = `${category}Img${i + 1}`;
      const relativeImportPath = `@/assets/collections/${category}/${fileName}`;
      importLines.push(`import ${importName} from "${relativeImportPath}";`);

      byCategory[category].push({
        _id: image._id,
        url: image.url,
        originalName: image.originalName,
        category,
        importName,
      });
    }
  }

  const generated = [
    ...importLines,
    "",
    "export type CollectionCategory = \"weddings\" | \"funerals\" | \"corporate\";",
    "",
    "export type StaticCollectionImage = {",
    "  _id: string;",
    "  url: string;",
    "  originalName: string;",
    "  category: CollectionCategory;",
    "};",
    "",
    "export const staticCollectionImagesByCategory: Record<CollectionCategory, StaticCollectionImage[]> = {",
    ...categories.map((category) => {
      const rows = byCategory[category]
        .map(
          (item) =>
            `    { _id: "${item._id}", url: ${item.importName}, originalName: ${JSON.stringify(item.originalName)}, category: "${category}" },`
        )
        .join("\n");

      return `  ${category}: [\n${rows}\n  ],`;
    }),
    "};",
    "",
    "export const staticCollectionImages: StaticCollectionImage[] = [",
    "  ...staticCollectionImagesByCategory.weddings,",
    "  ...staticCollectionImagesByCategory.funerals,",
    "  ...staticCollectionImagesByCategory.corporate,",
    "];",
    "",
  ].join("\n");

  fs.writeFileSync(path.resolve(process.cwd(), "src/lib/staticCollections.ts"), generated, "utf8");

  const total = categories.reduce((sum, category) => sum + byCategory[category].length, 0);
  console.log(`Localized ${total} collection images into src/assets/collections and rewrote src/lib/staticCollections.ts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

