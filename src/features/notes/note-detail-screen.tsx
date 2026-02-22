import { useMutation, useQuery } from "convex/react";
import { useNavigation } from "expo-router";
import React from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { Card } from "@/src/components/card";
import { PriorityMenu } from "@/src/features/notes/priority-menu";
import { type NotePriority } from "@/src/features/notes/create-note-form";

type NoteDetailScreenProps = {
  noteId: Id<"notes">;
};

type SaveSnapshot = {
  content: string;
  priority: NotePriority;
};

const AUTOSAVE_DELAY_MS = 700;

export function NoteDetailScreen({ noteId }: NoteDetailScreenProps) {
  const note = useQuery(api.notes.getById, { noteId });
  const updateNote = useMutation(api.notes.update);
  const navigation = useNavigation();

  const [content, setContent] = React.useState("");
  const [priority, setPriority] = React.useState<NotePriority>("medium");
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const lastSavedRef = React.useRef<SaveSnapshot | null>(null);
  const latestDraftRef = React.useRef<SaveSnapshot>({ content: "", priority: "medium" });
  const isDirtyRef = React.useRef(false);
  const isFlushingRef = React.useRef(false);

  React.useEffect(() => {
    setContent("");
    setPriority("medium");
    setHasInitialized(false);
    setSaveState("idle");
    setSaveError(null);
    lastSavedRef.current = null;
    latestDraftRef.current = { content: "", priority: "medium" };
    isDirtyRef.current = false;
    isFlushingRef.current = false;
  }, [noteId]);

  React.useEffect(() => {
    if (!note || hasInitialized) {
      return;
    }

    setContent(note.content);
    setPriority(note.priority);
    lastSavedRef.current = {
      content: note.content,
      priority: note.priority,
    };
    latestDraftRef.current = {
      content: note.content,
      priority: note.priority,
    };
    isDirtyRef.current = false;
    setHasInitialized(true);
  }, [hasInitialized, note]);

  const snapshot = React.useMemo<SaveSnapshot>(
    () => ({
      content: content.trim(),
      priority,
    }),
    [content, priority],
  );

  React.useEffect(() => {
    latestDraftRef.current = snapshot;

    const lastSaved = lastSavedRef.current;
    isDirtyRef.current = Boolean(
      hasInitialized &&
        lastSaved &&
        (snapshot.content !== lastSaved.content || snapshot.priority !== lastSaved.priority),
    );
  }, [hasInitialized, snapshot]);

  const saveDraft = React.useCallback(
    async (next: SaveSnapshot) => {
      if (!next.content) {
        setSaveState("error");
        setSaveError("Note content cannot be empty.");
        return false;
      }

      try {
        setSaveState("saving");
        setSaveError(null);
        await updateNote({
          noteId,
          content: next.content,
          priority: next.priority,
        });

        lastSavedRef.current = next;
        isDirtyRef.current = false;
        setSaveState("saved");
        return true;
      } catch (caughtError) {
        setSaveState("error");
        setSaveError(caughtError instanceof Error ? caughtError.message : "Could not auto-save note.");
        return false;
      }
    },
    [noteId, updateNote],
  );

  React.useEffect(() => {
    if (!hasInitialized || !isDirtyRef.current || isFlushingRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      void saveDraft(latestDraftRef.current);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [hasInitialized, saveDraft, snapshot]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (!isDirtyRef.current || isFlushingRef.current) {
        return;
      }

      event.preventDefault();

      void (async () => {
        isFlushingRef.current = true;
        await saveDraft(latestDraftRef.current);
        isFlushingRef.current = false;
        navigation.dispatch(event.data.action);
      })();
    });

    return unsubscribe;
  }, [navigation, saveDraft]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "Note",
      headerRight: () => (
        <PriorityMenu disabled={!hasInitialized} value={priority} onChange={(next) => setPriority(next)} />
      ),
    });
  }, [hasInitialized, navigation, priority]);

  const saveMessage =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? saveError ?? "Could not auto-save note."
          : "Changes save automatically.";

  if (note === undefined && !hasInitialized) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <Card>
          <Text selectable style={{ color: "#64748b", lineHeight: 20 }}>
            Loading note...
          </Text>
        </Card>
      </ScrollView>
    );
  }

  if (note === null && !hasInitialized) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <Card>
          <Text selectable style={{ color: "#0f172a", fontWeight: "700", fontSize: 18 }}>
            Note not found
          </Text>
          <Text selectable style={{ color: "#64748b", lineHeight: 20 }}>
            This note may have been deleted.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 36 }}
    >
      <Card>
        <TextInput
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
          placeholder="Write your note"
          style={{
            minHeight: 220,
            borderRadius: 14,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "#cbd5e1",
            padding: 12,
            fontSize: 17,
            color: "#0f172a",
            lineHeight: 24,
            textAlignVertical: "top",
            backgroundColor: "#ffffff",
          }}
        />

        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: saveState === "error" ? "#fef2f2" : "#f1f5f9",
          }}
        >
          <Text
            selectable
            style={{
              color: saveState === "error" ? "#b91c1c" : "#334155",
              fontWeight: "600",
            }}
          >
            {saveMessage}
          </Text>
        </View>

        <Text selectable style={{ color: "#64748b", fontSize: 13 }}>
          Priority: {priority}
        </Text>
      </Card>
    </ScrollView>
  );
}
