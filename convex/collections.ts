import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveImage = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    originalName: v.string(),
    size: v.number(),
    contentType: v.string(),
    category: v.optional(v.union(v.literal("weddings"), v.literal("funerals"), v.literal("corporate"))),
  },
  handler: async (ctx, args) => {
    // Get the highest order value and add 1
    const images = await ctx.db.query("images").collect();
    const maxOrder = images.length > 0 
      ? Math.max(...images.map(img => img.order ?? -1)) 
      : -1;
    
    const imageId = await ctx.db.insert("images", {
      storageId: args.storageId,
      filename: args.filename,
      originalName: args.originalName,
      size: args.size,
      contentType: args.contentType,
      uploadedAt: Date.now(),
      order: maxOrder + 1,
      category: args.category,
    });
    return imageId;
  },
});

export const listImages = query({
  args: {
    category: v.optional(v.union(v.literal("weddings"), v.literal("funerals"), v.literal("corporate"))),
  },
  handler: async (ctx, args) => {
    let images;
    
    if (args.category) {
      images = await ctx.db
        .query("images")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    } else {
      images = await ctx.db
        .query("images")
        .collect();
    }
    
    // Sort by order if available, otherwise by uploadedAt
    const sortedImages = images.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0);
    });
    
    return await Promise.all(
      sortedImages.map(async (image) => ({
        ...image,
        url: await ctx.storage.getUrl(image.storageId),
      }))
    );
  },
});

export const deleteImage = mutation({
  args: {
    id: v.id("images"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(args.id);
  },
});

export const updateImageOrder = mutation({
  args: {
    id: v.id("images"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { order: args.newOrder });
  },
});

export const reorderImages = mutation({
  args: {
    imageIds: v.array(v.id("images")),
  },
  handler: async (ctx, args) => {
    // Update the order of all images based on their position in the array
    await Promise.all(
      args.imageIds.map((id, index) =>
        ctx.db.patch(id, { order: index })
      )
    );
  },
});
