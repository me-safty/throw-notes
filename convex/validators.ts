import { v } from "convex/values";

export const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

export const noteValidator = v.object({
  _id: v.id("notes"),
  _creationTime: v.number(),
  userId: v.string(),
  content: v.string(),
  priority: priorityValidator,
  timesSent: v.number(),
  lastSentAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const scheduleValidator = v.object({
  _id: v.id("reminderSchedules"),
  _creationTime: v.number(),
  userId: v.string(),
  hour: v.number(),
  minute: v.number(),
  timezone: v.string(),
  enabled: v.boolean(),
  nextRunAt: v.number(),
  lastRunAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});
