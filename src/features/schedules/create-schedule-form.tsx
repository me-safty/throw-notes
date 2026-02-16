import React from "react"
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker"
import { requireNativeModule } from "expo-modules-core"
import { Pressable, Text, View } from "react-native"

import { Card } from "@/src/components/card"

type CreateScheduleFormProps = {
  onCreate: (args: {
    hour: number
    minute: number
    timezone: string
  }) => Promise<void>
}

type ExpoUIDateTimePickerProps = {
  initialDate: string
  displayedComponents: "hourAndMinute"
  variant?: "compact" | "input"
  is24Hour?: boolean
  style?: object
  onDateSelected: (picked: Date) => void
}

type ExpoUIDateTimePickerComponent =
  React.ComponentType<ExpoUIDateTimePickerProps>
type ExpoUIHostComponent = React.ComponentType<{
  children?: React.ReactNode
  matchContents?: boolean
  style?: object
}>
type IOSDateTimePickerBundle = {
  DateTimePicker: ExpoUIDateTimePickerComponent
  Host: ExpoUIHostComponent
}

function hasExpoUINativeModule() {
  try {
    requireNativeModule("ExpoUI")
    return true
  } catch {
    return false
  }
}

function getIOSDateTimePickerBundle() {
  try {
    const module = require("@expo/ui/swift-ui") as {
      DateTimePicker?: ExpoUIDateTimePickerComponent
      Host?: ExpoUIHostComponent
    }

    if (!module.DateTimePicker || !module.Host) {
      return null
    }

    return {
      DateTimePicker: module.DateTimePicker,
      Host: module.Host,
    } as IOSDateTimePickerBundle
  } catch {
    return null
  }
}

function getAndroidDateTimePicker() {
  try {
    return require("@expo/ui/jetpack-compose")
      .DateTimePicker as ExpoUIDateTimePickerComponent
  } catch {
    return null
  }
}

function createDefaultTime() {
  const date = new Date()
  date.setHours(13, 0, 0, 0)
  return date
}

function formatTime24Hour(date: Date) {
  const hour = date.getHours().toString().padStart(2, "0")
  const minute = date.getMinutes().toString().padStart(2, "0")
  return `${hour}:${minute}`
}

export function CreateScheduleForm({ onCreate }: CreateScheduleFormProps) {
  const isIOS = process.env.EXPO_OS === "ios"
  const hasExpoUI = React.useMemo(() => hasExpoUINativeModule(), [])
  const iosDateTimePickerBundle = React.useMemo(
    () => (hasExpoUI && isIOS ? getIOSDateTimePickerBundle() : null),
    [hasExpoUI, isIOS],
  )
  const AndroidDateTimePicker = React.useMemo(
    () => (hasExpoUI && !isIOS ? getAndroidDateTimePicker() : null),
    [hasExpoUI, isIOS],
  )
  const IOSDateTimePicker = iosDateTimePickerBundle?.DateTimePicker ?? null
  const IOSHost = iosDateTimePickerBundle?.Host ?? null
  const isExpoUIReady = isIOS
    ? Boolean(IOSDateTimePicker && IOSHost)
    : Boolean(AndroidDateTimePicker)
  const [selectedTime, setSelectedTime] = React.useState(createDefaultTime)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const timezone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )
  const displayTime = React.useMemo(
    () => formatTime24Hour(selectedTime),
    [selectedTime],
  )

  const onDateSelected = React.useCallback((picked: Date) => {
    setSelectedTime((previous) => {
      const updated = new Date(previous)
      updated.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
      return updated
    })
  }, [])
  const onFallbackDateSelected = React.useCallback(
    (event: DateTimePickerEvent, picked?: Date) => {
      if (event.type !== "set" || !picked) {
        return
      }
      onDateSelected(picked)
    },
    [onDateSelected],
  )

  const initialPickerDate = React.useMemo(() => {
    const date = new Date()
    date.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0)
    return date.toISOString()
  }, [selectedTime])

  const submit = React.useCallback(async () => {
    if (isSubmitting) {
      return
    }

    setError(null)
    try {
      setIsSubmitting(true)
      await onCreate({
        hour: selectedTime.getHours(),
        minute: selectedTime.getMinutes(),
        timezone,
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
  }, [isSubmitting, onCreate, selectedTime, timezone])

  return (
    <Card>
      <Text style={{ fontSize: 19, fontWeight: "700", color: "#0f172a" }}>
        Reminder Times
      </Text>

      <Text selectable style={{ color: "#334155", lineHeight: 20 }}>
        Add one time or many times. Example: add 09:00 and 18:00 for twice
        daily.
      </Text>

      <View className="flex items-center justify-center" style={{ gap: 8 }}>
        {/* <View
          style={{
            borderRadius: 14,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#cbd5e1",
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              color: "#0f172a",
              fontSize: 16,
              fontWeight: "600",
              fontVariant: ["tabular-nums"],
            }}
          >
            {displayTime}
          </Text>
        </View> */}

        {isIOS && IOSDateTimePicker && IOSHost ? (
          <IOSHost matchContents style={{ minWidth: 12, minHeight: 12 }}>
            <IOSDateTimePicker
              initialDate={initialPickerDate}
              displayedComponents="hourAndMinute"
              variant="compact"
              onDateSelected={onDateSelected}
            />
          </IOSHost>
        ) : null}

        {!isIOS && AndroidDateTimePicker ? (
          <AndroidDateTimePicker
            initialDate={initialPickerDate}
            displayedComponents="hourAndMinute"
            variant="input"
            is24Hour
            style={{ minWidth: 12, minHeight: 12 }}
            onDateSelected={onDateSelected}
          />
        ) : null}

        {!isExpoUIReady ? (
          <DateTimePicker
            mode="time"
            value={selectedTime}
            display={isIOS ? "compact" : "default"}
            is24Hour
            onChange={onFallbackDateSelected}
          />
        ) : null}
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
  )
}
