declare module "@clerk/clerk-expo" {
  import type React from "react";

  type GetToken = (options?: {
    template?: "convex";
    skipCache?: boolean;
  }) => Promise<string | null>;

  export const ClerkProvider: React.ComponentType<Record<string, unknown>>;

  export function useAuth(): {
    isLoaded: boolean;
    isSignedIn: boolean | undefined;
    getToken: GetToken;
    orgId: string | null | undefined;
    orgRole: string | null | undefined;
    signOut: () => Promise<void>;
  };

  export function useSSO(): {
    startSSOFlow: (args: {
      strategy: "oauth_google";
      redirectUrl: string;
    }) => Promise<{
      createdSessionId?: string;
      setActive?: (args: { session: string }) => Promise<void>;
    }>;
  };
}

declare module "@clerk/clerk-expo/token-cache" {
  export const tokenCache: {
    getToken: (key: string) => Promise<string | null>;
    saveToken: (key: string, token: string) => Promise<void>;
    clearToken: (key: string) => Promise<void>;
  };
}
