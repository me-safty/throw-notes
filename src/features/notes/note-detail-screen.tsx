import { useMutation, useQuery } from "convex/react";
import { useNavigation } from "expo-router";
import React from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { type NotePriority } from "@/src/features/notes/create-note-form";
import { PriorityMenu } from "@/src/features/notes/priority-menu";

type NoteDetailScreenProps = {
  noteId?: Id<"notes">;
};

type SaveSnapshot = {
  content: string;
  priority: NotePriority;
};

const AUTOSAVE_DELAY_MS = 700;

function formatNoteDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

export function NoteDetailScreen({ noteId }: NoteDetailScreenProps) {
  const isNewNote = noteId === undefined;
  const initialTimestamp = React.useRef(Date.now());

  const navigation = useNavigation();

  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);

  const [activeNoteId, setActiveNoteId] = React.useState<Id<"notes"> | null>(noteId ?? null);
  const note = useQuery(api.notes.getById, activeNoteId ? { noteId: activeNoteId } : "skip");

  const [content, setContent] = React.useState("");
  const [priority, setPriority] = React.useState<NotePriority>("medium");
  const [hasInitialized, setHasInitialized] = React.useState(isNewNote);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(isNewNote ? Date.now() : null);

  const lastSavedRef = React.useRef<SaveSnapshot | null>(
    isNewNote ? { content: "", priority: "medium" } : null,
  );
  const latestDraftRef = React.useRef<SaveSnapshot>({ content: "", priority: "medium" });
  const isDirtyRef = React.useRef(false);
  const isFlushingRef = React.useRef(false);

  React.useEffect(() => {
    setActiveNoteId(noteId ?? null);
    setContent("");
    setPriority("medium");
    setSaveError(null);
    setLastSavedAt(isNewNote ? Date.now() : null);

    if (isNewNote) {
      const emptySnapshot: SaveSnapshot = { content: "", priority: "medium" };
      setHasInitialized(true);
      lastSavedRef.current = emptySnapshot;
      latestDraftRef.current = emptySnapshot;
      isDirtyRef.current = false;
      isFlushingRef.current = false;
      return;
    }

    setHasInitialized(false);
    lastSavedRef.current = null;
    latestDraftRef.current = { content: "", priority: "medium" };
    isDirtyRef.current = false;
    isFlushingRef.current = false;
  }, [isNewNote, noteId]);

  React.useEffect(() => {
    if (isNewNote || !note || hasInitialized) {
      return;
    }

    const savedSnapshot: SaveSnapshot = {
      content: note.content,
      priority: note.priority,
    };

    setContent(note.content);
    setPriority(note.priority);
    setLastSavedAt(note.updatedAt);

    lastSavedRef.current = savedSnapshot;
    latestDraftRef.current = savedSnapshot;
    isDirtyRef.current = false;
    setHasInitialized(true);
  }, [hasInitialized, isNewNote, note]);

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
        if (activeNoteId) {
          setSaveError("Note content cannot be empty.");
          return false;
        }

        setSaveError(null);
        return true;
      }

      try {
        setSaveError(null);

        if (!activeNoteId) {
          const createdId = await createNote({
            content: next.content,
            priority: next.priority,
          });

          setActiveNoteId(createdId);
          lastSavedRef.current = next;
          latestDraftRef.current = next;
          isDirtyRef.current = false;
          setLastSavedAt(Date.now());

          return true;
        }

        await updateNote({
          noteId: activeNoteId,
          content: next.content,
          priority: next.priority,
        });

        lastSavedRef.current = next;
        latestDraftRef.current = next;
        isDirtyRef.current = false;
        setLastSavedAt(Date.now());

        return true;
      } catch (caughtError) {
        setSaveError(caughtError instanceof Error ? caughtError.message : "Could not auto-save note.");
        return false;
      }
    },
    [activeNoteId, createNote, updateNote],
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

      isFlushingRef.current = true;
      void saveDraft(latestDraftRef.current).finally(() => {
        isFlushingRef.current = false;
      });
    });

    return unsubscribe;
  }, [navigation, saveDraft]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: isNewNote ? "New Note" : "Note",
      headerLargeTitle: false,
      headerStyle: {
        backgroundColor: "#f4f4f6",
      },
      headerShadowVisible: false,
      contentStyle: {
        backgroundColor: "#f4f4f6",
      },
      headerRight: () => (
        <PriorityMenu disabled={!hasInitialized} value={priority} onChange={(next) => setPriority(next)} />
      ),
    });
  }, [hasInitialized, isNewNote, navigation, priority]);

  if (!isNewNote && note === undefined && !hasInitialized) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#f4f4f6" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18 }}
      >
        <Text selectable style={{ color: "#6b7280" }}>
          Loading note...
        </Text>
      </ScrollView>
    );
  }

  if (!isNewNote && note === null && !hasInitialized) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#f4f4f6" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, gap: 8 }}
      >
        <Text selectable style={{ color: "#111827", fontSize: 20, fontWeight: "700" }}>
          Note not found
        </Text>
        <Text selectable style={{ color: "#6b7280" }}>
          This note may have been deleted.
        </Text>
      </ScrollView>
    );
  }

  const dateLabel = formatNoteDate(lastSavedAt ?? initialTimestamp.current);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: "#f4f4f6" }}
      keyboardDismissMode="interactive"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 28,
      }}
    >
      <Text
        selectable
        style={{
          alignSelf: "center",
          color: "#8b8f97",
          fontSize: 18,
          marginBottom: 12,
          fontVariant: ["tabular-nums"],
        }}
      >
        {dateLabel}
      </Text>

      {saveError ? (
        <View
          style={{
            borderRadius: 10,
            borderCurve: "continuous",
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: "#fef2f2",
            marginBottom: 10,
          }}
        >
          <Text selectable style={{ color: "#b91c1c" }}>
            {saveError}
          </Text>
        </View>
      ) : null}

      <TextInput
        multiline
        autoFocus
        placeholder="Start writing"
        placeholderTextColor="#a1a1aa"
        value={content}
        onChangeText={setContent}
        style={{
          flexGrow: 1,
          minHeight: 260,
          fontSize: 24,
          lineHeight: 34,
          color: "#3f3f46",
          textAlignVertical: "top",
          padding: 0,
        }}
      />
    </ScrollView>
  );
}
