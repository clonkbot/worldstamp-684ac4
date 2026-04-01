import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the current 12-hour window ID
function getCurrentWindowId(): string {
  const now = Date.now();
  const windowStart = Math.floor(now / (12 * 60 * 60 * 1000));
  return `window-${windowStart}`;
}

// Check if user has already posted in current window
export const hasPostedInCurrentWindow = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const windowId = getCurrentWindowId();
    const existingStamp = await ctx.db
      .query("stamps")
      .withIndex("by_user_and_window", (q) =>
        q.eq("userId", userId).eq("windowId", windowId)
      )
      .first();

    return existingStamp !== null;
  },
});

// Get current window info
export const getCurrentWindow = query({
  args: {},
  handler: async () => {
    const now = Date.now();
    const windowDuration = 12 * 60 * 60 * 1000;
    const windowStart = Math.floor(now / windowDuration) * windowDuration;
    const windowEnd = windowStart + windowDuration;
    const timeRemaining = windowEnd - now;

    return {
      windowId: getCurrentWindowId(),
      windowStart,
      windowEnd,
      timeRemaining,
      hoursRemaining: Math.floor(timeRemaining / (60 * 60 * 1000)),
      minutesRemaining: Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000)),
    };
  },
});

// Get all stamps for current window
export const listCurrentWindow = query({
  args: {},
  handler: async (ctx) => {
    const windowId = getCurrentWindowId();
    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_window", (q) => q.eq("windowId", windowId))
      .order("desc")
      .collect();

    return stamps;
  },
});

// Get all stamps (for the globe view)
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const stamps = await ctx.db
      .query("stamps")
      .withIndex("by_created")
      .order("desc")
      .take(500); // Limit to last 500 stamps for performance

    return stamps;
  },
});

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// Create a new stamp
export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    latitude: v.number(),
    longitude: v.number(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const windowId = getCurrentWindowId();

    // Check if user already posted in this window
    const existingStamp = await ctx.db
      .query("stamps")
      .withIndex("by_user_and_window", (q) =>
        q.eq("userId", userId).eq("windowId", windowId)
      )
      .first();

    if (existingStamp) {
      throw new Error("You've already posted in this window! Wait for the next one.");
    }

    // Get the image URL from storage
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Failed to get image URL");

    // Create the stamp
    const stampId = await ctx.db.insert("stamps", {
      userId,
      userName: args.displayName,
      imageUrl,
      storageId: args.storageId,
      latitude: args.latitude,
      longitude: args.longitude,
      createdAt: Date.now(),
      windowId,
    });

    // Update user profile
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        lastStampAt: Date.now(),
        displayName: args.displayName,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        displayName: args.displayName,
        lastStampAt: Date.now(),
      });
    }

    return stampId;
  },
});

// Get stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const windowId = getCurrentWindowId();
    const currentWindowStamps = await ctx.db
      .query("stamps")
      .withIndex("by_window", (q) => q.eq("windowId", windowId))
      .collect();

    const allStamps = await ctx.db
      .query("stamps")
      .withIndex("by_created")
      .collect();

    return {
      currentWindowCount: currentWindowStamps.length,
      totalStamps: allStamps.length,
    };
  },
});
