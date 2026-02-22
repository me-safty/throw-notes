import Constants from "expo-constants";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { type NotePriority } from "@/src/features/notes/create-note-form";

type PriorityMenuProps = {
  value: NotePriority;
  onChange: (priority: NotePriority) => void;
  disabled?: boolean;
};

const priorities: NotePriority[] = ["low", "medium", "high"];

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function PriorityMenu({ value, onChange, disabled = false }: PriorityMenuProps) {
  const [isCustomMenuOpen, setIsCustomMenuOpen] = React.useState(false);

  const DropdownMenu = React.useMemo(() => {
    if (Constants.appOwnership === "expo") {
      return null;
    }

    try {
      return require("zeego/dropdown-menu") as {
        Root: React.ComponentType<{ children: React.ReactNode }>;
        Trigger: React.ComponentType<{ asChild?: boolean; children: React.ReactNode }>;
        Content: React.ComponentType<{ children: React.ReactNode; align?: "start" | "center" | "end"; sideOffset?: number }>;
        Item: React.ComponentType<{ children: React.ReactNode; key?: string; onSelect?: () => void }>;
        ItemTitle: React.ComponentType<{ children: React.ReactNode }>;
      };
    } catch {
      return null;
    }
  }, []);

  if (DropdownMenu) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            style={{
              borderRadius: 10,
              borderCurve: "continuous",
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: "#e2e8f0",
              opacity: disabled ? 0.55 : 1,
            }}
          >
            <Text style={{ color: "#334155", fontWeight: "700" }}>Options</Text>
          </Pressable>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end" sideOffset={8}>
          {priorities.map((priority) => (
            <DropdownMenu.Item key={priority} onSelect={() => onChange(priority)}>
              <DropdownMenu.ItemTitle>
                {value === priority ? `✓ ${capitalize(priority)}` : capitalize(priority)}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setIsCustomMenuOpen(true)}
        style={{
          borderRadius: 10,
          borderCurve: "continuous",
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: "#e2e8f0",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <Text style={{ color: "#334155", fontWeight: "700" }}>Options</Text>
      </Pressable>

      <Modal
        visible={isCustomMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustomMenuOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsCustomMenuOpen(false)}
          style={{
            flex: 1,
            justifyContent: "flex-start",
            alignItems: "flex-end",
            paddingTop: 86,
            paddingRight: 16,
            backgroundColor: "rgba(15, 23, 42, 0.08)",
          }}
        >
          <View
            style={{
              minWidth: 160,
              borderRadius: 12,
              borderCurve: "continuous",
              padding: 6,
              gap: 4,
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.16)",
            }}
          >
            {priorities.map((priority) => {
              const selected = value === priority;

              return (
                <Pressable
                  key={priority}
                  accessibilityRole="button"
                  onPress={() => {
                    setIsCustomMenuOpen(false);
                    onChange(priority);
                  }}
                  style={{
                    borderRadius: 10,
                    borderCurve: "continuous",
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    backgroundColor: selected ? "#e0f2fe" : "transparent",
                  }}
                >
                  <Text style={{ color: "#0f172a", fontWeight: selected ? "700" : "600" }}>
                    {selected ? `✓ ${capitalize(priority)}` : capitalize(priority)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
