import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { adminSecretArg, validateAdminSecret } from "./admin";

export const submitReview = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    event: v.string(),
    content: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.name.length < 2 || args.name.length > 100) {
      throw new Error("Name must be between 2 and 100 characters");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
      throw new Error("Invalid email format");
    }
    if (args.event.length > 100) {
      throw new Error("Event type too long (max 100 characters)");
    }
    if (args.content.length < 10 || args.content.length > 1000) {
      throw new Error("Review content must be between 10 and 1000 characters");
    }
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    return await ctx.db.insert("reviews", {
      name: args.name,
      email: args.email,
      event: args.event,
      content: args.content,
      rating: args.rating,
      approved: false,
      createdAt: Date.now(),
    });
  },
});

export const getApprovedReviews = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .order("desc")
      .collect();
  },
});

export const getPendingReviews = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_approved", (q) => q.eq("approved", false))
      .order("desc")
      .collect();
  },
});

export const approveReview = mutation({
  args: {
    id: v.id("reviews"),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    await ctx.db.patch(args.id, { approved: true });
  },
});

export const deleteReview = mutation({
  args: {
    id: v.id("reviews"),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    await ctx.db.delete(args.id);
  },
});

export const migrateImport = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    event: v.string(),
    content: v.string(),
    rating: v.number(),
    approved: v.boolean(),
    createdAt: v.number(),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    return await ctx.db.insert("reviews", {
      name: args.name,
      email: args.email,
      event: args.event,
      content: args.content,
      rating: args.rating,
      approved: args.approved,
      createdAt: args.createdAt,
    });
  },
});
