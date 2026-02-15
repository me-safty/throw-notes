const clerkDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ??
  "https://your-clerk-domain.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkDomain,
      applicationID: "convex",
    },
  ],
};
