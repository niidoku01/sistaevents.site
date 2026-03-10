import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAvailability = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("featuredItems").collect();
    return docs.map((doc) => ({
      key: doc.key,
      available: doc.available,
      updatedAt: doc.updatedAt,
    }));
  },
});

export const setAvailability = mutation({
  args: {
    key: v.string(),
    available: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("featuredItems")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const updatedAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        available: args.available,
        updatedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("featuredItems", {
      key: args.key,
      available: args.available,
      updatedAt,
    });
  },
});

export const listImageAvailability = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("featuredItemImages").collect();
    return docs.map((doc) => ({
      itemKey: doc.itemKey,
      imageIndex: doc.imageIndex,
      available: doc.available,
      updatedAt: doc.updatedAt,
    }));
  },
});

export const setImageAvailability = mutation({
  args: {
    itemKey: v.string(),
    imageIndex: v.number(),
    available: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("featuredItemImages")
      .withIndex("by_item_image", (q) => q.eq("itemKey", args.itemKey).eq("imageIndex", args.imageIndex))
      .unique();

    const updatedAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        available: args.available,
        updatedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("featuredItemImages", {
      itemKey: args.itemKey,
      imageIndex: args.imageIndex,
      available: args.available,
      updatedAt,
    });
  },
});
