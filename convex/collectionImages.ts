import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { adminSecretArg, validateAdminSecret } from "./admin";

export const generateUploadUrl = mutation({
  args: {
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveImage = mutation({
  args: {
    storageId: v.id("_storage"),
    originalName: v.string(),
    size: v.number(),
    contentType: v.string(),
    category: v.string(),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);

    const VALID_CATEGORIES = ["weddings", "birthdays", "corporate", "social", "decor", "other"];
    const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!VALID_CATEGORIES.includes(args.category)) {
      throw new Error("Invalid category");
    }
    if (!VALID_MIME_TYPES.includes(args.contentType)) {
      throw new Error("Invalid content type; only image files are allowed");
    }
    if (args.size > 20 * 1024 * 1024) {
      throw new Error("File too large (max 20 MB)");
    }
    if (args.originalName.length > 260) {
      throw new Error("Original name too long");
    }

    return await ctx.db.insert("collectionImages", {
      storageId: args.storageId,
      originalName: args.originalName,
      size: args.size,
      contentType: args.contentType,
      category: args.category,
      uploadedAt: Date.now(),
    });
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const listImages = query({
  handler: async (ctx) => {
    const images = await ctx.db
      .query("collectionImages")
      .withIndex("by_uploaded_at")
      .collect();
    return Promise.all(
      images.map(async (img) => ({
        _id: img._id,
        storageId: img.storageId,
        originalName: img.originalName,
        size: img.size,
        contentType: img.contentType,
        category: img.category,
        uploadedAt: img.uploadedAt,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );
  },
});

export const deleteImage = mutation({
  args: {
    id: v.id("collectionImages"),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Image not found");
    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(args.id);
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("collectionImages"),
    category: v.string(),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    await ctx.db.patch(args.id, { category: args.category });
  },
});
