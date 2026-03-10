import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBooking = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    eventDate: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const existingBooking = await ctx.db
      .query("bookings")
      .filter((q) => q.eq(q.field("eventDate"), args.eventDate))
      .first();

    if (existingBooking) {
      throw new Error("This date is already booked.");
    }

    const blockedDate = await ctx.db
      .query("blockedDates")
      .withIndex("by_event_date", (q) => q.eq("eventDate", args.eventDate))
      .first();

    if (blockedDate) {
      throw new Error("This date is not available for booking.");
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
    const bookings = await ctx.db.query("bookings").collect();
    const blockedDates = await ctx.db.query("blockedDates").collect();

    const unavailable = new Set<string>();

    for (const booking of bookings) {
      unavailable.add(booking.eventDate);
    }

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
  },
  handler: async (ctx, args) => {
    const existingBlockedDate = await ctx.db
      .query("blockedDates")
      .withIndex("by_event_date", (q) => q.eq("eventDate", args.eventDate))
      .first();

    if (existingBlockedDate) {
      return existingBlockedDate._id;
    }

    const existingBooking = await ctx.db
      .query("bookings")
      .filter((q) => q.eq(q.field("eventDate"), args.eventDate))
      .first();

    if (existingBooking) {
      throw new Error("This date already has a booking.");
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
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});