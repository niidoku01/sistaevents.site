import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { adminSecretArg, validateAdminSecret } from "./admin";

const ADMIN_BOOKINGS_URL = "https://sistaevents.site/admin";
const BOOKINGS_ALERT_EMAIL = process.env.BOOKINGS_ALERT_EMAIL || "niidoku01@gmail.com";
const BOOKINGS_FROM_EMAIL = process.env.BOOKINGS_FROM_EMAIL || "onboarding@resend.dev";

export const sendBookingAlert = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    eventDate: v.string(),
    message: v.string(),
  },
  handler: async (_ctx) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured; skipping email alert.");
      return;
    }

    try {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">A new booking has just been submitted.</h2>
          <a href="${ADMIN_BOOKINGS_URL}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Booking
          </a>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Automated alert from Sistaevents.site.
          </p>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: BOOKINGS_FROM_EMAIL,
          to: [BOOKINGS_ALERT_EMAIL],
          subject: "Sistaevents.site",
          html: htmlBody,
          text: ["A new booking has just been submitted.", "", `View booking: ${ADMIN_BOOKINGS_URL}`].join("\n"),
        }),
      });

      const responseText = await res.text();

      if (!res.ok) {
        console.error("Failed to send booking alert:", {
          status: res.status,
          body: responseText,
        });
      } else {
        console.log(`Booking alert email sent to ${BOOKINGS_ALERT_EMAIL}`);
      }
    } catch (err) {
      console.error("Error sending booking alert:", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  },
});

export const createBooking = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    eventDate: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.name.trim().length < 2 || args.name.trim().length > 100) {
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

    const eventTs = Date.parse(args.eventDate);
    if (eventTs < Date.now() - 86400000) {
      throw new Error("Cannot book a date in the past");
    }

    const blockedDate = await ctx.db
      .query("blockedDates")
      .withIndex("by_event_date", (q) => q.eq("eventDate", args.eventDate))
      .first();

    if (blockedDate) {
      throw new Error("Date is blocked by admin and currently unavailable.");
    }

    const recentDupe = await ctx.db
      .query("bookings")
      .filter((q) =>
        q.and(
          q.eq(q.field("email"), args.email),
          q.eq(q.field("eventDate"), args.eventDate),
          q.gt(q.field("createdAt"), Date.now() - 300000)
        )
      )
      .first();

    if (recentDupe) {
      throw new Error("A booking for this email and date was just submitted. Please wait a moment before trying again.");
    }

    const bookingId = await ctx.db.insert("bookings", {
      name: args.name.trim(),
      email: args.email.trim().toLowerCase(),
      phone: args.phone.trim(),
      eventDate: args.eventDate,
      message: args.message,
      createdAt: Date.now(),
    });

    ctx.scheduler.runAfter(0, api.bookings.sendBookingAlert, args);

    return bookingId;
  },
});

export const getAllBookings = query({
  args: {
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
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
  args: {
    ...adminSecretArg,
  },
  handler: async (ctx, args) => {
    validateAdminSecret(args.secret);
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
