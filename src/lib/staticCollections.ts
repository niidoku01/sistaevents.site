import collectionSrcsets from "virtual:responsive-collection-manifest";

export type CollectionCategory = "weddings" | "funerals" | "corporate";

export type StaticCollectionImage = {
  _id: string;
  url: string;
  srcset?: string;
  originalName: string;
  category: CollectionCategory;
};

const CATEGORY_ORDER: CollectionCategory[] = ["weddings", "funerals", "corporate"];

const categoryFolders: Record<CollectionCategory, string> = {
  weddings: "/weddings/",
  funerals: "/funerals/",
  corporate: "/corporate/",
};

const imageModules = import.meta.glob("../assets/collections/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP,AVIF,GIF}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const getSrcset = (globPath: string): string | undefined => {
  const normalized = `src/${globPath.replace(/^\.\.\//, "")}`;
  return collectionSrcsets[decodeURIComponent(normalized)]?.srcset;
};

const toFileName = (path: string): string => {
  const fileName = path.split("/").pop() || path;
  return decodeURIComponent(fileName);
};

const toLowerFileName = (path: string): string => toFileName(path).toLowerCase();

const parseWhatsAppDateMs = (path: string): number | null => {
  const fileName = toLowerFileName(path);
  const match = fileName.match(/(20\d{2})-(\d{2})-(\d{2})\s+at\s+(\d{1,2})\.(\d{2})\.(\d{2})\s*(am|pm)/i);

  if (!match) {
    return null;
  }

  const [, y, m, d, h, min, sec, meridiem] = match;
  let hour = Number(h);
  const minute = Number(min);
  const second = Number(sec);

  if (meridiem.toLowerCase() === "pm" && hour < 12) {
    hour += 12;
  }
  if (meridiem.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }

  return new Date(Number(y), Number(m) - 1, Number(d), hour, minute, second).getTime();
};

const parseIsoLikeDateMs = (path: string): number | null => {
  const fileName = toLowerFileName(path);
  const match = fileName.match(/(20\d{2})[-_](\d{2})[-_](\d{2})(?:[^\d]+(\d{2})[._-]?(\d{2})[._-]?(\d{2})?)?/i);

  if (!match) {
    return null;
  }

  const [, y, m, d, hh = "00", mm = "00", ss = "00"] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)).getTime();
};

const parseLeadingSequence = (path: string): number | null => {
  const fileName = toLowerFileName(path);
  const match = fileName.match(/^(\d{2,})[-_]/);
  return match ? Number(match[1]) : null;
};

const getRecencyScore = (path: string): number => {
  const whatsAppDate = parseWhatsAppDateMs(path);
  if (whatsAppDate !== null) {
    return whatsAppDate;
  }

  const isoLikeDate = parseIsoLikeDateMs(path);
  if (isoLikeDate !== null) {
    return isoLikeDate;
  }

  const leadingSequence = parseLeadingSequence(path);
  if (leadingSequence !== null) {
    return leadingSequence;
  }

  return Infinity;
};

const compareOldestFirst = (a: { path: string }, b: { path: string }): number => {
  const scoreA = getRecencyScore(a.path);
  const scoreB = getRecencyScore(b.path);

  if (scoreA !== scoreB) {
    return scoreA - scoreB;
  }

  // Fallback when no recency signal exists.
  return a.path.localeCompare(b.path);
};

const getCategoryFromPath = (path: string): CollectionCategory | null => {
  for (const category of CATEGORY_ORDER) {
    if (path.includes(categoryFolders[category])) {
      return category;
    }
  }

  return null;
};

const groupedByCategory: Record<CollectionCategory, { path: string; url: string }[]> = {
  weddings: [],
  funerals: [],
  corporate: [],
};

for (const [path, url] of Object.entries(imageModules)) {
  const category = getCategoryFromPath(path);
  if (!category) {
    continue;
  }

  groupedByCategory[category].push({ path, url });
}

for (const category of CATEGORY_ORDER) {
  groupedByCategory[category].sort(compareOldestFirst);
}

export const staticCollectionImagesByCategory: Record<CollectionCategory, StaticCollectionImage[]> = {
  weddings: groupedByCategory.weddings.map((image, index) => ({
    _id: `weddings-${index + 1}`,
    url: image.url,
    srcset: getSrcset(image.path),
    originalName: toFileName(image.path),
    category: "weddings",
  })),
  funerals: groupedByCategory.funerals.map((image, index) => ({
    _id: `funerals-${index + 1}`,
    url: image.url,
    srcset: getSrcset(image.path),
    originalName: toFileName(image.path),
    category: "funerals",
  })),
  corporate: groupedByCategory.corporate.map((image, index) => ({
    _id: `corporate-${index + 1}`,
    url: image.url,
    srcset: getSrcset(image.path),
    originalName: toFileName(image.path),
    category: "corporate",
  })),
};
