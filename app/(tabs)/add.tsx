import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function AddTabRoute() {
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        router.push("/(tabs)/(home)/notes/new" as never);
      }, 0);

      return () => {
        clearTimeout(timeout);
      };
    }, [router]),
  );

  return <View style={{ flex: 1, backgroundColor: "#eef2ff" }} />;
}
