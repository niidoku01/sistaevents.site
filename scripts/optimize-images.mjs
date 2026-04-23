import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = process.cwd();
const TARGET_DIRS = ["src/assets", "public"];
const TARGET_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const MIN_BYTES_TO_PROCESS = 40 * 1024;

const toPosixPath = (value) => value.split(path.sep).join("/");

const walkFiles = async (dirPath) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
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

const optimizeBuffer = async (inputPath, format) => {
  const pipeline = sharp(inputPath, { failOn: "none" }).rotate();

  if (format === "jpeg" || format === "jpg") {
    return pipeline
      .jpeg({
        quality: 74,
        mozjpeg: true,
        progressive: true,
      })
      .toBuffer();
  }

  if (format === "png") {
    return pipeline
      .png({
        compressionLevel: 9,
        palette: true,
        quality: 76,
        effort: 10,
      })
      .toBuffer();
  }

  if (format === "webp") {
    return pipeline
      .webp({
        quality: 74,
        effort: 6,
      })
      .toBuffer();
  }

  return null;
};

const main = async () => {
  const imageFiles = [];

  for (const relativeDir of TARGET_DIRS) {
    const absoluteDir = path.join(ROOT_DIR, relativeDir);
    try {
      await fs.access(absoluteDir);
    } catch {
      continue;
    }

    const files = await walkFiles(absoluteDir);
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (TARGET_EXTENSIONS.has(ext)) {
        imageFiles.push(filePath);
      }
    }
  }

  let processed = 0;
  let optimized = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const filePath of imageFiles) {
    const ext = path.extname(filePath).toLowerCase();
    const format = ext.slice(1);
    const original = await fs.readFile(filePath);

    bytesBefore += original.length;

    if (original.length < MIN_BYTES_TO_PROCESS) {
      bytesAfter += original.length;
      continue;
    }

    const optimizedBuffer = await optimizeBuffer(filePath, format);
    processed += 1;

    if (!optimizedBuffer || optimizedBuffer.length >= original.length) {
      bytesAfter += original.length;
      continue;
    }

    await fs.writeFile(filePath, optimizedBuffer);
    bytesAfter += optimizedBuffer.length;
    optimized += 1;

    const saved = original.length - optimizedBuffer.length;
    console.log(`optimized ${toPosixPath(path.relative(ROOT_DIR, filePath))} (-${saved} bytes)`);
  }

  const savedBytes = bytesBefore - bytesAfter;
  const savedPercent = bytesBefore > 0 ? ((savedBytes / bytesBefore) * 100).toFixed(2) : "0.00";

  console.log("\nImage optimization summary");
  console.log(`- scanned: ${imageFiles.length}`);
  console.log(`- processed: ${processed}`);
  console.log(`- optimized: ${optimized}`);
  console.log(`- before: ${bytesBefore} bytes`);
  console.log(`- after: ${bytesAfter} bytes`);
  console.log(`- saved: ${savedBytes} bytes (${savedPercent}%)`);
};

main().catch((error) => {
  console.error("Image optimization failed:", error);
  process.exit(1);
});
