import { ConvexError, v } from "convex/values";

import { internalMutation, mutation } from "./_generated/server";
import { requireUserId } from "./helpers/auth";

export const upsertMyPushToken = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    if (!args.token.startsWith("ExponentPushToken[") && !args.token.startsWith("ExpoPushToken[")) {
      throw new ConvexError({
        code: "INVALID_TOKEN",
        message: "Token is not a valid Expo push token.",
      });
    }

    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        platform: args.platform,
        disabled: false,
        lastRegisteredAt: now,
      });
      return null;
    }

    await ctx.db.insert("pushTokens", {
      userId,
      token: args.token,
      platform: args.platform,
      disabled: false,
      lastRegisteredAt: now,
    });

    return null;
  },
});

export const disableInvalidTokens = internalMutation({
  args: {
    tokens: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const token of args.tokens) {
      const row = await ctx.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();

      if (row && !row.disabled) {
        await ctx.db.patch(row._id, { disabled: true });
      }
    }

    return null;
  },
});
