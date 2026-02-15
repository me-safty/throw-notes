import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { Card } from "@/src/components/card";
import { CreateNoteForm, type NotePriority } from "@/src/features/notes/create-note-form";
import { CreateScheduleForm } from "@/src/features/schedules/create-schedule-form";
import { useRegisterPushToken } from "@/src/hooks/use-register-push-token";

const priorities: NotePriority[] = ["low", "medium", "high"];

function formatTime(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatLastSent(lastSentAt?: number) {
  if (!lastSentAt) {
    return "Never sent yet";
  }
  return `Last sent ${new Date(lastSentAt).toLocaleString()}`;
}

export function HomeScreen() {
  const notes = useQuery(api.notes.list, {});
  const schedules = useQuery(api.schedules.list, {});

  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);
  const removeNote = useMutation(api.notes.remove);

  const createSchedule = useMutation(api.schedules.create);
  const setScheduleEnabled = useMutation(api.schedules.setEnabled);
  const removeSchedule = useMutation(api.schedules.remove);

  const { signOut, isSignedIn } = useAuth();
  const { registrationError } = useRegisterPushToken(Boolean(isSignedIn));

  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const onCreateNote = React.useCallback(
    async ({ content, priority }: { content: string; priority: NotePriority }) => {
      await createNote({ content, priority });
      setStatusMessage("Note saved.");
    },
    [createNote],
  );

  const onCreateSchedule = React.useCallback(
    async ({ hour, minute, timezone }: { hour: number; minute: number; timezone: string }) => {
      await createSchedule({ hour, minute, timezone });
      setStatusMessage("Reminder time added.");
    },
    [createSchedule],
  );

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#0f172a" }}>
          Your Reminder Engine
        </Text>
        <Text selectable style={{ fontSize: 15, lineHeight: 21, color: "#475569" }}>
          High-priority notes are selected more often. Notes sent recently are down-weighted.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 10,
            alignItems: "center",
            backgroundColor: "#f1f5f9",
          }}
        >
          <Text style={{ color: "#0f172a", fontWeight: "700" }}>Sign Out</Text>
        </Pressable>
      </Card>

      {statusMessage ? (
        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 12,
            backgroundColor: "#f0fdf4",
          }}
        >
          <Text selectable style={{ color: "#166534" }}>
            {statusMessage}
          </Text>
        </View>
      ) : null}

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

      <CreateNoteForm onCreate={onCreateNote} />

      <Card>
        <Text style={{ fontSize: 19, fontWeight: "700", color: "#0f172a" }}>
          Notes
        </Text>

        {notes === undefined ? (
          <Text selectable style={{ color: "#64748b" }}>
            Loading notes...
          </Text>
        ) : notes.length === 0 ? (
          <Text selectable style={{ color: "#64748b" }}>
            No notes yet.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {notes.map((note) => (
              <View
                key={note._id}
                style={{
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#dbeafe",
                  backgroundColor: "#f8fafc",
                  padding: 12,
                  gap: 10,
                }}
              >
                <Text selectable style={{ color: "#0f172a", fontSize: 16, lineHeight: 22 }}>
                  {note.content}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
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
                          backgroundColor: isSelected ? "#0f172a" : "#e2e8f0",
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

                <Text selectable style={{ color: "#64748b", fontSize: 13 }}>
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
            ))}
          </View>
        )}
      </Card>

      <CreateScheduleForm onCreate={onCreateSchedule} />

      <Card>
        <Text style={{ fontSize: 19, fontWeight: "700", color: "#0f172a" }}>
          Active Schedules
        </Text>

        {schedules === undefined ? (
          <Text selectable style={{ color: "#64748b" }}>
            Loading schedules...
          </Text>
        ) : schedules.length === 0 ? (
          <Text selectable style={{ color: "#64748b" }}>
            No reminder times yet.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {schedules.map((schedule) => (
              <View
                key={schedule._id}
                style={{
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: "#dbeafe",
                  backgroundColor: "#f8fafc",
                  padding: 12,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                  {formatTime(schedule.hour, schedule.minute)} ({schedule.timezone})
                </Text>
                <Text selectable style={{ color: "#64748b", fontSize: 13 }}>
                  Next run {new Date(schedule.nextRunAt).toLocaleString()}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      void setScheduleEnabled({
                        scheduleId: schedule._id,
                        enabled: !schedule.enabled,
                      })
                    }
                    style={{
                      borderRadius: 10,
                      borderCurve: "continuous",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: schedule.enabled ? "#dcfce7" : "#e2e8f0",
                    }}
                  >
                    <Text
                      style={{
                        color: schedule.enabled ? "#166534" : "#334155",
                        fontWeight: "700",
                      }}
                    >
                      {schedule.enabled ? "Enabled" : "Disabled"}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void removeSchedule({ scheduleId: schedule._id })}
                    style={{
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
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}
