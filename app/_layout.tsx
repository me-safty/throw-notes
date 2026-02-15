import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { createConvexClient } from "@/src/lib/convex";
import { env, isEnvReady } from "@/src/lib/env";
import "@/src/lib/notifications";

function MissingConfiguration() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          gap: 12,
          padding: 16,
          borderRadius: 18,
          borderCurve: "continuous",
          backgroundColor: "#f8fafc",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a" }}>
          Throw Notes Setup Needed
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22, color: "#334155" }}>
          Add EXPO_PUBLIC_CONVEX_URL and EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to
          your .env file before launching the app.
        </Text>
      </View>
    </ScrollView>
  );
}

export default function RootLayout() {
  if (!isEnvReady) {
    return <MissingConfiguration />;
  }

  const convex = React.useMemo(() => createConvexClient(env.convexUrl), []);

  return (
    <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Stack screenOptions={{ headerLargeTitle: true }}>
          <Stack.Screen name="index" options={{ title: "Throw Notes" }} />
        </Stack>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
