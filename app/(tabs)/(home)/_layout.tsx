import { Stack } from "expo-router";
import React from "react";

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Notes", headerLargeTitle: true }} />
      <Stack.Screen name="notes/new" options={{ title: "New Note", headerLargeTitle: false }} />
      <Stack.Screen name="notes/[noteId]" options={{ title: "Note", headerLargeTitle: false }} />
    </Stack>
  );
}
