import { useConvexAuth } from "convex/react";
import { Redirect, useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import {
  DynamicColorIOS,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (isLoading) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 16,
            backgroundColor: "#f8fafc",
          }}
        >
          <Text selectable style={{ color: "#334155", fontSize: 16 }}>
            Preparing your workspace...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.container}>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        blurEffect="systemChromeMaterial"
        backgroundColor="rgba(248, 250, 252, 0.94)"
        shadowColor="rgba(15, 23, 42, 0.16)"
        tintColor={
          process.env.EXPO_OS === "ios"
            ? DynamicColorIOS({ light: "#0f172a", dark: "#f8fafc" })
            : "#0f172a"
        }
        labelStyle={{
          fontWeight: "700",
          fontSize: 11,
        }}
        iconColor={{
          default: "#64748b",
          selected: "#0f172a",
        }}
      >
        <NativeTabs.Trigger name="(home)">
          <Icon sf={{ default: "square.stack", selected: "square.stack.fill" }} />
          <Label>Notes</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(settings)">
          <Icon
            sf={{
              default: "slider.horizontal.3",
              selected: "slider.horizontal.3",
            }}
          />
          <Label>Settings</Label>
        </NativeTabs.Trigger>
      </NativeTabs>

      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        <View
          pointerEvents="box-none"
          style={[
            styles.fabContainer,
            {
              paddingBottom: Math.max(insets.bottom, 8) + 6,
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Add note"
            accessibilityRole="button"
            onPress={() => {
              router.push("/note-modal");
            }}
            style={({ pressed }) => [
              styles.fabButton,
              pressed ? styles.fabButtonPressed : null,
            ]}
          >
            <Text style={styles.fabPlus}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fabContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingHorizontal: 18,
  },
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248, 250, 252, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)",
  },
  fabButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  fabPlus: {
    fontSize: 31,
    lineHeight: 31,
    fontWeight: "500",
    color: "#0f172a",
    marginTop: -2,
  },
});
