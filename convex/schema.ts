import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bookings: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    eventDate: v.string(),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_email", ["email"]),
  blockedDates: defineTable({
    eventDate: v.string(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_event_date", ["eventDate"])
    .index("by_created_at", ["createdAt"]),
  reviews: defineTable({
    name: v.string(),
    email: v.string(),
    event: v.string(),
    content: v.string(),
    rating: v.number(),
    approved: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_approved", ["approved"])
    .index("by_created_at", ["createdAt"]),
  popupAds: defineTable({
    title: v.string(),
    message: v.string(),
    imageUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    isActive: v.boolean(),
    startsAt: v.optional(v.number()), // unix ms
    endsAt: v.optional(v.number()),   // unix ms
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"]),
});
