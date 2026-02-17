import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const priority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    content: v.string(),
    priority,
    isSilenced: v.optional(v.boolean()),
    timesSent: v.number(),
    lastSentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_and_created_at", ["userId", "createdAt"]),

  reminderSchedules: defineTable({
    userId: v.string(),
    hour: v.number(),
    minute: v.number(),
    timezone: v.string(),
    notesPerReminder: v.optional(v.number()),
    enabled: v.boolean(),
    nextRunAt: v.number(),
    lastRunAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_next_run_at", ["nextRunAt"]),

  pushTokens: defineTable({
    userId: v.string(),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    disabled: v.boolean(),
    lastRegisteredAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),
});
