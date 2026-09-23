import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { adminSecretArg, validateAdminSecret } from "./admin";
import {
  isValidName,
  isValidEmail,
  isValidEventType,
  INVALID_NAME,
  INVALID_EMAIL,
  INVALID_EVENT,
} from "./_validation";

export const submitReview = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    event: v.string(),
    content: v.string(),
    rating: v.number(),
    // Legacy client field from the old consent checkbox. Accepted but ignored so
    // already-cached clients keep submitting without a "required" error.
    consent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!isValidName(args.name)) {
      throw new Error(INVALID_NAME);
    }
    if (!isValidEmail(args.email)) {
      throw new Error(INVALID_EMAIL);
    }
    if (!isValidEventType(args.event)) {
      throw new Error(INVALID_EVENT);
    }
    if (args.content.length < 10 || args.content.length > 1000) {
      throw new Error("Please write a review between 10 and 1000 characters");
    }
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    return await ctx.db.insert("reviews", {
      name: args.name.trim(),
      email: args.email.trim().toLowerCase(),
      event: args.event.trim(),
      content: args.content,
      rating: args.rating,
      approved: false,
      createdAt: Date.now(),
    });
  },
});

export const getApprovedReviews = query({
  handler: async (ctx) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .order("desc")
      .collect();
    return reviews.map(({ email, ...review }) => review);
  },
});

export const getPendingReviews = query({
  args: {
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
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
