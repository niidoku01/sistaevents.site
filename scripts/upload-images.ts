// Simple script to upload images to Convex
// Run with: node --loader tsx scripts/upload-images.ts

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Id } from "../convex/_generated/dataModel";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Convex URL from environment
const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://judicious-rhinoceros-41.convex.cloud";

// Initialize Convex client
const client = new ConvexHttpClient(CONVEX_URL);

// Category mapping for folders
const categoryMap: Record<string, "weddings" | "funerals" | "corporate"> = {
  chairs: "weddings",
  flatware: "weddings",
  flowers: "weddings",
  glassware: "weddings",
  lights: "weddings",
  Table: "weddings",
  tents: "corporate",
  others: "corporate",
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "image/jpeg";
}

async function uploadImage(filePath: string, category: "weddings" | "funerals" | "corporate") {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    
    console.log(`Uploading ${filename}...`);
    
    // Generate upload URL
    const uploadUrl = await client.mutation(api.images.generateUploadUrl);
    
    // Upload the file
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: fileBuffer,
      headers: { "Content-Type": getMimeType(filename) },
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const { storageId } = await response.json();
    
    // Save metadata to database
    await client.mutation(api.collections.saveImage, {
      storageId: storageId as Id<"_storage">,
      filename,
      originalName: filename,
      size: fileBuffer.length,
      contentType: getMimeType(filename),
      category,
    });
    
    console.log(`✓ ${filename}`);
  } catch (error) {
    console.error(`✗ ${path.basename(filePath)}:`, error instanceof Error ? error.message : error);
  }
}

async function uploadAllImages() {
  const assetsDir = path.join(__dirname, "../src/assets");
  
  console.log(`Using Convex deployment: ${CONVEX_URL}`);
  console.log("Starting image upload...\n");
  
  let totalUploaded = 0;
  
  for (const [folder, category] of Object.entries(categoryMap)) {
    const folderPath = path.join(assetsDir, folder);
    
    if (!fs.existsSync(folderPath)) {
      continue;
    }
    
    console.log(`\n📁 ${folder} → ${category}`);
    
    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
    );
    
    for (const file of imageFiles) {
      const filePath = path.join(folderPath, file);
      await uploadImage(filePath, category);
      totalUploaded++;
    }
  }
  
  console.log(`\n✨ Successfully uploaded ${totalUploaded} images to Convex!`);
}

// Run the upload
uploadAllImages().catch(console.error);
