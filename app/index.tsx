import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { GoogleSignInCard } from "@/src/features/auth/google-sign-in-card";
import { HomeScreen } from "@/src/features/home/home-screen";

export default function IndexScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
        gap: 16,
      }}
    >
      <AuthLoading>
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            borderCurve: "continuous",
            backgroundColor: "#f8fafc",
          }}
        >
          <Text selectable style={{ fontSize: 16, color: "#334155" }}>
            Loading session...
          </Text>
        </View>
      </AuthLoading>

      <Unauthenticated>
        <GoogleSignInCard />
      </Unauthenticated>

      <Authenticated>
        <HomeScreen />
      </Authenticated>
    </ScrollView>
  );
}
