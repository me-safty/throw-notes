import { Stack } from "expo-router";
import React from "react";

export default function SettingsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Settings", headerLargeTitle: true }} />
    </Stack>
  );
}
