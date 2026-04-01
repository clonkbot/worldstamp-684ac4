import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  stamps: defineTable({
    userId: v.id("users"),
    userName: v.optional(v.string()),
    imageUrl: v.string(),
    storageId: v.id("_storage"),
    latitude: v.number(),
    longitude: v.number(),
    createdAt: v.number(),
    windowId: v.string(), // Unique ID for each 12-hour window
  })
    .index("by_window", ["windowId"])
    .index("by_user_and_window", ["userId", "windowId"])
    .index("by_created", ["createdAt"]),
  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    lastStampAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
});
