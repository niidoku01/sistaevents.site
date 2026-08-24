import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { promises as fs } from "node:fs";
import sharp from "sharp";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Build-time responsive images.
 *
 * 1. `?responsive` query imports generate WebP variants (480w / 800w / 1280w /
 *    1920w) for a single image and export `{ src, srcset }`.
 * 2. `virtual:responsive-collection-manifest` is populated at build start by
 *    scanning `src/assets/collections`, so the collection gallery can build
 *    per-image `srcset` values without relying on glob query imports (which
 *    rolldown-vite does not route through this plugin).
 *
 * Variants are written to `public/res/img` (gitignored) so they are served
 * statically in both dev and production builds.
 */
const RESPONSIVE_WIDTHS = [480, 800, 1280, 1920];
const MAX_GENERATED_WIDTH = 1920;
const RESPONSIVE_OUTPUT_PREFIX = "/res/img/";
const COLLECTION_DIR = path.resolve(process.cwd(), "src/assets/collections");

function responsiveImages(): Plugin {
  const cache = new Map<string, string>();
  const outputDir = path.resolve(process.cwd(), "public/res/img");
  const collectionManifest: Record<string, { srcset: string }> = {};

  const toUrl = (fileName: string) => `${RESPONSIVE_OUTPUT_PREFIX}${encodeURI(fileName)}`;

  const generateVariants = async (filePath: string): Promise<{ width: number; url: string }[]> => {
    const meta = await sharp(filePath, { failOn: "none" }).metadata();
    const srcWidth = meta.width || MAX_GENERATED_WIDTH;

    let widths = RESPONSIVE_WIDTHS.filter((w) => w < srcWidth);
    if (srcWidth <= MAX_GENERATED_WIDTH) {
      widths.push(srcWidth);
    }
    if (widths.length === 0) {
      widths = [Math.min(srcWidth, MAX_GENERATED_WIDTH)];
    }
    widths = Array.from(new Set(widths)).sort((a, b) => a - b);

    await fs.mkdir(outputDir, { recursive: true });
    const parentDir = path.basename(path.dirname(filePath));
    const baseName = path.basename(filePath, path.extname(filePath));

    const variants: { width: number; url: string }[] = [];
    for (const width of widths) {
      const fileName = `${parentDir}-${baseName}-${width}.webp`;
      const outFile = path.join(outputDir, fileName);
      if (!(await fs.access(outFile).then(() => true).catch(() => false))) {
        await sharp(filePath, { failOn: "none" })
          .rotate()
          .resize({ width })
          .webp({ quality: 90, effort: 3 })
          .toFile(outFile);
      }
      variants.push({ width, url: toUrl(fileName) });
    }
    return variants;
  };

  const walkFiles = async (dirPath: string): Promise<string[]> => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          return walkFiles(fullPath);
        }
        return [fullPath];
      })
    );
    return nested.flat();
  };

  return {
    name: "vite:responsive-images",
    enforce: "pre",
    async buildStart() {
      const files = await walkFiles(COLLECTION_DIR);
      for (const filePath of files) {
        if (!/\.(jpe?g|png|webp)$/i.test(filePath)) continue;
        const variants = await generateVariants(filePath);
        const rel = path.relative(process.cwd(), filePath).split(path.sep).join("/");
        collectionManifest[rel] = {
          srcset: variants.map((v) => `${v.url} ${v.width}w`).join(", "),
        };
      }
    },
    async resolveId(source, importer, options) {
      if (source === "virtual:responsive-collection-manifest") return source;
      const query = source.split("?")[1] || "";
      if (!query.startsWith("responsive")) return null;
      const resolved = await this.resolve(source.split("?")[0], importer, { skipSelf: true });
      if (!resolved) return null;
      return `${resolved.id}?responsive`;
    },
    async load(id) {
      if (id === "virtual:responsive-collection-manifest") {
        return `export default ${JSON.stringify(collectionManifest)};`;
      }
      const queryIndex = id.lastIndexOf("?");
      const query = queryIndex >= 0 ? id.slice(queryIndex + 1) : "";
      if (!query.startsWith("responsive")) return null;
      const filePath = id.slice(0, queryIndex);
      if (!/\.(jpe?g|png|webp)$/i.test(filePath)) return null;

      const cached = cache.get(id);
      if (cached) return cached;

      const variants = await generateVariants(filePath);
      const src = variants[variants.length - 1].url;
      const srcset = variants.map((v) => `${v.url} ${v.width}w`).join(", ");
      const code = [
        `export const src = ${JSON.stringify(src)};`,
        `export const srcset = ${JSON.stringify(srcset)};`,
        `export default { src, srcset };`,
      ].join("\n");
      cache.set(id, code);
      return code;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 8080,
    headers: {
      // Security headers
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-site",
    },
  },
  plugins: [
    responsiveImages(),
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "dist/stats.html",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Minify and optimize for production
    minify: "esbuild", // Use esbuild for faster minification
    sourcemap: false,
    target: "es2020",
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit to 1000kb
    assetsInlineLimit: 0, // Don't inline images, let them be external files
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) return "vendor-react";
          if (id.includes("node_modules/firebase")) return "vendor-firebase";
          if (id.includes("node_modules/convex")) return "vendor-convex";
          if (id.includes("node_modules/@radix-ui")) return "vendor-ui";
        },
      },
    },
  },
});
