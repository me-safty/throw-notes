import { useConvexAuth } from "convex/react";
import { Redirect } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { DynamicColorIOS, ScrollView, Text, View } from "react-native";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();

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

      <NativeTabs.Trigger name="add" disablePopToTop disableScrollToTop>
        <NativeTabs.Trigger.TabBar
          blurEffect="systemThickMaterial"
          backgroundColor="rgba(37, 99, 235, 0.12)"
        />
        <Icon
          sf={{
            default: "plus.circle",
            selected: "plus.circle.fill",
          }}
          selectedColor="#2563eb"
        />
        <Label>Add</Label>
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
  );
}
