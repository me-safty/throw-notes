import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./helpers/auth";
import { assertValidTimezone, computeNextRunAtMs } from "./lib/time";
import { scheduleValidator } from "./validators";

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
  },
  returns: v.id("reminderSchedules"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    validateHourAndMinute(args.hour, args.minute);

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
