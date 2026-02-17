import React from "react"
import { Pressable, Text, TextInput, View } from "react-native"

import { Card } from "@/src/components/card"
import { ScheduleTimePicker } from "@/src/features/schedules/schedule-time-picker"

type CreateScheduleFormProps = {
  onCreate: (args: {
    hour: number
    minute: number
    timezone: string
    notesPerReminder: number
  }) => Promise<void>
}

const MIN_NOTES_PER_REMINDER = 1
const MAX_NOTES_PER_REMINDER = 10

function createDefaultTime() {
  const date = new Date()
  date.setHours(13, 0, 0, 0)
  return date
}

export function CreateScheduleForm({ onCreate }: CreateScheduleFormProps) {
  const [selectedTime, setSelectedTime] = React.useState(createDefaultTime)
  const [notesPerReminderInput, setNotesPerReminderInput] = React.useState("1")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const timezone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )
  const submit = React.useCallback(async () => {
    if (isSubmitting) {
      return
    }

    const notesPerReminder = Number.parseInt(notesPerReminderInput, 10)
    if (
      !Number.isInteger(notesPerReminder) ||
      notesPerReminder < MIN_NOTES_PER_REMINDER ||
      notesPerReminder > MAX_NOTES_PER_REMINDER
    ) {
      setError(
        `Notes per reminder must be between ${MIN_NOTES_PER_REMINDER} and ${MAX_NOTES_PER_REMINDER}.`,
      )
      return
    }

    setError(null)
    try {
      setIsSubmitting(true)
      await onCreate({
        hour: selectedTime.getHours(),
        minute: selectedTime.getMinutes(),
        timezone,
        notesPerReminder,
      })
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add reminder time.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, notesPerReminderInput, onCreate, selectedTime, timezone])

  return (
    <Card>
      <Text style={{ fontSize: 19, fontWeight: "700", color: "#0f172a" }}>
        Reminder Times
      </Text>

      <Text selectable style={{ color: "#334155", lineHeight: 20 }}>
        Add one time or many times. Example: add 09:00 and 18:00 for twice
        daily.
      </Text>

      <ScheduleTimePicker value={selectedTime} onChange={setSelectedTime} />

      <Text selectable style={{ color: "#64748b" }}>
        Timezone: {timezone}
      </Text>

      <View style={{ gap: 6 }}>
        <Text selectable style={{ color: "#334155", fontWeight: "600" }}>
          Notes per reminder ({MIN_NOTES_PER_REMINDER}-{MAX_NOTES_PER_REMINDER})
        </Text>
        <TextInput
          value={notesPerReminderInput}
          onChangeText={(value) => {
            const normalized = value.replace(/[^0-9]/g, "")
            setNotesPerReminderInput(normalized)
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={2}
          placeholder="1"
          placeholderTextColor="#94a3b8"
          style={{
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
            fontWeight: "600",
          }}
        />
      </View>

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
  )
}
