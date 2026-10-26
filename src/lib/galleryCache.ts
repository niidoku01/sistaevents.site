/**
 * Local snapshot of the uploaded collection images.
 *
 * Static collection photos are bundled with the app, so the only data the
 * gallery has to wait on is the uploaded-image list. Persisting the last
 * successful result lets the gallery paint immediately on repeat visits while
 * the live Convex query revalidates in the background.
 */

export type CachedGalleryImage = {
  _id: string;
  url: string | null;
  srcset?: string | null;
  width?: number | null;
  height?: number | null;
  originalName: string;
  category: string;
  uploadedAt: number;
};

type StoredSnapshot = {
  version: number;
  savedAt: number;
  images: CachedGalleryImage[];
};

const STORAGE_KEY = "sista-collection-images";
const CACHE_VERSION = 1;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

let memoryCache: CachedGalleryImage[] | null = null;
let memoryLoaded = false;

const toNumberOrUndefined = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const sanitizeImage = (raw: unknown): CachedGalleryImage | null => {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const id = entry._id;
  const category = entry.category;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof category !== "string" || category.length === 0) return null;

  return {
    _id: id,
    url: stringOrNull(entry.url),
    srcset: stringOrNull(entry.srcset),
    width: toNumberOrUndefined(entry.width),
    height: toNumberOrUndefined(entry.height),
    originalName: typeof entry.originalName === "string" ? entry.originalName : "",
    category,
    uploadedAt: toNumberOrUndefined(entry.uploadedAt) ?? 0,
  };
};

const parseSnapshot = (raw: string | null): CachedGalleryImage[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSnapshot> | null;
    if (!parsed || parsed.version !== CACHE_VERSION) return null;
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      return null;
    }
    if (!Array.isArray(parsed.images)) return null;
    return parsed.images
      .map(sanitizeImage)
      .filter((image): image is CachedGalleryImage => image !== null);
  } catch {
    return null;
  }
};

/**
 * Synchronously return the last cached image list. Safe to call during the
 * first render: it never hits the network and degrades to an empty list when
 * storage is unavailable.
 */
export function readCachedGalleryImages(): CachedGalleryImage[] {
  if (memoryLoaded) return memoryCache ?? [];
  memoryLoaded = true;
  if (typeof window === "undefined") return [];

  try {
    memoryCache = parseSnapshot(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    memoryCache = null;
  }
  return memoryCache ?? [];
}

/**
 * Persist the latest image list. Only the fields the gallery renders are
 * stored so the snapshot stays small even with a large collection.
 */
export function writeCachedGalleryImages(images: readonly CachedGalleryImage[]): void {
  const sanitized = images
    .map(sanitizeImage)
    .filter((image): image is CachedGalleryImage => image !== null);
  memoryCache = sanitized;
  memoryLoaded = true;

  if (typeof window === "undefined") return;

  const snapshot: StoredSnapshot = {
    version: CACHE_VERSION,
    savedAt: Date.now(),
    images: sanitized,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota or privacy-mode failures are non-fatal; live data still works.
  }
}

/** Drop the snapshot after a mutation so the next visit refetches. */
export function invalidateGalleryImageCache(): void {
  memoryCache = null;
  memoryLoaded = true;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
