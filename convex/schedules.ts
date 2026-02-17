import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./helpers/auth";
import { assertValidTimezone, computeNextRunAtMs } from "./lib/time";
import { scheduleValidator } from "./validators";

const MIN_NOTES_PER_REMINDER = 1;
const MAX_NOTES_PER_REMINDER = 10;

function validateHourAndMinute(hour: number, minute: number) {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new ConvexError({
      code: "INVALID_TIME",
      message: "Hour and minute must be integers.",
    });
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new ConvexError({
      code: "INVALID_TIME",
      message: "Time must be in 24-hour range.",
    });
  }
}

function validateNotesPerReminder(notesPerReminder: number) {
  if (!Number.isInteger(notesPerReminder)) {
    throw new ConvexError({
      code: "INVALID_NOTES_PER_REMINDER",
      message: "Notes per reminder must be an integer.",
    });
  }

  if (notesPerReminder < MIN_NOTES_PER_REMINDER || notesPerReminder > MAX_NOTES_PER_REMINDER) {
    throw new ConvexError({
      code: "INVALID_NOTES_PER_REMINDER",
      message: `Notes per reminder must be between ${MIN_NOTES_PER_REMINDER} and ${MAX_NOTES_PER_REMINDER}.`,
    });
  }
}

export const list = query({
  args: {},
  returns: v.array(scheduleValidator),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const rows = await ctx.db
      .query("reminderSchedules")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    rows.sort((a, b) => {
      if (a.hour !== b.hour) {
        return a.hour - b.hour;
      }
      return a.minute - b.minute;
    });

    return rows;
  },
});

export const create = mutation({
  args: {
    hour: v.number(),
    minute: v.number(),
    timezone: v.string(),
    notesPerReminder: v.optional(v.number()),
  },
  returns: v.id("reminderSchedules"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    validateHourAndMinute(args.hour, args.minute);
    const notesPerReminder = args.notesPerReminder ?? MIN_NOTES_PER_REMINDER;
    validateNotesPerReminder(notesPerReminder);

    try {
      assertValidTimezone(args.timezone);
    } catch {
      throw new ConvexError({
        code: "INVALID_TIMEZONE",
        message: "Timezone is invalid.",
      });
    }

    const now = Date.now();
    const nextRunAt = computeNextRunAtMs({
      hour: args.hour,
      minute: args.minute,
      timezone: args.timezone,
      fromMs: now,
    });

    return await ctx.db.insert("reminderSchedules", {
      userId,
      hour: args.hour,
      minute: args.minute,
      timezone: args.timezone,
      notesPerReminder,
      enabled: true,
      nextRunAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setEnabled = mutation({
  args: {
    scheduleId: v.id("reminderSchedules"),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const schedule = await ctx.db.get(args.scheduleId);

    if (!schedule || schedule.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Schedule not found.",
      });
    }

    const nextRunAt = args.enabled
      ? computeNextRunAtMs({
          hour: schedule.hour,
          minute: schedule.minute,
          timezone: schedule.timezone,
        })
      : schedule.nextRunAt;

    await ctx.db.patch(args.scheduleId, {
      enabled: args.enabled,
      nextRunAt,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const update = mutation({
  args: {
    scheduleId: v.id("reminderSchedules"),
    hour: v.number(),
    minute: v.number(),
    timezone: v.string(),
    notesPerReminder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const schedule = await ctx.db.get(args.scheduleId);

    if (!schedule || schedule.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Schedule not found.",
      });
    }

    validateHourAndMinute(args.hour, args.minute);
    validateNotesPerReminder(args.notesPerReminder);

    try {
      assertValidTimezone(args.timezone);
    } catch {
      throw new ConvexError({
        code: "INVALID_TIMEZONE",
        message: "Timezone is invalid.",
      });
    }

    const now = Date.now();
    const nextRunAt = computeNextRunAtMs({
      hour: args.hour,
      minute: args.minute,
      timezone: args.timezone,
      fromMs: now,
    });

    await ctx.db.patch(args.scheduleId, {
      hour: args.hour,
      minute: args.minute,
      timezone: args.timezone,
      notesPerReminder: args.notesPerReminder,
      nextRunAt,
      updatedAt: now,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    scheduleId: v.id("reminderSchedules"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const schedule = await ctx.db.get(args.scheduleId);

    if (!schedule || schedule.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Schedule not found.",
      });
    }

    await ctx.db.delete(args.scheduleId);
    return null;
  },
});

export const triggerTestReminder = mutation({
  args: {},
  returns: v.id("reminderSchedules"),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const schedules = await ctx.db
      .query("reminderSchedules")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enabledSchedule = schedules
      .filter((schedule) => schedule.enabled)
      .sort((a, b) => a.nextRunAt - b.nextRunAt)[0];

    if (!enabledSchedule) {
      throw new ConvexError({
        code: "NO_ENABLED_SCHEDULE",
        message: "Enable at least one reminder time before sending a test reminder.",
      });
    }

    await ctx.scheduler.runAfter(0, internal.reminders.deliverReminderForSchedule, {
      scheduleId: enabledSchedule._id,
    });

    return enabledSchedule._id;
  },
});
