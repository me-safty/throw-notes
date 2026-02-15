const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export const env = {
  convexUrl,
  clerkPublishableKey,
};

export const isEnvReady = Boolean(env.convexUrl && env.clerkPublishableKey);
