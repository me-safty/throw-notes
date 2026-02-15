import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/src/components/card";

type CreateScheduleFormProps = {
  onCreate: (args: { hour: number; minute: number; timezone: string }) => Promise<void>;
};

function parseTimeInput(timeInput: string) {
  const match = timeInput.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return null;
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

export function CreateScheduleForm({ onCreate }: CreateScheduleFormProps) {
  const [timeInput, setTimeInput] = React.useState("13:00");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const timezone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const submit = React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const parsed = parseTimeInput(timeInput);
    if (!parsed) {
      setError("Use 24-hour format HH:MM, for example 08:30 or 21:15.");
      return;
    }

    setError(null);
    try {
      setIsSubmitting(true);
      await onCreate({ ...parsed, timezone });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add reminder time.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onCreate, timeInput, timezone]);

  return (
    <Card>
      <Text style={{ fontSize: 19, fontWeight: "700", color: "#0f172a" }}>
        Reminder Times
      </Text>

      <Text selectable style={{ color: "#334155", lineHeight: 20 }}>
        Add one time or many times. Example: add 09:00 and 18:00 for twice daily.
      </Text>

      <View style={{ gap: 8 }}>
        <Text style={{ color: "#334155", fontWeight: "600" }}>Time (HH:MM)</Text>
        <TextInput
          value={timeInput}
          onChangeText={setTimeInput}
          placeholder="13:00"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            borderRadius: 14,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#cbd5e1",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontSize: 16,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
      </View>

      <Text selectable style={{ color: "#64748b" }}>
        Timezone: {timezone}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={submit}
        style={{
          borderRadius: 14,
          borderCurve: "continuous",
          backgroundColor: isSubmitting ? "#64748b" : "#2563eb",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        <Text style={{ fontWeight: "700", color: "#ffffff", fontSize: 16 }}>
          {isSubmitting ? "Adding..." : "Add Reminder Time"}
        </Text>
      </Pressable>

      {error ? (
        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: "#fef2f2",
            padding: 12,
          }}
        >
          <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
            {error}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
