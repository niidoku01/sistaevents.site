import collectionImages from "virtual:responsive-collection-images";

export type CollectionCategory = "weddings" | "funerals" | "corporate";

export type StaticCollectionImage = {
  _id: string;
  url: string;
  srcset?: string;
  width?: number;
  height?: number;
  originalName: string;
  category: CollectionCategory;
};

const CATEGORY_ORDER: CollectionCategory[] = ["weddings", "funerals", "corporate"];

const categoryFolders: Record<CollectionCategory, string> = {
  weddings: "/weddings/",
  funerals: "/funerals/",
  corporate: "/corporate/",
};

type CollectionImageSource = {
  path: string;
  srcset: string;
  width: number;
  height: number;
};

// Pick a reasonably sized static fallback for browsers that do not support
// srcset or for the first paint before the browser chooses a candidate.
const getFallbackUrl = (srcset: string): string => {
  const entries = srcset
    .split(",")
    .map((part) => {
      const [url, descriptor = ""] = part.trim().split(/\s+/);
      return { url, width: Number(descriptor.replace(/w$/i, "")) || 0 };
    })
    .filter((entry) => entry.url);

  if (entries.length === 0) return "";

  const preferred = entries
    .slice()
    .reverse()
    .find((entry) => entry.width <= 1280);

  return (preferred ?? entries[entries.length - 1]).url;
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

const groupedByCategory: Record<CollectionCategory, CollectionImageSource[]> = {
  weddings: [],
  funerals: [],
  corporate: [],
};

for (const image of collectionImages) {
  const category = getCategoryFromPath(image.path);
  if (!category || !image.srcset) {
    continue;
  }

  groupedByCategory[category].push(image);
}

for (const category of CATEGORY_ORDER) {
  groupedByCategory[category].sort(compareOldestFirst);
}

const toStaticImage = (
  category: CollectionCategory,
  image: CollectionImageSource,
  index: number
): StaticCollectionImage => ({
  _id: `${category}-${index + 1}`,
  url: getFallbackUrl(image.srcset),
  srcset: image.srcset,
  width: image.width,
  height: image.height,
  originalName: toFileName(image.path),
  category,
});

export const staticCollectionImagesByCategory: Record<CollectionCategory, StaticCollectionImage[]> = {
  weddings: groupedByCategory.weddings.map((image, index) => toStaticImage("weddings", image, index)),
  funerals: groupedByCategory.funerals.map((image, index) => toStaticImage("funerals", image, index)),
  corporate: groupedByCategory.corporate.map((image, index) => toStaticImage("corporate", image, index)),
};
