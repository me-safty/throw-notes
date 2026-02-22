import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import Constants from "expo-constants";
import React from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { Card } from "@/src/components/card";
import { type NotePriority } from "@/src/features/notes/create-note-form";
import { useRegisterPushToken } from "@/src/hooks/use-register-push-token";

const priorities: NotePriority[] = ["low", "medium", "high"];

function formatLastSent(lastSentAt?: number) {
  if (!lastSentAt) {
    return "Never sent yet";
  }
  return `Last sent ${new Date(lastSentAt).toLocaleString()}`;
}

function priorityPalette(priority: NotePriority) {
  if (priority === "high") {
    return { border: "#fecaca", badge: "#ef4444", text: "#991b1b" };
  }

  if (priority === "medium") {
    return { border: "#fde68a", badge: "#f59e0b", text: "#92400e" };
  }

  return { border: "#bfdbfe", badge: "#3b82f6", text: "#1e3a8a" };
}

export function HomeScreen() {
  const notes = useQuery(api.notes.list, {});
  const updateNote = useMutation(api.notes.update);
  const removeNote = useMutation(api.notes.remove);
  const isExpoGo = Constants.appOwnership === "expo";
  const [editingNoteId, setEditingNoteId] = React.useState<Id<"notes"> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<Id<"notes"> | null>(null);
  const [draftContent, setDraftContent] = React.useState("");
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const { isSignedIn } = useAuth();
  const { registrationError } = useRegisterPushToken(Boolean(isSignedIn));

  const highPriorityCount = notes?.filter((note) => note.priority === "high").length ?? 0;
  const startEditing = React.useCallback((noteId: Id<"notes">, content: string) => {
    setEditingNoteId(noteId);
    setDraftContent(content);
    setEditError(null);
  }, []);

  const cancelEditing = React.useCallback(() => {
    setEditingNoteId(null);
    setDraftContent("");
    setEditError(null);
  }, []);

  const saveEdit = React.useCallback(
    async (noteId: Id<"notes">, priority: NotePriority) => {
      const trimmedContent = draftContent.trim();

      if (!trimmedContent || isSavingEdit) {
        return;
      }

      try {
        setIsSavingEdit(true);
        setEditError(null);
        await updateNote({
          noteId,
          content: trimmedContent,
          priority,
        });
        setEditingNoteId(null);
        setDraftContent("");
      } catch (caughtError) {
        setEditError(caughtError instanceof Error ? caughtError.message : "Could not update note.");
      } finally {
        setIsSavingEdit(false);
      }
    },
    [draftContent, isSavingEdit, updateNote],
  );

  const requestDelete = React.useCallback(
    (noteId: Id<"notes">) => {
      if (isExpoGo) {
        setPendingDeleteId(noteId);
        return;
      }

      Alert.alert("Delete note?", "This action cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void removeNote({ noteId }),
        },
      ]);
    },
    [isExpoGo, removeNote],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
        gap: 16,
      }}
    >
      <Card>
        <View
          style={{
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 16,
            gap: 8,
            backgroundColor: "#0f172a",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 23, fontWeight: "700" }}>
            Throw Notes
          </Text>
          <Text selectable style={{ color: "#cbd5e1", lineHeight: 20 }}>
            Use the center plus tab to add notes in a focused modal flow.
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                borderRadius: 12,
                borderCurve: "continuous",
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "rgba(148, 163, 184, 0.2)",
              }}
            >
              <Text
                selectable
                style={{ color: "#e2e8f0", fontWeight: "700", fontVariant: ["tabular-nums"] }}
              >
                Total {notes?.length ?? 0}
              </Text>
            </View>

            <View
              style={{
                borderRadius: 12,
                borderCurve: "continuous",
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "rgba(239, 68, 68, 0.22)",
              }}
            >
              <Text
                selectable
                style={{ color: "#fecaca", fontWeight: "700", fontVariant: ["tabular-nums"] }}
              >
                High {highPriorityCount}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {registrationError ? (
        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            padding: 12,
            backgroundColor: "#fef2f2",
          }}
        >
          <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
            Notification setup: {registrationError}
          </Text>
        </View>
      ) : null}

      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>Notes</Text>
        {editError ? (
          <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
            {editError}
          </Text>
        ) : null}

        {notes === undefined ? (
          <Text selectable style={{ color: "#64748b" }}>
            Loading notes...
          </Text>
        ) : notes.length === 0 ? (
          <Text selectable style={{ color: "#64748b", lineHeight: 20 }}>
            No notes yet. Tap the center plus tab to create your first note.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {notes.map((note) => {
              const colors = priorityPalette(note.priority);
              const isEditing = editingNoteId === note._id;
              const isSavingThisNote = isEditing && isSavingEdit;
              const isSilenced = note.isSilenced === true;

              return (
                <View
                  key={note._id}
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    borderCurve: "continuous",
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: "#f8fafc",
                    padding: 12,
                    gap: 10,
                  }}
                >
                  {isSilenced ? (
                    <View
                      style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        zIndex: 1,
                        borderRadius: 999,
                        borderCurve: "continuous",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: "#e2e8f0",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: "#334155", fontWeight: "700" }}>🔕</Text>
                    </View>
                  ) : null}

                  {isEditing ? (
                    <TextInput
                      multiline
                      value={draftContent}
                      onChangeText={setDraftContent}
                      placeholder="Update your note"
                      style={{
                        minHeight: 96,
                        borderRadius: 12,
                        borderCurve: "continuous",
                        borderWidth: 1,
                        borderColor: "#cbd5e1",
                        padding: 10,
                        fontSize: 16,
                        color: "#0f172a",
                        textAlignVertical: "top",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  ) : (
                    <Text selectable style={{ color: "#0f172a", fontSize: 16, lineHeight: 22 }}>
                      {note.content}
                    </Text>
                  )}

                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {priorities.map((priority) => {
                      const isSelected = note.priority === priority;
                      return (
                        <Pressable
                          key={priority}
                          accessibilityRole="button"
                          disabled={isEditing}
                          onPress={() =>
                            void updateNote({
                              noteId: note._id,
                              content: note.content,
                              priority,
                            })
                          }
                          style={{
                            borderRadius: 10,
                            borderCurve: "continuous",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            backgroundColor: isSelected ? colors.badge : "#e2e8f0",
                            opacity: isEditing ? 0.55 : 1,
                          }}
                        >
                          <Text
                            style={{
                              textTransform: "capitalize",
                              color: isSelected ? "#ffffff" : "#334155",
                              fontWeight: "700",
                            }}
                          >
                            {priority}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text
                    selectable
                    style={{
                      color: colors.text,
                      fontSize: 13,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    Sent {note.timesSent} times • {formatLastSent(note.lastSentAt)}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    disabled={isSavingThisNote || isEditing}
                    onPress={() =>
                      void updateNote({
                        noteId: note._id,
                        content: note.content,
                        priority: note.priority,
                        isSilenced: !isSilenced,
                      })
                    }
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 10,
                      borderCurve: "continuous",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: isSilenced ? "#dcfce7" : "#e2e8f0",
                      opacity: isSavingThisNote || isEditing ? 0.55 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: isSilenced ? "#166534" : "#334155",
                        fontWeight: "700",
                      }}
                    >
                      {isSilenced ? "Silent" : "Silence"}
                    </Text>
                  </Pressable>

                  {isEditing ? (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={!draftContent.trim() || isSavingThisNote}
                        onPress={() => void saveEdit(note._id, note.priority)}
                        style={{
                          borderRadius: 10,
                          borderCurve: "continuous",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          backgroundColor: "#2563eb",
                          opacity: !draftContent.trim() || isSavingThisNote ? 0.55 : 1,
                        }}
                      >
                        <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                          {isSavingThisNote ? "Saving..." : "Save"}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={isSavingThisNote}
                        onPress={cancelEditing}
                        style={{
                          borderRadius: 10,
                          borderCurve: "continuous",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          backgroundColor: "#e2e8f0",
                          opacity: isSavingThisNote ? 0.55 : 1,
                        }}
                      >
                        <Text style={{ color: "#334155", fontWeight: "700" }}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => startEditing(note._id, note.content)}
                      style={{
                        alignSelf: "flex-start",
                        borderRadius: 10,
                        borderCurve: "continuous",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: "#dbeafe",
                      }}
                    >
                      <Text style={{ color: "#1d4ed8", fontWeight: "700" }}>Edit</Text>
                    </Pressable>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    disabled={isSavingThisNote}
                    onPress={() => requestDelete(note._id)}
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 10,
                      borderCurve: "continuous",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: "#fee2e2",
                      opacity: isSavingThisNote ? 0.55 : 1,
                    }}
                  >
                    <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Delete</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Modal
        visible={pendingDeleteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteId(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 20,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
          }}
        >
          <View
            style={{
              borderRadius: 14,
              borderCurve: "continuous",
              padding: 16,
              gap: 12,
              backgroundColor: "#ffffff",
            }}
          >
            <Text selectable style={{ fontSize: 17, fontWeight: "700", color: "#0f172a" }}>
              Delete note?
            </Text>
            <Text selectable style={{ color: "#334155", lineHeight: 20 }}>
              This action cannot be undone.
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPendingDeleteId(null)}
                style={{
                  borderRadius: 10,
                  borderCurve: "continuous",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "#e2e8f0",
                }}
              >
                <Text style={{ color: "#334155", fontWeight: "700" }}>Cancel</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const noteId = pendingDeleteId;
                  setPendingDeleteId(null);
                  if (noteId) {
                    void removeNote({ noteId });
                  }
                }}
                style={{
                  borderRadius: 10,
                  borderCurve: "continuous",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "#fee2e2",
                }}
              >
                <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
