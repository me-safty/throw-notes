import { useAuth } from "@clerk/clerk-expo";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery } from "convex/react";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { api } from "@/convex/_generated/api";
import { type Doc, type Id } from "@/convex/_generated/dataModel";
import { Card } from "@/src/components/card";
import { useRegisterPushToken } from "@/src/hooks/use-register-push-token";

type NoteItem = Doc<"notes">;

function formatLastSent(lastSentAt?: number) {
  if (!lastSentAt) {
    return "Never sent yet";
  }
  return `Last sent ${new Date(lastSentAt).toLocaleString()}`;
}

function priorityPalette(priority: NoteItem["priority"]) {
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
  const router = useRouter();

  const isExpoGo = Constants.appOwnership === "expo";
  const [pendingDeleteId, setPendingDeleteId] = React.useState<Id<"notes"> | null>(null);

  const { isSignedIn } = useAuth();
  const { registrationError } = useRegisterPushToken(Boolean(isSignedIn));

  const highPriorityCount = notes?.filter((note) => note.priority === "high").length ?? 0;

  const openNote = React.useCallback(
    (noteId: Id<"notes">) => {
      router.push({
        pathname: "/(tabs)/(home)/notes/[noteId]" as never,
        params: { noteId } as never,
      });
    },
    [router],
  );

  const toggleSilence = React.useCallback(
    (note: NoteItem) => {
      void updateNote({
        noteId: note._id,
        content: note.content,
        priority: note.priority,
        isSilenced: note.isSilenced !== true,
      });
    },
    [updateNote],
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

  const confirmExpoGoDelete = React.useCallback(() => {
    const noteId = pendingDeleteId;
    setPendingDeleteId(null);

    if (noteId) {
      void removeNote({ noteId });
    }
  }, [pendingDeleteId, removeNote]);

  const listHeader = React.useMemo(
    () => (
      <View style={{ gap: 16, paddingBottom: 16 }}>
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
            <Text style={{ color: "#ffffff", fontSize: 23, fontWeight: "700" }}>Throw Notes</Text>
            <Text selectable style={{ color: "#cbd5e1", lineHeight: 20 }}>
              Swipe left for quick actions. Tap a note to open and edit with autosave.
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

        <Text selectable style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
          Notes
        </Text>
      </View>
    ),
    [highPriorityCount, notes?.length, registrationError],
  );

  return (
    <>
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
        data={notes ?? []}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <Text selectable style={{ color: "#64748b", lineHeight: 20 }}>
            {notes === undefined
              ? "Loading notes..."
              : "No notes yet. Tap the center plus tab to create your first note."}
          </Text>
        }
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const colors = priorityPalette(item.priority);
          const isSilenced = item.isSilenced === true;

          return (
            <ReanimatedSwipeable
              friction={2}
              rightThreshold={40}
              renderRightActions={(_progress, _translation, swipeableMethods) => (
                <View style={{ flexDirection: "row", alignItems: "stretch", gap: 8, paddingLeft: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      swipeableMethods.close();
                      toggleSilence(item);
                    }}
                    style={{
                      minWidth: 82,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      backgroundColor: isSilenced ? "#dcfce7" : "#e2e8f0",
                    }}
                  >
                    <Text
                      style={{
                        color: isSilenced ? "#166534" : "#334155",
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      {isSilenced ? "Unsilence" : "Silence"}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      swipeableMethods.close();
                      requestDelete(item._id);
                    }}
                    style={{
                      minWidth: 74,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      backgroundColor: "#fee2e2",
                    }}
                  >
                    <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }}>Delete</Text>
                  </Pressable>
                </View>
              )}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => openNote(item._id)}
                style={{
                  borderRadius: 14,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: "#f8fafc",
                  padding: 12,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View
                    style={{
                      borderRadius: 999,
                      borderCurve: "continuous",
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      backgroundColor: colors.badge,
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "700", textTransform: "capitalize" }}>
                      {item.priority}
                    </Text>
                  </View>

                  {isSilenced ? (
                    <Text selectable style={{ color: "#334155", fontSize: 12, fontWeight: "700" }}>
                      Silent
                    </Text>
                  ) : null}
                </View>

                <Text selectable numberOfLines={4} style={{ color: "#0f172a", fontSize: 16, lineHeight: 22 }}>
                  {item.content}
                </Text>

                <Text
                  selectable
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  Sent {item.timesSent} times • {formatLastSent(item.lastSentAt)}
                </Text>
              </Pressable>
            </ReanimatedSwipeable>
          );
        }}
      />

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
                onPress={confirmExpoGoDelete}
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
    </>
  );
}
