import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { CreateNoteForm, type NotePriority } from "@/src/features/notes/create-note-form";

export default function NoteModalRoute() {
  const createNote = useMutation(api.notes.create);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const onCreate = React.useCallback(
    async ({ content, priority }: { content: string; priority: NotePriority }) => {
      try {
        await createNote({ content, priority });
        setErrorMessage(null);
        router.back();
      } catch (caughtError) {
        setErrorMessage(
          caughtError instanceof Error ? caughtError.message : "Could not save note.",
        );
      }
    },
    [createNote, router],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
        gap: 12,
      }}
    >
      <CreateNoteForm onCreate={onCreate} />

      {errorMessage ? (
        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: "#fef2f2",
            padding: 12,
          }}
        >
          <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
