import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { Card } from "@/src/components/card";
import { CreateScheduleForm } from "@/src/features/schedules/create-schedule-form";

function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function SettingsScreen() {
  const schedules = useQuery(api.schedules.list, {});
  const createSchedule = useMutation(api.schedules.create);
  const setScheduleEnabled = useMutation(api.schedules.setEnabled);
  const removeSchedule = useMutation(api.schedules.remove);
  const triggerTestReminder = useMutation(api.schedules.triggerTestReminder);

  const { signOut } = useAuth();

  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSendingTestReminder, setIsSendingTestReminder] = React.useState(false);

  const onCreateSchedule = React.useCallback(
    async ({
      hour,
      minute,
      timezone,
      notesPerReminder,
    }: {
      hour: number;
      minute: number;
      timezone: string;
      notesPerReminder: number;
    }) => {
      try {
        setErrorMessage(null);
        await createSchedule({ hour, minute, timezone, notesPerReminder });
        setStatusMessage("Reminder schedule added.");
      } catch (caughtError) {
        setErrorMessage(
          caughtError instanceof Error ? caughtError.message : "Unable to create schedule.",
        );
      }
    },
    [createSchedule],
  );

  const onTriggerTestReminder = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      setStatusMessage(null);
      setIsSendingTestReminder(true);
      await triggerTestReminder({});
      setStatusMessage("Test reminder queued. You should get a push notification shortly.");
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error ? caughtError.message : "Unable to send test reminder.",
      );
    } finally {
      setIsSendingTestReminder(false);
    }
  }, [triggerTestReminder]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
        gap: 16,
      }}
    >
      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>Account</Text>
        <Text selectable style={{ color: "#475569", lineHeight: 20 }}>
          Manage reminders and sign out from this device.
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

      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>Test Push</Text>
        <Text selectable style={{ color: "#475569", lineHeight: 20 }}>
          Trigger a test reminder now using your existing random note selection.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => void onTriggerTestReminder()}
          disabled={isSendingTestReminder}
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 10,
            alignItems: "center",
            backgroundColor: isSendingTestReminder ? "#cbd5e1" : "#dbeafe",
          }}
        >
          <Text style={{ color: "#1e3a8a", fontWeight: "700" }}>
            {isSendingTestReminder ? "Sending..." : "Send Test Reminder"}
          </Text>
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

      {errorMessage ? (
        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 12,
            backgroundColor: "#fef2f2",
          }}
        >
          <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <CreateScheduleForm onCreate={onCreateSchedule} />

      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
          Active Reminder Times
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
                  {formatTime(schedule.hour, schedule.minute)} ({schedule.timezone}, 24h)
                </Text>
                <Text selectable style={{ color: "#64748b", fontSize: 13 }}>
                  Next run {new Date(schedule.nextRunAt).toLocaleString()}
                </Text>
                <Text selectable style={{ color: "#64748b", fontSize: 13 }}>
                  Sends {schedule.notesPerReminder ?? 1} note
                  {(schedule.notesPerReminder ?? 1) === 1 ? "" : "s"} per reminder
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
    </ScrollView>
  );
}
