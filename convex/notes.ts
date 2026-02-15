import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUserId } from "./helpers/auth";
import { noteValidator, priorityValidator } from "./validators";

function validateContent(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new ConvexError({
      code: "INVALID_CONTENT",
      message: "Note content cannot be empty.",
    });
  }

  if (trimmed.length > 1000) {
    throw new ConvexError({
      code: "CONTENT_TOO_LONG",
      message: "Note content must be 1000 characters or less.",
    });
  }

  return trimmed;
}

export const list = query({
  args: {},
  returns: v.array(noteValidator),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    return await ctx.db
      .query("notes")
      .withIndex("by_user_and_created_at", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    priority: priorityValidator,
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const content = validateContent(args.content);

    return await ctx.db.insert("notes", {
      userId,
      content,
      priority: args.priority,
      timesSent: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.string(),
    priority: priorityValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const content = validateContent(args.content);

    const note = await ctx.db.get(args.noteId);

    if (!note || note.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Note not found.",
      });
    }

    await ctx.db.patch(args.noteId, {
      content,
      priority: args.priority,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    noteId: v.id("notes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const note = await ctx.db.get(args.noteId);

    if (!note || note.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Note not found.",
      });
    }

    await ctx.db.delete(args.noteId);
    return null;
  },
});
