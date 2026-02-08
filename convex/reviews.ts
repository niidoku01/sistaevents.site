import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createReview = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    event: v.string(),
    content: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    const reviewId = await ctx.db.insert("reviews", {
      name: args.name,
      email: args.email,
      event: args.event,
      content: args.content,
      rating: args.rating,
      approved: false,
      createdAt: Date.now(),
    });
    return reviewId;
  },
});

export const getPendingReviews = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_approved", (q) => q.eq("approved", false))
      .collect();
  },
});

export const getApprovedReviews = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect();
  },
});

export const approveReview = mutation({
  args: {
    id: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { approved: true });
  },
});

export const deleteReview = mutation({
  args: {
    id: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});