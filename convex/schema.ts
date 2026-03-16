import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  popupAds: defineTable({
    title: v.string(),
    message: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["active"])
    .index("by_created_at", ["createdAt"]),
  featuredItems: defineTable({
    key: v.string(),
    available: v.boolean(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
  featuredItemImages: defineTable({
    itemKey: v.string(),
    imageIndex: v.number(),
    available: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_item_key", ["itemKey"])
    .index("by_item_image", ["itemKey", "imageIndex"]),
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
});
