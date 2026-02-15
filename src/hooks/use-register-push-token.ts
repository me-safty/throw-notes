import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React from "react";

import { api } from "@/convex/_generated/api";

export function useRegisterPushToken(enabled: boolean) {
  const upsertPushToken = useMutation(api.pushTokens.upsertMyPushToken);
  const [registrationError, setRegistrationError] = React.useState<string | null>(
    null,
  );
  const attemptedRegistrationRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || attemptedRegistrationRef.current || !Device.isDevice) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      try {
        attemptedRegistrationRef.current = true;

        const currentPermissions = await Notifications.getPermissionsAsync();
        let finalStatus = currentPermissions.status;

        if (finalStatus !== "granted") {
          const requestedPermissions =
            await Notifications.requestPermissionsAsync();
          finalStatus = requestedPermissions.status;
        }

        if (finalStatus !== "granted") {
          throw new Error("Notifications permission was denied.");
        }

        const projectId =
          Constants.easConfig?.projectId ??
          Constants.expoConfig?.extra?.eas?.projectId;

        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );

        const platform =
          process.env.EXPO_OS === "ios"
            ? "ios"
            : process.env.EXPO_OS === "android"
              ? "android"
              : "web";

        await upsertPushToken({
          token: tokenResponse.data,
          platform,
        });

        if (!cancelled) {
          setRegistrationError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setRegistrationError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not register push token.",
          );
        }
      }
    };

    void register();

    return () => {
      cancelled = true;
    };
  }, [enabled, upsertPushToken]);

  return { registrationError };
}
