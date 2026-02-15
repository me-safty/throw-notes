import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function AddTabRoute() {
  const router = useRouter();
  const returnToHomeOnNextFocusRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        if (returnToHomeOnNextFocusRef.current) {
          returnToHomeOnNextFocusRef.current = false;
          router.replace("/(tabs)/(home)");
          return;
        }

        returnToHomeOnNextFocusRef.current = true;
        router.push("/note-modal");
      }, 0);

      return () => {
        clearTimeout(timeout);
      };
    }, [router]),
  );

  return <View style={{ flex: 1, backgroundColor: "#eef2ff" }} />;
}
