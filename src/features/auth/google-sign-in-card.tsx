import { useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/src/components/card";

WebBrowser.maybeCompleteAuthSession();

export function GoogleSignInCard() {
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const redirectUrl = React.useMemo(
    () => AuthSession.makeRedirectUri({ scheme: "thrownotes" }),
    [],
  );

  const signInWithGoogle = React.useCallback(async () => {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (result.createdSessionId) {
        await result.setActive?.({ session: result.createdSessionId });
        return;
      }

      setError("Google sign-in needs extra steps. Complete them in the browser.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in with Google.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, redirectUrl, startSSOFlow]);

  return (
    <Card>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a" }}>
        Throw Notes
      </Text>
      <Text selectable style={{ fontSize: 16, lineHeight: 22, color: "#334155" }}>
        Capture notes, rank them by priority, and get weighted random reminders.
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={signInWithGoogle}
        style={{
          borderRadius: 14,
          borderCurve: "continuous",
          paddingVertical: 12,
          paddingHorizontal: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isLoading ? "#64748b" : "#0f172a",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#ffffff",
          }}
        >
          {isLoading ? "Opening Google..." : "Continue with Google"}
        </Text>
      </Pressable>

      {error ? (
        <View
          style={{
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: "#fef2f2",
            padding: 12,
          }}
        >
          <Text selectable style={{ color: "#b91c1c", lineHeight: 20 }}>
            {error}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
