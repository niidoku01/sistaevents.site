import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { adminSecretArg, validateAdminSecret } from "./admin";

export const getLayout = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("collectionLayout").collect();
    const result: Record<
      string,
      { orderedIds: string[]; hiddenIds: string[]; updatedAt: number }
    > = {};
    for (const doc of docs) {
      result[doc.category] = {
        orderedIds: doc.orderedIds,
        hiddenIds: doc.hiddenIds,
        updatedAt: doc.updatedAt,
      };
    }
    return result;
  },
});

export const setLayout = mutation({
  args: {
    category: v.string(),
    orderedIds: v.array(v.string()),
    hiddenIds: v.array(v.string()),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    const category = args.category.trim();
    if (!category) throw new Error("Category is required");
    if (args.orderedIds.length > 10000) throw new Error("Order list too large");
    const existing = await ctx.db
      .query("collectionLayout")
      .withIndex("by_category", (q) => q.eq("category", category))
      .first();
    const data = {
      category,
      orderedIds: args.orderedIds,
      hiddenIds: args.hiddenIds,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("collectionLayout", data);
    }
    return { success: true, category };
  },
});

export const deleteLayout = mutation({
  args: {
    category: v.string(),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    const category = args.category.trim();
    if (!category) throw new Error("Category is required");
    const existing = await ctx.db
      .query("collectionLayout")
      .withIndex("by_category", (q) => q.eq("category", category))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { success: true, category, deleted: Boolean(existing) };
  },
});