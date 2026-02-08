import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  images: defineTable({
    storageId: v.id("_storage"),
    filename: v.string(),
    originalName: v.string(),
    size: v.number(),
    contentType: v.string(),
    uploadedAt: v.number(),
    order: v.optional(v.number()),
    category: v.optional(v.union(v.literal("weddings"), v.literal("funerals"), v.literal("corporate"))),
  })
    .index("by_order", ["order"])
    .index("by_category", ["category"]),
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
});
