import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/src/components/card";

export type NotePriority = "low" | "medium" | "high";

type CreateNoteFormProps = {
  onCreate: (args: { content: string; priority: NotePriority }) => Promise<void>;
};

const priorities: NotePriority[] = ["low", "medium", "high"];

export function CreateNoteForm({ onCreate }: CreateNoteFormProps) {
  const [content, setContent] = React.useState("");
  const [priority, setPriority] = React.useState<NotePriority>("medium");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const submit = React.useCallback(async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate({ content: trimmedContent, priority });
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  }, [content, isSubmitting, onCreate, priority]);

  return (
    <Card>
      <Text style={{ fontSize: 19, fontWeight: "700", color: "#0f172a" }}>
        Add Note
      </Text>

      <TextInput
        multiline
        value={content}
        onChangeText={setContent}
        placeholder="Write a note you want to remember"
        style={{
          minHeight: 96,
          borderRadius: 14,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#cbd5e1",
          padding: 12,
          fontSize: 16,
          color: "#0f172a",
          textAlignVertical: "top",
          backgroundColor: "#ffffff",
        }}
      />

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155" }}>
          Priority
        </Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {priorities.map((item) => {
            const selected = item === priority;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => setPriority(item)}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  paddingVertical: 9,
                  alignItems: "center",
                  backgroundColor: selected ? "#0f172a" : "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    textTransform: "capitalize",
                    fontWeight: "700",
                    color: selected ? "#ffffff" : "#334155",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
          {isSubmitting ? "Saving..." : "Save Note"}
        </Text>
      </Pressable>
    </Card>
  );
}
