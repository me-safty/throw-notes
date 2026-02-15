# Throw Notes

Throw Notes is an Expo + Convex app for weighted random note reminders.

## What It Does

- Store notes with `low`, `medium`, or `high` priority.
- Add one or more daily reminder times (for example `13:00` or `09:00` + `18:00`).
- Convex cron checks due schedules every minute.
- For each due schedule, Convex picks a random note with weighted priority:
  - high priority has a higher base chance
  - notes sent recently are down-weighted
  - notes sent many times are down-weighted
- Convex sends push notifications through Expo Push API.

## Stack

- Expo Router + React Native
- Convex (database, functions, scheduler, cron)
- Clerk (Google SSO only)
- Expo Notifications

## 1. Install

```bash
npm install
```

## 2. Environment

Create `.env` from `.env.example` and fill:

```bash
EXPO_PUBLIC_CONVEX_URL=...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

For Convex backend auth, set this in Convex env:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-domain.clerk.accounts.dev
```

## 3. Clerk Setup

1. In Clerk, enable **Google** provider.
2. Create a JWT template named **`convex`**.
3. Put your Clerk publishable key in `.env` as `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
4. Set redirect URI/scheme support for Expo (`thrownotes://`).

## 4. Convex Setup

```bash
npx convex dev
```

This generates `convex/_generated/*` files and starts local Convex dev.

## 5. Run App

```bash
npm start
```

Open with Expo Go first.

## Key Files

- `app/_layout.tsx` provider setup (Clerk + Convex)
- `app/index.tsx` auth gate + home route
- `src/features/home/home-screen.tsx` notes/schedules UI
- `convex/schema.ts` database model
- `convex/notes.ts` note CRUD
- `convex/schedules.ts` schedule CRUD
- `convex/notifications.ts` weighted random selection + push dispatch
- `convex/crons.ts` every-minute schedule processing
