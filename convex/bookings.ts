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

export const deleteBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});