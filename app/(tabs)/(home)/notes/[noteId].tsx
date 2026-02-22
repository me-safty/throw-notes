import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";

import { type Id } from "@/convex/_generated/dataModel";
import { NoteDetailScreen } from "@/src/features/notes/note-detail-screen";

export default function NoteDetailRoute() {
  const params = useLocalSearchParams<{ noteId?: string | string[] }>();
  const rawNoteId = Array.isArray(params.noteId) ? params.noteId[0] : params.noteId;

  if (!rawNoteId) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
          Invalid note link.
        </Text>
      </ScrollView>
    );
  }

  return <NoteDetailScreen noteId={rawNoteId as Id<"notes">} />;
}
