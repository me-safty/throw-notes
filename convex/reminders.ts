import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

type NoteCandidate = {
  _id: Id<"notes">;
  content: string;
  priority: "low" | "medium" | "high";
  timesSent: number;
  lastSentAt?: number;
};

type DeliveryPayload = {
  scheduleId: Id<"reminderSchedules">;
  userId: string;
  tokens: string[];
  notes: NoteCandidate[];
};

function calculateWeight(note: NoteCandidate) {
  const baseWeight = note.priority === "high" ? 6 : note.priority === "medium" ? 3 : 1;
  const sendDecay = 1 / (1 + note.timesSent * 0.6);

  const recencyFactor =
    note.lastSentAt === undefined
      ? 1
      : Math.max(0.15, Math.min(1, (Date.now() - note.lastSentAt) / 86_400_000));

  return baseWeight * sendDecay * recencyFactor;
}

function pickWeightedRandomNote(notes: NoteCandidate[]) {
  if (notes.length === 0) {
    return null;
  }

  const weightedNotes = notes.map((note) => ({
    note,
    weight: calculateWeight(note),
  }));

  const totalWeight = weightedNotes.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    return notes[0] ?? null;
  }

  let cursor = Math.random() * totalWeight;

  for (const item of weightedNotes) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.note;
    }
  }

  return weightedNotes[weightedNotes.length - 1]?.note ?? null;
}

export const deliverReminderForSchedule = internalAction({
  args: {
    scheduleId: v.id("reminderSchedules"),
  },
  returns: v.object({
    delivered: v.boolean(),
    tokenCount: v.number(),
  }),
  handler: async (ctx, args): Promise<{ delivered: boolean; tokenCount: number }> => {
    const payload = (await ctx.runQuery(internal.notifications.loadDeliveryPayload, {
      scheduleId: args.scheduleId,
    })) as DeliveryPayload | null;

    if (!payload || payload.tokens.length === 0 || payload.notes.length === 0) {
      return {
        delivered: false,
        tokenCount: payload?.tokens.length ?? 0,
      };
    }

    const chosenNote = pickWeightedRandomNote(payload.notes);

    if (!chosenNote) {
      return {
        delivered: false,
        tokenCount: payload.tokens.length,
      };
    }

    const messages = payload.tokens.map((token: string) => ({
      to: token,
      title: "Throw Notes",
      body:
        chosenNote.content.length > 180
          ? `${chosenNote.content.slice(0, 177)}...`
          : chosenNote.content,
      sound: "default",
      data: {
        noteId: chosenNote._id,
        scheduleId: payload.scheduleId,
        priority: chosenNote.priority,
      },
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const json = (await response.json()) as {
      data?:
        | {
            status: "ok" | "error";
            details?: { error?: string };
          }
        | Array<{
            status: "ok" | "error";
            details?: { error?: string };
          }>;
    };

    const dataItems = Array.isArray(json.data)
      ? json.data
      : json.data
        ? [json.data]
        : [];

    let successfulDeliveries = 0;
    const invalidTokens: string[] = [];

    for (const [index, dataItem] of dataItems.entries()) {
      if (dataItem.status === "ok") {
        successfulDeliveries += 1;
      }

      if (dataItem.status === "error" && dataItem.details?.error === "DeviceNotRegistered") {
        const token = payload.tokens[index];
        if (token) {
          invalidTokens.push(token);
        }
      }
    }

    if (invalidTokens.length > 0) {
      await ctx.runMutation(internal.pushTokens.disableInvalidTokens, {
        tokens: invalidTokens,
      });
    }

    if (successfulDeliveries > 0) {
      await ctx.runMutation(internal.notifications.recordDeliverySuccess, {
        scheduleId: payload.scheduleId,
        noteId: chosenNote._id,
        deliveredAt: Date.now(),
      });
    }

    return {
      delivered: successfulDeliveries > 0,
      tokenCount: payload.tokens.length,
    };
  },
});
