import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { Card } from "@/src/components/card";
import { type NotePriority } from "@/src/features/notes/create-note-form";
import { useRegisterPushToken } from "@/src/hooks/use-register-push-token";

const priorities: NotePriority[] = ["low", "medium", "high"];

function formatLastSent(lastSentAt?: number) {
  if (!lastSentAt) {
    return "Never sent yet";
  }
  return `Last sent ${new Date(lastSentAt).toLocaleString()}`;
}

function priorityPalette(priority: NotePriority) {
  if (priority === "high") {
    return { border: "#fecaca", badge: "#ef4444", text: "#991b1b" };
  }

  if (priority === "medium") {
    return { border: "#fde68a", badge: "#f59e0b", text: "#92400e" };
  }

  return { border: "#bfdbfe", badge: "#3b82f6", text: "#1e3a8a" };
}

export function HomeScreen() {
  const notes = useQuery(api.notes.list, {});
  const updateNote = useMutation(api.notes.update);
  const removeNote = useMutation(api.notes.remove);

  const { isSignedIn } = useAuth();
  const { registrationError } = useRegisterPushToken(Boolean(isSignedIn));

  const highPriorityCount = notes?.filter((note) => note.priority === "high").length ?? 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
        gap: 16,
      }}
    >
      <Card>
        <View
          style={{
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 16,
            gap: 8,
            backgroundColor: "#0f172a",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 23, fontWeight: "700" }}>
            Throw Notes
          </Text>
          <Text selectable style={{ color: "#cbd5e1", lineHeight: 20 }}>
            Use the center plus tab to add notes in a focused modal flow.
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                borderRadius: 12,
                borderCurve: "continuous",
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "rgba(148, 163, 184, 0.2)",
              }}
            >
              <Text
                selectable
                style={{ color: "#e2e8f0", fontWeight: "700", fontVariant: ["tabular-nums"] }}
              >
                Total {notes?.length ?? 0}
              </Text>
            </View>

            <View
              style={{
                borderRadius: 12,
                borderCurve: "continuous",
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "rgba(239, 68, 68, 0.22)",
              }}
            >
              <Text
                selectable
                style={{ color: "#fecaca", fontWeight: "700", fontVariant: ["tabular-nums"] }}
              >
                High {highPriorityCount}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {registrationError ? (
        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 12,
            backgroundColor: "#fef2f2",
          }}
        >
          <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
            Notification setup: {registrationError}
          </Text>
        </View>
      ) : null}

      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>Notes</Text>

        {notes === undefined ? (
          <Text selectable style={{ color: "#64748b" }}>
            Loading notes...
          </Text>
        ) : notes.length === 0 ? (
          <Text selectable style={{ color: "#64748b", lineHeight: 20 }}>
            No notes yet. Tap the center plus tab to create your first note.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {notes.map((note) => {
              const colors = priorityPalette(note.priority);

              return (
                <View
                  key={note._id}
                  style={{
                    borderRadius: 14,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: "#f8fafc",
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <Text selectable style={{ color: "#0f172a", fontSize: 16, lineHeight: 22 }}>
                    {note.content}
                  </Text>

                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {priorities.map((priority) => {
                      const isSelected = note.priority === priority;
                      return (
                        <Pressable
                          key={priority}
                          accessibilityRole="button"
                          onPress={() =>
                            void updateNote({
                              noteId: note._id,
                              content: note.content,
                              priority,
                            })
                          }
                          style={{
                            borderRadius: 10,
                            borderCurve: "continuous",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            backgroundColor: isSelected ? colors.badge : "#e2e8f0",
                          }}
                        >
                          <Text
                            style={{
                              textTransform: "capitalize",
                              color: isSelected ? "#ffffff" : "#334155",
                              fontWeight: "700",
                            }}
                          >
                            {priority}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text
                    selectable
                    style={{
                      color: colors.text,
                      fontSize: 13,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    Sent {note.timesSent} times • {formatLastSent(note.lastSentAt)}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void removeNote({ noteId: note._id })}
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 10,
                      borderCurve: "continuous",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: "#fee2e2",
                    }}
                  >
                    <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Delete</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
