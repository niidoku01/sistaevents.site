/**
 * Small helpers for warming the browser image cache.
 *
 * `new Image()` is used instead of `<link rel="preload">` because gallery
 * navigation can touch dozens of images; links are never removed from the DOM,
 * while an image request that is already in the HTTP cache is effectively free.
 */

export type PreloadableImage = {
  src?: string | null;
  srcset?: string | null;
  url?: string | null;
};

const preloaded = new Set<string>();

export function preloadImage(image: PreloadableImage | null | undefined, sizes = "100vw"): void {
  if (typeof window === "undefined" || !image) return;

  const src = image.src ?? image.url;
  if (!src) return;

  const srcset = image.srcset ?? undefined;
  const key = `${src}|${srcset ?? ""}|${sizes}`;
  if (preloaded.has(key)) return;
  preloaded.add(key);

  const img = new Image();
  img.decoding = "async";
  if (srcset) {
    img.srcset = srcset;
    img.sizes = sizes;
  }
  img.src = src;
}

export function preloadImages(images: (PreloadableImage | null | undefined)[], sizes = "100vw"): void {
  for (const image of images) {
    preloadImage(image, sizes);
  }
}
