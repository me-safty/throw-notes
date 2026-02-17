import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";
import { computeNextRunAtMs } from "./lib/time";
import { priorityValidator } from "./validators";

const noteCandidateValidator = v.object({
  _id: v.id("notes"),
  content: v.string(),
  priority: priorityValidator,
  timesSent: v.number(),
  lastSentAt: v.optional(v.number()),
});

const deliveryPayloadValidator = v.union(
  v.object({
    scheduleId: v.id("reminderSchedules"),
    userId: v.string(),
    tokens: v.array(v.string()),
    notes: v.array(noteCandidateValidator),
    notesPerReminder: v.number(),
  }),
  v.null(),
);

export const processDueSchedules = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();

    const dueSchedules = await ctx.db
      .query("reminderSchedules")
      .withIndex("by_next_run_at", (q) => q.lte("nextRunAt", now))
      .take(32);

    let enqueued = 0;

    for (const schedule of dueSchedules) {
      const nextRunAt = computeNextRunAtMs({
        hour: schedule.hour,
        minute: schedule.minute,
        timezone: schedule.timezone,
        fromMs: now,
      });

      await ctx.db.patch(schedule._id, {
        nextRunAt,
        updatedAt: now,
      });

      if (!schedule.enabled) {
        continue;
      }

      await ctx.scheduler.runAfter(
        0,
        internal.reminders.deliverReminderForSchedule,
        {
          scheduleId: schedule._id,
        },
      );

      enqueued += 1;
    }

    return enqueued;
  },
});

export const loadDeliveryPayload = internalQuery({
  args: {
    scheduleId: v.id("reminderSchedules"),
  },
  returns: deliveryPayloadValidator,
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);

    if (!schedule || !schedule.enabled) {
      return null;
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user_and_created_at", (q) => q.eq("userId", schedule.userId))
      .take(200);

    const tokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", schedule.userId))
      .collect();

    return {
      scheduleId: schedule._id,
      userId: schedule.userId,
      notesPerReminder: schedule.notesPerReminder ?? 1,
      notes: notes.map((note) => ({
        _id: note._id,
        content: note.content,
        priority: note.priority,
        timesSent: note.timesSent,
        lastSentAt: note.lastSentAt,
      })),
      tokens: tokens.filter((token) => !token.disabled).map((token) => token.token),
    };
  },
});

export const recordDeliverySuccess = internalMutation({
  args: {
    scheduleId: v.id("reminderSchedules"),
    noteIds: v.array(v.id("notes")),
    deliveredAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const noteId of args.noteIds) {
      const note = await ctx.db.get(noteId);

      if (!note) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Note not found during reminder delivery.",
        });
      }

      await ctx.db.patch(note._id, {
        timesSent: note.timesSent + 1,
        lastSentAt: args.deliveredAt,
        updatedAt: args.deliveredAt,
      });
    }

    await ctx.db.patch(args.scheduleId, {
      lastRunAt: args.deliveredAt,
      updatedAt: args.deliveredAt,
    });

    return null;
  },
});
