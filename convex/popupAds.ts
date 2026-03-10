import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAds = query({
  args: {},
  handler: async (ctx) => {
    const ads = await ctx.db.query("popupAds").withIndex("by_created_at").collect();
    return ads.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getActiveAd = query({
  args: {},
  handler: async (ctx) => {
    const activeAds = await ctx.db.query("popupAds").withIndex("by_active", (q) => q.eq("active", true)).collect();
    if (activeAds.length === 0) return null;

    return activeAds.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  },
});

export const createAd = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    imageUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.active) {
      const activeAds = await ctx.db.query("popupAds").withIndex("by_active", (q) => q.eq("active", true)).collect();
      await Promise.all(activeAds.map((ad) => ctx.db.patch(ad._id, { active: false, updatedAt: now })));
    }

    return await ctx.db.insert("popupAds", {
      title: args.title,
      message: args.message,
      imageUrl: args.imageUrl,
      ctaText: args.ctaText,
      ctaUrl: args.ctaUrl,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setActive = mutation({
  args: {
    id: v.id("popupAds"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.active) {
      const activeAds = await ctx.db.query("popupAds").withIndex("by_active", (q) => q.eq("active", true)).collect();
      await Promise.all(activeAds.map((ad) => ctx.db.patch(ad._id, { active: false, updatedAt: now })));
    }

    await ctx.db.patch(args.id, {
      active: args.active,
      updatedAt: now,
    });
  },
});

export const deleteAd = mutation({
  args: { id: v.id("popupAds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
