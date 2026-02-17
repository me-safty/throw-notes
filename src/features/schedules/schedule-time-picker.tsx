import React from "react";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { requireNativeModule } from "expo-modules-core";
import { View } from "react-native";

type ExpoUIDateTimePickerProps = {
  initialDate: string;
  displayedComponents: "hourAndMinute";
  variant?: "compact" | "input";
  is24Hour?: boolean;
  style?: object;
  onDateSelected: (picked: Date) => void;
};

type ExpoUIDateTimePickerComponent = React.ComponentType<ExpoUIDateTimePickerProps>;
type ExpoUIHostComponent = React.ComponentType<{
  children?: React.ReactNode;
  matchContents?: boolean;
  style?: object;
}>;
type IOSDateTimePickerBundle = {
  DateTimePicker: ExpoUIDateTimePickerComponent;
  Host: ExpoUIHostComponent;
};

function hasExpoUINativeModule() {
  try {
    requireNativeModule("ExpoUI");
    return true;
  } catch {
    return false;
  }
}

function getIOSDateTimePickerBundle() {
  try {
    const module = require("@expo/ui/swift-ui") as {
      DateTimePicker?: ExpoUIDateTimePickerComponent;
      Host?: ExpoUIHostComponent;
    };

    if (!module.DateTimePicker || !module.Host) {
      return null;
    }

    return {
      DateTimePicker: module.DateTimePicker,
      Host: module.Host,
    } as IOSDateTimePickerBundle;
  } catch {
    return null;
  }
}

function getAndroidDateTimePicker() {
  try {
    return require("@expo/ui/jetpack-compose").DateTimePicker as ExpoUIDateTimePickerComponent;
  } catch {
    return null;
  }
}

type ScheduleTimePickerProps = {
  value: Date;
  onChange: (next: Date) => void;
};

export function ScheduleTimePicker({ value, onChange }: ScheduleTimePickerProps) {
  const isIOS = process.env.EXPO_OS === "ios";
  const hasExpoUI = React.useMemo(() => hasExpoUINativeModule(), []);
  const iosDateTimePickerBundle = React.useMemo(
    () => (hasExpoUI && isIOS ? getIOSDateTimePickerBundle() : null),
    [hasExpoUI, isIOS],
  );
  const AndroidDateTimePicker = React.useMemo(
    () => (hasExpoUI && !isIOS ? getAndroidDateTimePicker() : null),
    [hasExpoUI, isIOS],
  );
  const IOSDateTimePicker = iosDateTimePickerBundle?.DateTimePicker ?? null;
  const IOSHost = iosDateTimePickerBundle?.Host ?? null;
  const isExpoUIReady = isIOS
    ? Boolean(IOSDateTimePicker && IOSHost)
    : Boolean(AndroidDateTimePicker);

  const onDateSelected = React.useCallback(
    (picked: Date) => {
      const updated = new Date(value);
      updated.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      onChange(updated);
    },
    [onChange, value],
  );

  const onFallbackDateSelected = React.useCallback(
    (event: DateTimePickerEvent, picked?: Date) => {
      if (event.type !== "set" || !picked) {
        return;
      }

      onDateSelected(picked);
    },
    [onDateSelected],
  );

  const initialPickerDate = React.useMemo(() => {
    const date = new Date();
    date.setHours(value.getHours(), value.getMinutes(), 0, 0);
    return date.toISOString();
  }, [value]);

  return (
    <View className="flex items-center justify-center" style={{ gap: 8 }}>
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
          value={value}
          display={isIOS ? "compact" : "default"}
          is24Hour
          onChange={onFallbackDateSelected}
        />
      ) : null}
    </View>
  );
}
