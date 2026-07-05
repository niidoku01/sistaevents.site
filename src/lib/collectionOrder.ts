import { type CollectionCategory, type StaticCollectionImage, staticCollectionImagesByCategory } from "./staticCollections";

export type OrderedImage = {
  id: string;
  hidden: boolean;
};

type CollectionOrderMap = Record<CollectionCategory, OrderedImage[]>;

const STORAGE_KEY = "sista-collection-order";

const defaultOrder = (): CollectionOrderMap => ({
  weddings: staticCollectionImagesByCategory.weddings.map((img) => ({ id: img._id, hidden: false })),
  funerals: staticCollectionImagesByCategory.funerals.map((img) => ({ id: img._id, hidden: false })),
  corporate: staticCollectionImagesByCategory.corporate.map((img) => ({ id: img._id, hidden: false })),
});

const load = (): CollectionOrderMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore parse errors, use defaults
  }
  return defaultOrder();
};

const save = (map: CollectionOrderMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
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
