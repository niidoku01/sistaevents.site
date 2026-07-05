import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { adminSecretArg, validateAdminSecret } from "./admin";

export const createBooking = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    eventDate: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.name.length < 2 || args.name.length > 100) {
      throw new Error("Name must be between 2 and 100 characters");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
      throw new Error("Invalid email format");
    }
    if (!/^[\d\s()+-]{10,20}$/.test(args.phone)) {
      throw new Error("Invalid phone format");
    }
    if (isNaN(Date.parse(args.eventDate))) {
      throw new Error("Invalid date format");
    }
    if (args.message.length > 1000) {
      throw new Error("Message too long (max 1000 characters)");
    }

    const blockedDate = await ctx.db
      .query("blockedDates")
      .withIndex("by_event_date", (q) => q.eq("eventDate", args.eventDate))
      .first();

    if (blockedDate) {
      throw new Error("Date is blocked by admin and currently unavailable.");
    }

    const bookingId = await ctx.db.insert("bookings", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      eventDate: args.eventDate,
      message: args.message,
      createdAt: Date.now(),
    });
    return bookingId;
  },
});

export const getAllBookings = query({
  handler: async (ctx) => {
    return await ctx.db.query("bookings").collect();
  },
});

export const getUnavailableDates = query({
  handler: async (ctx) => {
    const blockedDates = await ctx.db.query("blockedDates").collect();

    const unavailable = new Set<string>();

    for (const blocked of blockedDates) {
      unavailable.add(blocked.eventDate);
    }

    return Array.from(unavailable).sort();
  },
});

export const getBlockedDates = query({
  handler: async (ctx) => {
    return await ctx.db.query("blockedDates").withIndex("by_created_at").collect();
  },
});

export const blockDate = mutation({
  args: {
    eventDate: v.string(),
    reason: v.optional(v.string()),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    const existingBlockedDate = await ctx.db
      .query("blockedDates")
      .withIndex("by_event_date", (q) => q.eq("eventDate", args.eventDate))
      .first();

    if (existingBlockedDate) {
      return existingBlockedDate._id;
    }

    return await ctx.db.insert("blockedDates", {
      eventDate: args.eventDate,
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

export const unblockDate = mutation({
  args: {
    id: v.id("blockedDates"),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    await ctx.db.delete(args.id);
  },
});

export const deleteBooking = mutation({
  args: {
    id: v.id("bookings"),
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
    await ctx.db.delete(args.id);
  },
});