import { type CollectionCategory, type StaticCollectionImage, staticCollectionImagesByCategory } from "./staticCollections";
import { collectionAPI } from "./api";

export type OrderedImage = {
  id: string;
  hidden: boolean;
};

type CollectionOrderMap = Record<CollectionCategory, OrderedImage[]>;

export type ServerLayout = Record<string, { orderedIds: string[]; hiddenIds: string[]; updatedAt: number }>;

const STORAGE_KEY = "sista-collection-order";

const CATEGORY_KEYS: CollectionCategory[] = ["weddings", "funerals", "corporate"];

const defaultOrder = (): CollectionOrderMap => ({
  weddings: staticCollectionImagesByCategory.weddings.map((img) => ({ id: img._id, hidden: false })),
  funerals: staticCollectionImagesByCategory.funerals.map((img) => ({ id: img._id, hidden: false })),
  corporate: staticCollectionImagesByCategory.corporate.map((img) => ({ id: img._id, hidden: false })),
});

// Authoritative layout fetched from Convex (shared by visitors + admins). When
// present it shadows the browser's own localStorage saved layout, so admin
// reorder/hide actions take effect on the live gallery for every visitor.
let serverLayout: CollectionOrderMap | null = null;

const sanitize = (raw: unknown): CollectionOrderMap | null => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const candidate = raw as Record<string, unknown>;
  const base = defaultOrder();
  for (const category of CATEGORY_KEYS) {
    const existing = candidate[category];
    if (!Array.isArray(existing)) continue;
    const sanitized: OrderedImage[] = [];
    for (const entry of existing) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as { id?: unknown }).id === "string" &&
        (entry as { id: string }).id.length > 0
      ) {
        sanitized.push({
          id: (entry as { id: string }).id,
          hidden: Boolean((entry as { hidden?: unknown }).hidden),
        });
      }
    }
    base[category] = sanitized;
  }
  return base;
};

const readStored = (): CollectionOrderMap => {
  const base = defaultOrder();
  let parsed: unknown = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch {
    // ignore parse errors, use defaults
  }
  const sanitized = sanitize(parsed);
  if (sanitized) {
    for (const category of CATEGORY_KEYS) {
      if (sanitized[category].length > 0) base[category] = sanitized[category];
    }
  }
  return base;
};

const load = (): CollectionOrderMap => {
  return serverLayout ?? readStored();
};

const save = (map: CollectionOrderMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
  serverLayout = map;
};

function applyOrder<T extends { _id: string }>(
  category: CollectionCategory,
  allImages: T[]
): T[] {
  const order = load();
  const ordered = order[category];
  const imageMap = new Map(allImages.map((img) => [img._id, img]));

  const result: T[] = [];
  const seen = new Set<string>();

  for (const entry of ordered) {
    if (entry.hidden) continue;
    const img = imageMap.get(entry.id);
    if (img && !seen.has(img._id)) {
      result.push(img);
      seen.add(img._id);
    }
  }

  for (const img of allImages) {
    if (!seen.has(img._id)) {
      result.push(img);
      seen.add(img._id);
    }
  }

  return result;
}

export function getOrderedImages<T extends { _id: string }>(
  category: CollectionCategory,
  images: T[]
): T[] {
  return applyOrder(category, images);
}

export const getOrderRaw = (): CollectionOrderMap => load();

export const ensureImagesInOrder = (
  category: CollectionCategory,
  imageIds: string[]
) => {
  const order = load();
  const existing = order[category];
  const existingIds = new Set(existing.map((e) => e.id));
  let added = false;
  for (const id of imageIds) {
    if (!existingIds.has(id)) {
      existing.push({ id, hidden: false });
      added = true;
    }
  }
  if (added) save(order);
};

export const moveImage = (category: CollectionCategory, fromIndex: number, toIndex: number) => {
  const order = load();
  const items = order[category];
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return;
  const [moved] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, moved);
  save(order);
};

export const swapImages = (category: CollectionCategory, indexA: number, indexB: number) => {
  const order = load();
  const items = order[category];
  if (indexA < 0 || indexA >= items.length || indexB < 0 || indexB >= items.length) return;
  [items[indexA], items[indexB]] = [items[indexB], items[indexA]];
  save(order);
};

export const toggleHidden = (category: CollectionCategory, id: string) => {
  const order = load();
  const entry = order[category].find((e) => e.id === id);
  if (entry) {
    entry.hidden = !entry.hidden;
    save(order);
  }
};

export const isHidden = (category: CollectionCategory, id: string): boolean => {
  const order = load();
  const entry = order[category].find((e) => e.id === id);
  return entry ? entry.hidden : false;
};

export const removeFromOrder = (category: CollectionCategory, id: string) => {
  const order = load();
  order[category] = order[category].filter((e) => e.id !== id);
  save(order);
};

export const resetOrder = () => {
  save(defaultOrder());
};

// Apply the shared Convex layout. Server data wins for the three categories;
// anything outside the three categories in the server payload is dropped.
export const applyServerLayout = (layout: ServerLayout | null | undefined) => {
  if (!layout || typeof layout !== "object") return;
  const base = readStored();
  for (const category of CATEGORY_KEYS) {
    const entry = layout[category];
    if (!entry || !Array.isArray(entry.orderedIds)) continue;
    const hidden = new Set(Array.isArray(entry.hiddenIds) ? entry.hiddenIds : []);
    // Keep default+stored static ids, replace their order with server order,
    // and append anything new the server knows about that the client lacks.
    const knownStatic = staticCollectionImagesByCategory[category];
    const baseIds = new Set(base[category].map((e) => e.id));
    for (const img of knownStatic) baseIds.add(img._id);
    const merged: OrderedImage[] = entry.orderedIds
      .filter((id) => id && typeof id === "string")
      .map((id) => ({ id, hidden: hidden.has(id) }));
    const mergedIds = new Set(merged.map((e) => e.id));
    for (const baseEntry of base[category]) {
      if (!baseIds.has(baseEntry.id)) continue;
      if (!mergedIds.has(baseEntry.id)) {
        merged.push(baseEntry);
        mergedIds.add(baseEntry.id);
      }
    }
    base[category] = merged;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
  } catch {
    // ignore quota errors
  }
  serverLayout = base;
};

export const getServerLayoutSnapshot = (): CollectionOrderMap => load();

// Fetch the shared layout from Convex and shadow the local store with it.
export const syncOrderFromServer = async (): Promise<void> => {
  try {
    const layout = await collectionAPI.getLayout();
    applyServerLayout(layout);
  } catch (err) {
    console.error("Failed to load collection layout from server:", err);
  }
};

// Push the current per-category order+hidden state to Convex (admin action).
export const pushOrderToServer = async (category: CollectionCategory): Promise<void> => {
  const order = load();
  const entries = order[category];
  const orderedIds = entries.map((e) => e.id);
  const hiddenIds = entries.filter((e) => e.hidden).map((e) => e.id);
  await collectionAPI.setLayout(category, orderedIds, hiddenIds);
};