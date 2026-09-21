import logoRaw from "@/assets/sistalogo.svg?raw";
import stampRaw from "@/assets/sistastamp.svg?raw";

const SOCIAL_SVGS = {
  phone:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<path fill="#000000" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.12 21 3 13.88 3 5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2z"/>' +
    "</svg>",
  location:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<path fill="#000000" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>' +
    "</svg>",
} as const;

export type SocialIconName = keyof typeof SOCIAL_SVGS;

export function toLogoDataUrl(): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoRaw)}`;
}

export function socialIconDataUrl(name: SocialIconName): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SOCIAL_SVGS[name])}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load logo image"));
    img.src = src;
  });
}

function rasterize(svgText: string, dimension: number): Promise<Uint8Array> {
  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  return (async () => {
    try {
      const img = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = dimension;
      canvas.height = dimension;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, dimension, dimension);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, dimension, dimension);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image PNG conversion failed");
      return new Uint8Array(await blob.arrayBuffer());
    } finally {
      URL.revokeObjectURL(url);
    }
  })();
}

export function loadLogoSvg(): string {
  return logoRaw;
}

export async function loadLogoPng(dimension = 300): Promise<Uint8Array> {
  return rasterize(logoRaw, dimension);
}

export function loadStampSvg(): string {
  return stampRaw;
}

export async function loadStampPng(dimension = 256): Promise<Uint8Array> {
  return rasterize(stampRaw, dimension);
}

export async function loadSocialPngs(
  dimension = 48
): Promise<Record<SocialIconName, Uint8Array>> {
  const [phone, location] = await Promise.all(
    (Object.keys(SOCIAL_SVGS) as SocialIconName[]).map((name) => rasterize(SOCIAL_SVGS[name], dimension))
  );
  return { phone, location };
}
